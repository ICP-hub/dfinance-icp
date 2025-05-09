use candid:: Nat;
use crate::calculation_testing::linear_interest::calculate_linear_interest;
use crate::utils::constant_variables::SCALING_FACTOR;
use crate::utils::error as errors;
use crate::utils::structs::*;
use std::ops::Mul;


pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
}
fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
}

impl ScalingMath for Nat {
    fn scaled_mul(self, other: Nat) -> Nat {
        self.mul(other) / get_scaling_value()
    }
}

/*
 * @title User Normalized Supply
 * @notice Computes the updated liquidity index based on interest rates.
 * @dev Returns the stored index if no update is needed; otherwise, applies linear interest.
 * @param reserve_data - Reserve data containing rate and index information.
 * @return The updated liquidity index for the reserve.
 * @functionality Updates liquidity index based on linear interest since last update.
 */
pub fn user_normalized_supply(reserve_data: ReserveData) -> Result<Nat, errors::Error> {
    let current_time = 1_700_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
         Ok(reserve_data.liquidity_index)
    } else {
        let cumulated_liquidity_interest = calculate_linear_interest(
            reserve_data.current_liquidity_rate,
            reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "previoys liquidity index: {} for reserve",
            reserve_data.liquidity_index
        );
        //  user_reserve_data.liquidity_index =
        Ok(cumulated_liquidity_interest.scaled_mul(reserve_data.liquidity_index))
    }
}