use candid::{CandidType, Deserialize, Nat, Principal};
use std::ops::Add;

use crate::{declarations::assets::ReserveData, protocol::libraries::types::datatypes::UserData};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: f64,
    pub total_borrowed_value: f64,
    pub liquidation_threshold: f64, // e.g., 0.8 for 80%
}
pub fn calculate_health_factor(position: &UserPosition) -> f64 {
    if position.total_borrowed_value == 0.0 {
        return f64::INFINITY; // No debt, hence infinitely safe
    }

    (position.total_collateral_value * position.liquidation_threshold)
        / position.total_borrowed_value
}

pub fn calculate_ltv(position: &UserPosition) -> f64 {
    if position.total_collateral_value == 0.0 {
        return 0.0; // No collateral, LTV is 0
    }

    position.total_borrowed_value / position.total_collateral_value
}

pub fn calculate_average_threshold(amount: f64, reserve: &ReserveData, user: UserData) -> f64 {
    let reserve_liq_thres = 80; // reserve.config
    let user_liq_thres = user.liquidation_threshold.unwrap();
    let user_total_collateral = user.total_collateral.unwrap();

    let num = (amount * reserve_liq_thres as f64) + (user_total_collateral * user_liq_thres);

    let deno = reserve_liq_thres as f64 * user_liq_thres;

    num / deno
}

const CONVERSION_RATE_CKBTC_TO_USD: f64 = 62353.75; 
const CONVERSION_RATE_CKETH_TO_USD: f64 = 2617.19;   
const CONVERSION_RATE_CKUSDC_TO_USD: f64 = 1.0;    


fn get_conversion_rate_to_usd(asset: &str) -> Option<f64> {
    match asset {
        "ckBTC" => Some(CONVERSION_RATE_CKBTC_TO_USD),
        "ckETH" => Some(CONVERSION_RATE_CKETH_TO_USD),
        "ckUSDC" => Some(CONVERSION_RATE_CKUSDC_TO_USD),
        _ => None,
    }
}


pub fn exchange_rate(asset_from: &str, amount: f64) -> Result<f64, String> {
    
    let rate_from_usd = get_conversion_rate_to_usd(asset_from)
        .ok_or(format!("Unsupported asset: {}", asset_from))?;
    
  
    let amount_in_usd = amount * rate_from_usd;
    
    Ok(amount_in_usd)
}