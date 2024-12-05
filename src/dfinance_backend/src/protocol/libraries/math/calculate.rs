use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};
use serde::Serialize;
use std::collections::HashMap;

use crate::api::state_handler::{mutate_state, read_state};
use crate::declarations::storable::Candid;

use super::math_utils::ScalingMath;

#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct CachedPrice {
    pub price: u128,
}

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct PriceCache {
    pub cache: HashMap<String, CachedPrice>,
}

impl PriceCache {

    pub fn get_cached_price_simple(&self, asset: &str) -> Option<u128> {
        self.cache.get(asset).map(|cached_price| cached_price.price)
    }

    // pub fn get_cached_price(&self, asset: &str) -> Option<(u128, u64)> {
    //     if let Some(cached_price) = self.cache.get(asset) {
    //         let current_time = SystemTime::now()
    //             .duration_since(SystemTime::UNIX_EPOCH)
    //             .expect("Time went backwards")
    //             .as_secs();
    //         if current_time - cached_price.timestamp <= self.cache_duration.as_secs() {
    //             return Some((cached_price.price, cached_price.timestamp));
    //         }
    //     }
    //     None
    // }

    pub fn set_price(&mut self, asset: String, price: u128) {
        self.cache.insert(asset, CachedPrice { price });
    }
}

// #[update]
// pub async fn update_reserves_price() {
//     let keys: Vec<String> = read_state(|state| {
//         let reserve_list = &state.reserve_list;

//         reserve_list
//             .iter()
//             .map(|(key, _value)| key.clone())
//             .collect()
//     });
//     ic_cdk::println!("keys = {:?}", keys);
//     for asset_name in keys {
//         ic_cdk::println!("asset name = {}", asset_name);
//         let _ = get_exchange_rates(asset_name, None, 0).await;
//     }
// }

#[update]
pub async fn update_reserves_price() {
    // Fetch all the keys (asset names) from the reserve list
    let keys: Vec<String> = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .iter()
            .map(|(key, _value)| key.clone())
            .collect()
    });

    ic_cdk::println!("Keys (assets) = {:?}", keys);

    // Iterate over all asset names and call `get_exchange_rates` for each
    for asset_name in keys {
        ic_cdk::println!("Updating price for asset: {}", asset_name);

        match get_exchange_rates(asset_name.clone(), None, 0).await {
            Ok((exchange_rate, timestamp)) => {
                ic_cdk::println!(
                    "Successfully updated exchange rate for {}: {} at {}",
                    asset_name,
                    exchange_rate,
                    timestamp
                );
            }
            Err(err) => {
                ic_cdk::println!("Failed to update exchange rate for {}: {}", asset_name, err);
            }
        }
    }
}


#[query]
pub fn queary_reserve_price() -> Vec<PriceCache>{
    let tokens = read_state(|state|{
        let cache_list  = &state.price_cache_list;
        cache_list.iter()
        .map(| (_, price_cache)| price_cache.0).collect::<Vec<PriceCache>>()
    });

    ic_cdk::println!("all tokens are = {:?}",tokens);
    tokens
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: u128,
    pub total_borrowed_value: u128,
    pub liquidation_threshold: u128,
}
pub fn calculate_health_factor(position: &UserPosition) -> u128 {
    if position.total_borrowed_value == 0 {
        return u128::MAX; 
    }

    (position.total_collateral_value * position.liquidation_threshold)
        / position.total_borrowed_value
}

pub fn calculate_ltv(position: &UserPosition) -> u128 {
    if position.total_collateral_value == 0 {
        return 0;
    }

    position
        .total_borrowed_value
        .scaled_div(position.total_collateral_value)
}

pub fn cal_average_threshold(
    amount: u128,
    amount_taken: u128,
    reserve_liq_thres: u128,
    user_total_collateral: u128,
    user_liq_thres: u128,
) -> u128 {
    let numerator = (amount.scaled_mul(reserve_liq_thres))
        + (user_total_collateral.scaled_mul(user_liq_thres))
        - (amount_taken.scaled_mul(reserve_liq_thres));

    let denominator = amount + user_total_collateral - amount_taken;

    if denominator == 0 {
        return 0u128;
    }

    let result = numerator.scaled_div(denominator);
    result
}

pub fn cal_average_ltv(
    amount: u128,
    amount_taken: u128,
    reserve_ltv: u128,
    user_total_collateral: u128,
    user_max_ltv: u128,
) -> u128 {
    let numerator = (amount.scaled_mul(reserve_ltv))
        + (user_total_collateral.scaled_mul(user_max_ltv))
        - (amount_taken.scaled_mul(reserve_ltv));

    let denominator = amount + user_total_collateral - amount_taken;

    if denominator == 0 {
        return 0u128;
    }

    let result = numerator.scaled_div(denominator);
    result
}

