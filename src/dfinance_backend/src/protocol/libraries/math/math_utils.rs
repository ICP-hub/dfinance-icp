use candid::{CandidType, Principal};
use ic_cdk::api::time;
// use ic_cdk::export::candid::CandidType;
use std::convert::TryInto;

/// Ignoring leap years
const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;

#[derive(CandidType)]
pub struct MathUtils {}

impl MathUtils {
    /// Function to calculate linear interest
    pub fn calculate_linear_interest(rate: u128, last_update_timestamp: u64) -> Result<u128, String> {
        let current_timestamp = time().into_nanos() / 1_000_000_000;
        if current_timestamp <= last_update_timestamp {
            return Err("Invalid timestamp".to_string());
        }
        
        let time_delta = current_timestamp - last_update_timestamp;
        let result = rate * time_delta / SECONDS_PER_YEAR as u128;
        
        Ok(WadRayMath::RAY + result)
    }

    /// Function to calculate compounded interest
    pub fn calculate_compounded_interest(rate: u128, last_update_timestamp: u64, current_timestamp: u64) -> Result<u128, String> {
        if current_timestamp <= last_update_timestamp {
            return Err("Invalid timestamp".to_string());
        }

        let exp = current_timestamp - last_update_timestamp;

        if exp == 0 {
            return Ok(WadRayMath::RAY);
        }

        let exp_minus_one = exp - 1;
        let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };
        
        let base_power_two = WadRayMath::ray_mul(rate).checked_div(SECONDS_PER_YEAR * SECONDS_PER_YEAR as u128).ok_or("Overflow in calculation")?;
        let base_power_three = WadRayMath::ray_mul(base_power_two).checked_div(SECONDS_PER_YEAR as u128).ok_or("Overflow in calculation")?;

        let second_term = exp * exp_minus_one * base_power_two / 2;
        let third_term = exp * exp_minus_one * exp_minus_two * base_power_three / 6;

        let result = WadRayMath::RAY + rate * exp / SECONDS_PER_YEAR as u128 + second_term + third_term;

        Ok(result)
    }

    /// Calculates compounded interest with current block timestamp
    pub fn calculate_compounded_interest_current(rate: u128, last_update_timestamp: u64) -> Result<u128, String> {
        let current_timestamp = time().into_nanos() / 1_000_000_000;
        Self::calculate_compounded_interest(rate, last_update_timestamp, current_timestamp)
    }
}

/// Library to simulate Wad and Ray operations
#[derive(CandidType)]
struct WadRayMath {}

impl WadRayMath {
    /// Function to multiply and get the value in Ray
    pub fn ray_mul(value: u128) -> u128 {
        unimplemented!()
    }

    /// The value of the library is RAY
    pub const RAY: u128 = 1 << 224;
}
