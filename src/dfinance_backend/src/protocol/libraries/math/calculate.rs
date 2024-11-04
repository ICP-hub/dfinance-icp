use candid::{CandidType, Deserialize, Principal};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};
use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};

use super::math_utils::ScalingMath;

// Define the cached price structure
#[derive(Debug, Clone)]
struct CachedPrice {
    price: u128,
    timestamp: u64,
}

// Define the price cache structure
#[derive(Debug)]
pub struct PriceCache {
    cache: HashMap<String, CachedPrice>,
    cache_duration: Duration,
}

impl PriceCache {
    pub fn new(cache_duration: Duration) -> Self {
        Self {
            cache: HashMap::new(),
            cache_duration,
        }
    }

    // Simple cache implementation without duration check
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

    pub fn set_price(&mut self, asset: String, price: u128, timestamp: u64) {
        self.cache.insert(asset, CachedPrice { price, timestamp });
    }
}

thread_local! {
    static PRICE_CACHE: Arc<Mutex<PriceCache>> = Arc::new(Mutex::new(PriceCache::new(Duration::new(10, 0))));
}

pub fn with_price_cache<T, F: FnOnce(&mut PriceCache) -> T>(f: F) -> T {
    PRICE_CACHE.with(|cache| {
        let mut cache = cache.lock().unwrap();
        f(&mut *cache)
    })
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: u128,
    pub total_borrowed_value: u128,
    pub liquidation_threshold: u128,
}
pub fn calculate_health_factor(position: &UserPosition) -> u128 {
    if position.total_borrowed_value == 0 {
        return u128::MAX; //
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
//TODO resolve the error
#[ic_cdk_macros::update]
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    quote_asset_symbol: Option<String>,
    amount: u128,
) -> Result<(u128, u64), String> {
    ic_cdk::println!("amount in get asset = {}", amount);
    let base_asset = match base_asset_symbol.as_str() {
        "ckBTC" => "btc".to_string(),
        "ckETH" => "eth".to_string(),
        "ckUSDC" => "usdc".to_string(),
        "ckUSDT" => "usdt".to_string(),
        _ => base_asset_symbol.clone(),
    };

    let cached_price = with_price_cache(|cache| cache.get_cached_price_simple(&base_asset));
    // if let Some((cached_price, timestamp)) = cached_price {
    //     return Ok((cached_price * amount, timestamp));
    // }

    ic_cdk::println!("cached price = {:?}",cached_price);
    if let Some(cached_price) = cached_price {
        return Ok((cached_price * amount, 0));
    }

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
                let exchange_rate = quote / pow as u64;

                let total_value: u128 = (quote as u128 * amount) / (pow as u128 - 100000000);

                let time = ic_cdk::api::time();

                with_price_cache(|cache| {
                    cache.set_price(base_asset.clone(), exchange_rate as u128, time)
                });

                ic_cdk::println!("total value = {}", total_value);
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