// ------------ Real time asset data using XRC ------------
#[ic_cdk_macros::update]
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    quote_asset_symbol: Option<String>,
    amount: u128,
) -> Result<(u128, u64), String> {
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
            class: AssetClass::Cryptocurrency,
            symbol: quote_asset.clone(),
        },
        base_asset: Asset {
            class: AssetClass::Cryptocurrency,
            symbol: base_asset.clone(),
        },
    };
    let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> =
        ic_cdk::api::call::call_with_payment128(
            Principal::from_text("a4tbr-q4aaa-aaaaa-qaafq-cai").unwrap(),
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
                let exchange_rate = (quote as u128 * 100000000) / (pow as u128 - 100000000);

                let total_value: u128 = (quote as u128 * amount) / (pow as u128 - 100000000);

                let time = ic_cdk::api::time();

                // Fetching price-cache data
                ic_cdk::println!("exchange rate");
                let price_cache_result: Result<PriceCache, String> = mutate_state(|state| {
                    let price_cache_data = &mut state.price_cache_list;
                    if let Some(price_cache) = price_cache_data.get(&base_asset) {
                        ic_cdk::println!("calculate existing price cache = {:?}", price_cache.0);
                        Ok(price_cache.0.clone())
                    } else {
                        ic_cdk::println!("creating new price cache : not found");
                        let new_price_cache = PriceCache {
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
                        panic!("{:?}", e);
                    }
                };

                price_cache_data.set_price(base_asset_symbol.clone(), exchange_rate as u128);
                ic_cdk::println!("price cache after setting =  {:?}", price_cache_data);

                // Save the updated price_cache_data back into the state
                mutate_state(|state| {
                    state
                        .price_cache_list
                        .insert(base_asset.clone(), Candid(price_cache_data.clone()));
                });
                
                Ok((total_value, time))
            }
            GetExchangeRateResult::Err(e) => Err(format!("ERROR :: {:?}", e)),
        },
        Err(error) => Err(format!(
            "Could not get USD/{} Rate - {:?} - {}",
            base_asset_symbol, error.0, error.1
        )),
    }
}

//  async fn check_and_update_prices() {
//         ic_cdk::spawn(async {
//             ASSET_INDEX.with(|asset_index| {
//                 let mut assets = asset_index.borrow().clone();

//                 for (asset_symbol, reserve_data) in assets.iter_mut() {
//                     // Fetch the current price using get_exchange_rates
//                     let current_price_result = get_exchange_rates(asset_symbol.clone(), Some("USD".to_string()), 1u128).await;

//                     match current_price_result {
//                         Ok((current_price, _timestamp)) => {
//                             // Compare current and previous prices (assuming `last_update_timestamp` stores the previous price)
//                             if current_price != reserve_data.prev_price {
//                                 // Fetch userlist and update user data
//                                 if let Some(userlist) = &reserve_data.userlist {
//                                     for (user_principal_str, _is_active) in userlist {
//                                         let user_principal = Principal::from_text(user_principal_str).unwrap(); // Convert string to Principal
//                                         update_user_data_for_asset(user_principal, asset_symbol.clone(), current_price).await;
//                                     }
//                                 }

//                                 // Update the asset's last price in ReserveData
//                                 reserve_data.current_liquidity_rate = current_price;
//                             }
//                         },
//                         Err(err) => {
//                             ic_cdk::println!("Error fetching exchange rate for asset {}: {}", asset_symbol, err);
//                         }
//                     }
//                 }
//             });
//         });
//     }

//     // Function to update user data for a specific asset if the price changes
//     async fn update_user_data_for_asset(user_principal: Principal, asset_symbol: String, new_price: u128) {
//         USER_PROFILES.with(|user_profiles| {
//             if let Some(user_data) = user_profiles.borrow_mut().get_mut(&user_principal) {
//                 if let Some(reserves) = &mut user_data.reserves {
//                     for (reserve_asset, reserve_data) in reserves.iter_mut() {
//                         if reserve_asset == &asset_symbol && reserve_data.is_using_as_collateral_or_borrow {
//                             // Update health factor or other user metrics based on the new price
//                             recalculate_health_factor(user_data, reserve_data, new_price);
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     // Function to recalculate the health factor based on the new price
//     fn recalculate_health_factor(user_data: &mut UserData, reserve_data: &mut UserReserveData, new_price: u128) {
//         // Example calculation of health factor (modify according to your business logic)
//         let new_health_factor = (reserve_data.asset_supply * new_price) / reserve_data.asset_borrow;
//         user_data.health_factor = Some(new_health_factor);

//         ic_cdk::println!("Updated health factor for user: {:?}", user_data);
//     }

//     // Timer initialization
//     #[init]
//     fn init() {
//         start_timer();
//         ic_cdk::println!("Timer initialized to check and update asset prices every minute.");
//     }

//     // Reinitialize the timer after upgrade
//     #[post_upgrade]
//     fn post_upgrade() {
//         init();
//     }

//     // Start the timer to call the function every 1 minute
//     #[update]
//     fn start_timer() {
//         TIMER_ID.with(|id| {
//             if id.borrow().is_none() {
//                 let timer_id = set_timer_interval(Duration::from_secs(60), check_and_update_prices);
//                 *id.borrow_mut() = Some(timer_id);
//                 ic_cdk::println!("Timer started.");
//             } else {
//                 ic_cdk::println!("Timer is already running.");
//             }
//         });
//     }

//     // Stop the timer dynamically
//     #[update]
//     fn stop_timer() {
//         TIMER_ID.with(|id| {
//             if let Some(timer_id) = id.borrow_mut().take() {
//                 clear_timer(timer_id);  // Clears the timer
//                 ic_cdk::println!("Timer stopped.");
//             } else {
//                 ic_cdk::println!("No active timer to stop.");
//             }
//         });
//     }

//     // Query to check if the timer is active
//     #[query]
//     fn timer_active() -> String {
//         TIMER_ID.with(|id| {
//             if id.borrow().is_some() {
//                 "Timer is active".to_string()
//             } else {
//                 "Timer is not active".to_string()
//             }
//         })
//     }
