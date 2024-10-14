use candid::{CandidType, Deserialize, Principal};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};


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
        / position.total_borrowed_value                                    //check if need scaling
}

pub fn calculate_ltv(position: &UserPosition) -> u128 {
    if position.total_collateral_value == 0 {
        return 0; 
    }

    (position.total_borrowed_value / position.total_collateral_value) * 100000000  //scal_div
}

// pub fn calculate_average_threshold(amount: f64, reserve: &ReserveData, user: UserData) -> f64 {
//     let reserve_liq_thres = reserve.configuration.liquidation_threshold;
//     let user_liq_thres = user.liquidation_threshold.unwrap();
//     let user_total_collateral = user.total_collateral.unwrap();

//     let num = (amount * reserve_liq_thres as f64) + (user_total_collateral * user_liq_thres);

//     let deno = reserve_liq_thres as f64 * user_liq_thres;

//     num / deno
// }
pub fn cal_average_threshold(
    amount: u128, 
    amount_taken: u128,
    reserve_liq_thres: u128, 
    user_total_collateral: u128, 
    user_liq_thres: u128
) -> u128 {
    
    // let reserve_liq_thres_f64 = reserve_liq_thres as f64 / 100.0;
    
    // Perform the calculation
    let result =( (((amount * reserve_liq_thres) / 100000000)+ ((user_total_collateral * user_liq_thres)/100000000) - ((amount_taken * reserve_liq_thres)/100000000))   //scal_mul
        / (amount + user_total_collateral - amount_taken) ) * 100000000; //scal_div
    
    result
}

// ------------ Real time asset data using XRC ------------

// #[ic_cdk_macros::update]
// pub async fn get_exchange_rates(
//     base_asset_symbol: String,
//     amount: f64,
// ) -> Result<(f64, u64), String> {
//     let base_asset = if base_asset_symbol == "ckBTC" {
//         "btc".to_string()
//     } else if base_asset_symbol == "ckETH" {
//         "eth".to_string()
//     } else if base_asset_symbol == "ckUSDC" {
//         "usdc".to_string()
//     } else {
//         base_asset_symbol.to_string()
//     };

//     let args = GetExchangeRateRequest {
//         timestamp: None,
//         quote_asset: Asset {
//             class: AssetClass::Cryptocurrency,
//             symbol: "USDT".to_string(),
//         },
//         base_asset: Asset {
//             class: AssetClass::Cryptocurrency,
//             symbol: base_asset.clone(),
//         },
//     };

//     let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> =
//         ic_cdk::api::call::call_with_payment128(
//             Principal::from_text("by6od-j4aaa-aaaaa-qaadq-cai").unwrap(),
//             "get_exchange_rate",
//             (args,),
//             1_000_000_000,
//         )
//         .await;

//     match res {
//         Ok(res_value) => match res_value.0 {
//             GetExchangeRateResult::Ok(v) => {
//                 let quote = v.rate;
//                 let pow = 10usize.pow(v.metadata.decimals);
//                 let exchange_rate = quote as f64 / pow as f64;

//                 // Multiplying the exchange rate by the amount
//                 let total_value = exchange_rate * amount;

//                 // Getting the current time
//                 let time = ic_cdk::api::time();

//                 // Return the total value and the time
//                 Ok((total_value, time))
//             }
//             GetExchangeRateResult::Err(e) => Err(format!("ERROR :: {:?}", e)),
//         },
//         Err(error) => Err(format!(
//             "Could not get USD/{} Rate - {:?} - {}",
//             base_asset_symbol.clone(),
//             error.0,
//             error.1
//         )),
//     }
// }

#[ic_cdk_macros::update]
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    quote_asset_symbol: Option<String>, // Make the quote_asset_symbol optional
    amount: u128,
) -> Result<(u128, u64), String> {
    // Map the base asset to its corresponding cryptocurrency symbol
    let base_asset = if base_asset_symbol == "ckBTC" {
        "btc".to_string()
    } else if base_asset_symbol == "ckETH" {
        "eth".to_string()
    } else if base_asset_symbol == "ckUSDC" {
        "usdc".to_string()
    } else {
        base_asset_symbol.to_string()
    };

    // If the quote_asset_symbol is provided, use it. Otherwise, default to "USDT".
    let quote_asset = match quote_asset_symbol {
        Some(symbol) => {
            if symbol == "ckBTC" {
                "btc".to_string()
            } else if symbol == "ckETH" {
                "eth".to_string()
            } else if symbol == "ckUSDC" {
                "usdc".to_string()
            } else if symbol == "USDT" {
                "USDT".to_string()
            } else {
                symbol.to_string()
            }
        }
        None => "USDT".to_string(), // Default quote asset to USDT if none is provided
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
                // Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai").unwrap(),
                Principal::from_text("uf6dk-hyaaa-aaaaq-qaaaq-cai").unwrap(),
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
                    let exchange_rate = quote  / pow as u64 ;
    
                    // Multiplying the exchange rate by the amount
                    let total_value = exchange_rate as u128 * amount;
    
                    // Getting the current time
                    let time = ic_cdk::api::time();
    
                    // Return the total value and the time
                    Ok((total_value, time))
                }
                GetExchangeRateResult::Err(e) => Err(format!("ERROR :: {:?}", e)),
            },
            Err(error) => Err(format!(
                "Could not get USD/{} Rate - {:?} - {}",
                base_asset_symbol.clone(),
                error.0,
                error.1
            )),
        }
    }
    


