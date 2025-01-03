use super::math_utils::ScalingMath;
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::storable::Candid;
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::{query, update};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct CachedPrice {
    pub price: Nat,
}

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct PriceCache {
    pub cache: HashMap<String, CachedPrice>,
}

fn get_max_value() -> Nat {
    Nat::from(340_282_366_920_938_463_463_374_607_431_768_211_455u128)
}

impl PriceCache {
    pub fn get_cached_price_simple(&self, asset: &str) -> Option<Nat> {
        self.cache
            .get(asset)
            .map(|cached_price| cached_price.price.clone())
    }

    pub fn set_price(&mut self, asset: String, price: Nat) {
        self.cache.insert(asset, CachedPrice { price });
    }
}

#[update]
pub async fn update_reserves_price() -> Result<(), Error> {
    // Fetch all the keys (asset names) from the reserve list
    let keys: Vec<String> = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .iter()
            .map(|(key, _value)| key.clone())
            .collect()
    });

    ic_cdk::println!("Keys (assets) = {:?}", keys);

    for asset_name in keys {
        ic_cdk::println!("Updating price for asset: {}", asset_name);

        match get_exchange_rates(asset_name.clone(), None, Nat::from(0u128)).await {
            Ok((exchange_rate, timestamp)) => {
                ic_cdk::println!(
                    "Successfully updated exchange rate for {}: {} at {}",
                    asset_name,
                    exchange_rate,
                    timestamp
                );
            }
            Err(err) => {
                ic_cdk::println!(
                    "Failed to update exchange rate for {}: {:?}",
                    asset_name,
                    err
                );
                return Err(Error::ExchangeRateError);
            }
        }
    }
    Ok(())
}

#[query]
pub fn queary_reserve_price() -> Vec<PriceCache> {
    let tokens = read_state(|state| {
        let cache_list = &state.price_cache_list;
        cache_list
            .iter()
            .map(|(_, price_cache)| price_cache.0)
            .collect::<Vec<PriceCache>>()
    });

    ic_cdk::println!("all tokens are = {:?}", tokens);
    tokens
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: Nat,
    pub total_borrowed_value: Nat,
    pub liquidation_threshold: Nat,
}
pub fn calculate_health_factor(position: &UserPosition) -> Nat {
    if position.total_borrowed_value == Nat::from(0u128) {
        return get_max_value();
    }

    (position.total_collateral_value.clone() * position.liquidation_threshold.clone())
        / position.total_borrowed_value.clone()
}

pub fn calculate_ltv(position: &UserPosition) -> Nat {
    if position.total_collateral_value == Nat::from(0u128) {
        return Nat::from(0u128);
    }

    position
        .total_borrowed_value
        .clone()
        .scaled_div(position.total_collateral_value.clone())
}

pub fn cal_average_threshold(
    amount: Nat,
    amount_taken: Nat,
    reserve_liq_thres: Nat,
    user_total_collateral: Nat,
    user_liq_thres: Nat,
) -> Nat {
    let numerator = (amount.clone().scaled_mul(reserve_liq_thres.clone()))
        + (user_total_collateral.clone().scaled_mul(user_liq_thres))
        - (amount_taken.clone().scaled_mul(reserve_liq_thres));

    let denominator = amount + user_total_collateral - amount_taken;

    if denominator == Nat::from(0u128) {
        return Nat::from(0u128);
    }

    let result = numerator.scaled_div(denominator);
    result
}

pub fn cal_average_ltv(
    amount: Nat,
    amount_taken: Nat,
    reserve_ltv: Nat,
    user_total_collateral: Nat,
    user_max_ltv: Nat,
) -> Nat {
    let numerator = (amount.clone().scaled_mul(reserve_ltv.clone()))
        + (user_total_collateral.clone().scaled_mul(user_max_ltv))
        - (amount_taken.clone().scaled_mul(reserve_ltv));

    let denominator = amount + user_total_collateral - amount_taken;

    if denominator == Nat::from(0u128) {
        return Nat::from(0u128);
    }

    let result = numerator.scaled_div(denominator);
    result
}

