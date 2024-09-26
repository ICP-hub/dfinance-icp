use candid::{CandidType, Deserialize, Principal};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};

use crate::{declarations::assets::ReserveData, protocol::libraries::types::datatypes::UserData};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: f64,
    pub total_borrowed_value: f64,
    pub liquidation_threshold: f64,
}
pub fn calculate_health_factor(position: &UserPosition) -> f64 {
    if position.total_borrowed_value == 0.0 {
        return f64::INFINITY; 
    }

    (position.total_collateral_value * position.liquidation_threshold)
        / position.total_borrowed_value
}

pub fn calculate_ltv(position: &UserPosition) -> f64 {
    if position.total_collateral_value == 0.0 {
        return 0.0; 
    }

    position.total_borrowed_value / position.total_collateral_value
}

pub fn calculate_average_threshold(amount: f64, reserve: &ReserveData, user: UserData) -> f64 {
    let reserve_liq_thres = reserve.configuration.liquidation_threshold;
    let user_liq_thres = user.liquidation_threshold.unwrap();
    let user_total_collateral = user.total_collateral.unwrap();

    let num = (amount * reserve_liq_thres as f64) + (user_total_collateral * user_liq_thres);

    let deno = reserve_liq_thres as f64 * user_liq_thres;

    num / deno
}

// ------------ Real time asset data using XRC ------------

#[ic_cdk_macros::update]
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    amount: f64,
) -> Result<(f64, u64), String> {
    let base_asset = if base_asset_symbol == "ckBTC" {
        "btc".to_string()
    } else if base_asset_symbol == "ckETH" {
        "eth".to_string()
    } else if base_asset_symbol == "ckUSDC" {
        "usdc".to_string()
    } else {
        base_asset_symbol.to_string()
    };

    let args = GetExchangeRateRequest {
        timestamp: None,
        quote_asset: Asset {
            class: AssetClass::Cryptocurrency,
            symbol: "USDT".to_string(),
        },
        base_asset: Asset {
            class: AssetClass::Cryptocurrency,
            symbol: base_asset.clone(),
        },
    };

    let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> =
        ic_cdk::api::call::call_with_payment128(
            Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai").unwrap(),
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
                let exchange_rate = quote as f64 / pow as f64;

                // Multiplying the exchange rate by the amount
                let total_value = exchange_rate * amount;

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

// ------------ Manual exchange rate ------------

// const CONVERSION_RATE_CKBTC_TO_USD: f64 = 62353.75;
// const CONVERSION_RATE_CKETH_TO_USD: f64 = 2617.19;
// const CONVERSION_RATE_CKUSDC_TO_USD: f64 = 1.0;

// fn get_conversion_rate_to_usd(asset: &str) -> Option<f64> {
//     match asset {
//         "ckBTC" => Some(CONVERSION_RATE_CKBTC_TO_USD),
//         "ckETH" => Some(CONVERSION_RATE_CKETH_TO_USD),
//         "ckUSDC" => Some(CONVERSION_RATE_CKUSDC_TO_USD),
//         _ => None,
//     }
// }

// pub fn exchange_rate(asset_from: &str, amount: f64) -> Result<f64, String> {

//     let rate_from_usd = get_conversion_rate_to_usd(asset_from)
//         .ok_or(format!("Unsupported asset: {}", asset_from))?;

//     let amount_in_usd = amount * rate_from_usd;

//     Ok(amount_in_usd)
// }
