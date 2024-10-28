use candid::{CandidType, Deserialize, Principal};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};

use super::math_utils::ScalingMath;

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
    }  else if base_asset_symbol == "ckUSDT" {
        "usdt".to_string()
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
            } else if symbol == "ckUSDT" {
                "usdt".to_string()
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
                // i am changing this id.
                // Principal::from_text("by6od-j4aaa-aaaaa-qaadq-cai").unwrap(),
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
                    ic_cdk::println!("pow {:?}",pow);
                    let exchange_rate = quote  / pow as u64 ;
    
                    // Multiplying the exchange rate by the amount
                    let total_value = ((quote as u128 * amount)) / (pow as u128 - 100000000) ;
    
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
    