// ------------ Real time asset data using XRC ------------
#[ic_cdk_macros::update]
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    quote_asset_symbol: Option<String>,
    amount: Nat,
) -> Result<(Nat, u64), Error> {
    if base_asset_symbol.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if base_asset_symbol.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if let Some(asset) = quote_asset_symbol.clone() {
        if asset.trim().is_empty() {
            ic_cdk::println!("Asset cannot be an empty string");
            return Err(Error::EmptyAsset);
        }
        if asset.len() > 7 {
            ic_cdk::println!("Asset must have a maximum length of 7 characters");
            return Err(Error::InvalidAssetLength);
        }
    }

    let base_asset = match base_asset_symbol.as_str() {
        "ckBTC" => "btc".to_string(),
        "ckETH" => "eth".to_string(),
        "ckUSDC" => "usdc".to_string(),
        "ckUSDT" => "usdt".to_string(),
        _ => base_asset_symbol.clone(),
    };

    let quote_asset = match quote_asset_symbol {
        Some(symbol) => match symbol.as_str() {
            "ckBTC" => "btc".to_string(),
            "ckETH" => "eth".to_string(),
            "ckUSDC" => "usdc".to_string(),
            "ckUSDT" => "usdt".to_string(),
            _ => symbol,
        },
        None => "USD".to_string(),
    };

    let args = GetExchangeRateRequest {
        timestamp: None,
        quote_asset: Asset {
            class: if quote_asset == "USD" {
                AssetClass::FiatCurrency
            } else {
                AssetClass::Cryptocurrency
            },
            symbol: quote_asset.clone(),
        },
        base_asset: Asset {
            class: if base_asset == "USD" {
                AssetClass::FiatCurrency
            } else {
                AssetClass::Cryptocurrency
            },
            symbol: base_asset.clone(),
        },
    };
    let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> =
        ic_cdk::api::call::call_with_payment128(
            // Principal::from_text("by6od-j4aaa-aaaaa-qaadq-cai").unwrap(),
           Principal::from_text("by6od-j4aaa-aaaaa-qaadq-cai").unwrap(),
            "get_exchange_rate",
            (args,),
            1_000_000_000,
        )
        .await;

    match res {
        Ok(res_value) => match res_value.0 {
            GetExchangeRateResult::Ok(v) => {
                let quote = v.rate;
                let pow = 10usize.pow(v.metadata.decimals);
                ic_cdk::println!("quote = {}", quote);
                ic_cdk::println!("pow = {}", pow);
                let exchange_rate = (Nat::from(quote) * Nat::from(SCALING_FACTOR))
                    / (Nat::from(pow) - Nat::from(SCALING_FACTOR));
                ic_cdk::println!("exchange rate = {}", exchange_rate);

                let total_value =
                    (Nat::from(quote) * amount) / (Nat::from(pow) - Nat::from(SCALING_FACTOR));

                let time = ic_cdk::api::time();

                // Fetching price-cache data
                ic_cdk::println!("exchange rate");
                if quote_asset == "USD" {
                    let price_cache_result: Result<PriceCache, String> = mutate_state(|state| {
                        let price_cache_data = &mut state.price_cache_list;
                        if let Some(price_cache) = price_cache_data.get(&base_asset) {
                            ic_cdk::println!(
                                "calculate existing price cache = {:?}",
                                price_cache.0
                            );
                            Ok(price_cache.0.clone())
                        } else {
                            ic_cdk::println!("creating new price cache : not found");
                            let new_price_cache: PriceCache = PriceCache {
                                cache: HashMap::new(),
                            };
                            price_cache_data
                                .insert(base_asset.clone(), Candid(new_price_cache.clone()));
                            Ok(new_price_cache)
                        }
                    });

                    let mut price_cache_data: PriceCache = match price_cache_result {
                        Ok(data) => {
                            ic_cdk::println!("calculate price cache found: {:?}", data);
                            data
                        }
                        Err(e) => {
                            return Err(Error::NoPriceCache);
                        }
                    };

                    price_cache_data.set_price(base_asset_symbol.clone(), exchange_rate);
                    ic_cdk::println!("price cache after setting =  {:?}", price_cache_data);

                    // Save the updated price_cache_data back into the state
                    mutate_state(|state| {
                        state
                            .price_cache_list
                            .insert(base_asset.clone(), Candid(price_cache_data.clone()));
                    });
                }
                Ok((total_value, time))
            }
            GetExchangeRateResult::Err(e) => {
                ic_cdk::println!("Error: {:?}", e);
                Err(Error::ExchangeRateError)
            }
        },
        Err(error) => {
            ic_cdk::println!("Error: {:?}", error);
            Err(Error::ExchangeRateError)
        }
    }
}
