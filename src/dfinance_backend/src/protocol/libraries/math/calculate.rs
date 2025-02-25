use crate::api::functions::request_limiter;
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::storable::Candid;
use crate::guards::check_is_tester;
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
/*
 * @title Maximum Value Helper
 * @dev Returns the maximum possible value that can be stored in a `Nat` type.
 *      This value is `2^128 - 1`, representing the largest unsigned 128-bit integer.
 * @returns `Nat` - The maximum possible `Nat` value.
 */
fn get_max_value() -> Nat {
    Nat::from(340_282_366_920_938_463_463_374_607_431_768_211_455u128)
}
/*
 * @title Price Cache Management
 * @dev Handles storing and retrieving cached prices of assets to avoid redundant calls.
 *      Allows fetching and updating asset exchange rates efficiently.
 */
impl PriceCache {
    /*
     * @title Get Cached Price
     * @dev Retrieves the cached exchange rate for a given asset, if available.
     * @param asset The name of the asset (e.g., "ckBTC", "ckETH").
     * @returns Option<Nat> - Returns the cached price if it exists, otherwise `None`.
     */
    pub fn get_cached_price_simple(&self, asset: &str) -> Option<Nat> {
        self.cache
            .get(asset)
            .map(|cached_price| cached_price.price.clone())
    }
    /*
     * @title Set Cached Price
     * @dev Updates the cached price for a specific asset.
     * @param asset The name of the asset.
     * @param price The latest exchange rate for the asset.
     */
    pub fn set_price(&mut self, asset: String, price: Nat) {
        self.cache.insert(asset, CachedPrice { price });
    }
}
/*
 * @title Update Reserve Prices
 * @dev Fetches the latest exchange rates for all reserves and updates the cache.
 *      This function iterates through all the registered reserves and fetches new prices.
 */
#[update]
pub async fn update_reserves_price() -> Result<(), Error> {
    if let Err(e) = request_limiter() {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }
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
/*
 * @title Update Token Price
 * @dev Fetches the latest exchange rate for a single asset and updates the cache.
 * @param asset The name of the asset whose price needs to be updated.
 */
#[update]
pub async fn update_token_price(asset: String) -> Result<(), Error> {

    if let Err(e) = request_limiter() {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }
    
    if let Err(e) = get_exchange_rates(asset, None, Nat::from(1u128)).await {
        return Err(e);
    };

    Ok(())
}
/*
 * @title Query Reserve Prices
 * @dev Fetches the cached price data of all available assets from the state.
 * @returns Vec<PriceCache> - A list of cached prices for each asset.
 */
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
/*
 * @title User Financial Position
 * @dev Represents a user's position in terms of collateral, borrowings, and liquidation threshold.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: Nat,
    pub total_borrowed_value: Nat,
    pub liquidation_threshold: Nat,
}

/*
 * @title Fetch Exchange Rates
 * @dev Fetches the latest exchange rate of a given base asset against a quote asset.
 *      Supports both cryptocurrency and fiat asset classes.
 * @param base_asset_symbol The base asset for which exchange rate is needed.
 * @param quote_asset_symbol The asset against which the base asset is quoted. Defaults to USDT.
 * @param amount The amount of the base asset to convert.
 * @returns Result<(Nat, u64), ()> - Returns the exchange rate value and the timestamp.
 */
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
        None => "USDT".to_string(),
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
                // Ask : should i handle the error here or not.
                let exchange_rate = (Nat::from(quote) * Nat::from(SCALING_FACTOR))
                    / (Nat::from(pow) - Nat::from(SCALING_FACTOR));
                ic_cdk::println!("exchange rate = {}", exchange_rate);

                let total_value =
                    (Nat::from(quote) * amount) / (Nat::from(pow) - Nat::from(SCALING_FACTOR));

                let time = ic_cdk::api::time();

                // Fetching price-cache data
                ic_cdk::println!("exchange rate");
                if quote_asset == "USDT" {
                    ic_cdk::println!("base asset to check = {}", base_asset);
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

#[update]
pub async fn update_reserve_price_test() -> Result<(), Error> {
    if !check_is_tester() {
        ic_cdk::println!("Invalid User");
        return Err(Error::InvalidUser);
    };

    let manual_prices: HashMap<String, Nat> = vec![
        ("ckBTC".to_string(), Nat::from(10934116666666u128)),
        ("ckETH".to_string(), Nat::from(302148333333u128)),
        ("ICP".to_string(), Nat::from(819611111u128)),
        ("ckUSDC".to_string(), Nat::from(111094444u128)),
        ("ckUSDT".to_string(), Nat::from(111111111u128)),
    ]
    .into_iter()
    .collect();

    let keys: Vec<String> = read_state(|state| {
        state
            .reserve_list
            .iter()
            .map(|(key, _)| key.clone())
            .collect()
    });

    ic_cdk::println!("Keys (assets) = {:?}", keys);

    for base_asset_symbol in keys {
        ic_cdk::println!("Updating test price for asset: {}", base_asset_symbol);
        let base_asset = match base_asset_symbol.as_str() {
            "ckBTC" => "btc".to_string(),
            "ckETH" => "eth".to_string(),
            "ckUSDC" => "usdc".to_string(),
            "ckUSDT" => "usdt".to_string(),
            _ => base_asset_symbol.clone(),
        };

        if let Some(price) = manual_prices.get(&base_asset_symbol) {
            ic_cdk::println!("Found manual price for {}: {:?}", base_asset_symbol, price);

            let price_cache_result: Result<PriceCache, String> = mutate_state(|state| {
                let price_cache_data = &mut state.price_cache_list;
                if let Some(price_cache) = price_cache_data.get(&base_asset) {
                    ic_cdk::println!(
                        "Existing price cache found for {}: {:?}",
                        base_asset_symbol,
                        price_cache.0
                    );
                    Ok(price_cache.0.clone())
                } else {
                    ic_cdk::println!("Creating new price cache for {}", base_asset_symbol);
                    let new_price_cache: PriceCache = PriceCache {
                        cache: HashMap::new(),
                    };
                    price_cache_data.insert(base_asset.clone(), Candid(new_price_cache.clone()));
                    Ok(new_price_cache)
                }
            });

            if let Ok(mut price_cache_data) = price_cache_result {
                ic_cdk::println!(
                    "Updating price cache for {} with new price: {:?}",
                    base_asset_symbol,
                    price
                );
                price_cache_data.set_price(base_asset_symbol.clone(), price.clone());
                ic_cdk::println!("price cache after setting =  {:?}", price_cache_data.cache);

                mutate_state(|state| {
                    state
                        .price_cache_list
                        .insert(base_asset.clone(), Candid(price_cache_data.clone()));
                    ic_cdk::println!(
                        "Full state after update: {:?}",
                        state.price_cache_list.iter().collect::<Vec<_>>()
                    );
                });
            } else {
                ic_cdk::println!("Failed to update price cache for {}", base_asset_symbol);
                return Err(Error::ExchangeRateError);
            }
        } else {
            ic_cdk::println!("No manual price found for asset: {}", base_asset_symbol);
        }
    }
    ic_cdk::println!("Price update process completed successfully.");
    Ok(())
}
