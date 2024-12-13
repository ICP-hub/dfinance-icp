use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{CandidType, Deserialize, Nat};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: Nat,
    pub max_excess_usage_ratio: Nat,
    pub base_variable_borrow_rate: Nat,
    pub variable_rate_slope1: Nat,
    pub variable_rate_slope2: Nat,
}

pub fn initialize_interest_rate_params(asset: &str) -> InterestRateParams {
    ic_cdk::println!("asset name in initialize {:?}", asset.to_string());
    match asset {
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(45u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(55u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(30u128)),
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(45u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(55u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(30u128)), //review the value
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(45u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(55u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(30u128)), // review
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(80u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(20u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(75u128)),
        },
        "ckUSDT" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(92u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(20u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(75u128)),
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(80u128)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(20u128)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(0u128)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(4u128)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(75u128)),
        },
    }
}

fn calculate_utilization_rate(total_supply: Nat, total_borrowed: Nat) -> Nat {
    if total_supply == Nat::from(0u128) {
        Nat::from(0u128)
    } else {
        total_borrowed.scaled_div(total_supply) * Nat::from(100u128)
    }
}

pub fn calculate_interest_rates(
    total_supply: Nat,
    total_borrowed: Nat, //without interest
    total_debt: Nat,     //include interest
    borrow_rate: Nat,
    params: &InterestRateParams,
    reserve_factor: Nat,
) -> (Nat, Nat) {
    ic_cdk::println!("total debt: {:?}", total_debt);
    if total_debt == Nat::from(0u128) {
        return (Nat::from(0u128), params.base_variable_borrow_rate.clone());
    }

    let utilization_rate = calculate_utilization_rate(
        total_supply.clone() + total_debt.clone(),
        total_borrowed.clone(),
    );
    ic_cdk::println!("utilization_rate: {:?}", utilization_rate);
    let mut current_variable_borrow_rate = params.base_variable_borrow_rate.clone();
    ic_cdk::println!(
        "params.optimal_usage_ratio: {:?}",
        params.optimal_usage_ratio
    );
    if utilization_rate > params.optimal_usage_ratio {
        let excess_borrow_usage_ratio = (utilization_rate.clone() - params.optimal_usage_ratio.clone())
            .scaled_div(params.max_excess_usage_ratio.clone());

        current_variable_borrow_rate += params.variable_rate_slope1.clone()
            + params.variable_rate_slope2.clone() * excess_borrow_usage_ratio / Nat::from(100000000u128);
        ic_cdk::println!(
            "current_variable_borrow_rate: {:?}",
            current_variable_borrow_rate
        );
    } else {
        current_variable_borrow_rate += params
            .variable_rate_slope1.clone()
            .scaled_mul(utilization_rate.clone().scaled_div(params.optimal_usage_ratio.clone()));
    }

    let overall_borrow_rate =
        calculate_overall_borrow_rate(total_debt, current_variable_borrow_rate.clone());

    ic_cdk::println!("overall_borrow_rate: {:?}", overall_borrow_rate);
    let current_liquidity_rate = overall_borrow_rate
        .scaled_mul(utilization_rate / Nat::from(100u128))
        .scaled_mul(Nat::from(100000000u128) - (reserve_factor / Nat::from(100u128)));
    ic_cdk::println!("current_liquidity_rate: {:?}", current_liquidity_rate);

    (current_liquidity_rate, current_variable_borrow_rate)
}

fn calculate_overall_borrow_rate(total_debt: Nat, current_variable_borrow_rate: Nat) -> Nat {
    if total_debt == Nat::from(0u128) {
        return Nat::from(0u128);
    }

    let weighted_variable_rate = total_debt.clone().scaled_mul(current_variable_borrow_rate);

    weighted_variable_rate.scaled_div(total_debt)
}
