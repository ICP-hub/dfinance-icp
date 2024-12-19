use crate::{get_reserve_data, protocol::libraries::math::math_utils::ScalingMath};
use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: Nat,
    pub max_excess_usage_ratio: Nat,
    pub base_variable_borrow_rate: Nat,
    pub variable_rate_slope1: Nat,
    pub variable_rate_slope2: Nat,
}

//TODO put it in constant folder
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

pub async fn calculate_interest_rates(
    liq_added: Nat,
    liq_taken: Nat,
    total_debt: Nat,
    dtoken: Principal, //TODO remove
    user: Principal,   //TODO remove
    params: &InterestRateParams,
    reserve_factor: Nat,
    asset: String,
) -> (Nat, Nat) {
    ic_cdk::println!("total debt: {:?}", total_debt);

    let mut current_liquidity_rate = Nat::from(0u128);
    let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();
    let mut supply_usage_ratio = Nat::from(0u128);

    let mut borrow_usage_ratio = Nat::from(0u128);

    // Print before getting reserve data
    ic_cdk::println!("Getting reserve data for asset: {}", asset);

    //TODO handle error
    let reserve = get_reserve_data(asset).unwrap();
    ic_cdk::println!("Reserve data fetched: {:?}", reserve);

    if total_debt != Nat::from(0u128) {
        //TODO verify asset_supply is updated
        ic_cdk::println!("Asset supply: {:?}", reserve.asset_supply);

        let total_supply = reserve.asset_supply;
        let available_liq = total_supply + liq_added - liq_taken;
        ic_cdk::println!("Available liquidity: {:?}", available_liq);

        let available_liq_plus_debt = available_liq + total_debt.clone();
        ic_cdk::println!("Available liquidity + debt: {:?}", available_liq_plus_debt);

        borrow_usage_ratio = total_debt
            .clone()
            .scaled_div(available_liq_plus_debt.clone());
        ic_cdk::println!("Borrow usage ratio: {:?}", borrow_usage_ratio);

        supply_usage_ratio = total_debt.scaled_div(available_liq_plus_debt);
        ic_cdk::println!("Supply usage ratio: {:?}", supply_usage_ratio);
    }

    // Check if borrow usage ratio exceeds optimal usage ratio
    if borrow_usage_ratio > (params.optimal_usage_ratio.clone() / Nat::from(100u128)) {
        ic_cdk::println!(
            "Borrow usage ratio more than optimal: {} vs {}",
            borrow_usage_ratio,
            params.optimal_usage_ratio
        );

        let excess_borrow_usage_ratio = ((borrow_usage_ratio * Nat::from(100u128))
            - params.optimal_usage_ratio.clone())
        .scaled_div(params.max_excess_usage_ratio.clone());

        ic_cdk::println!("Excess borrow usage ratio: {:?}", excess_borrow_usage_ratio);

        curr_borrow_rate += params.variable_rate_slope1.clone()
            + (params
                .variable_rate_slope2
                .clone()
                .scaled_mul(excess_borrow_usage_ratio));
        ic_cdk::println!(
            "Updated borrow rate due to excess borrow: {:?}",
            curr_borrow_rate
        );
    } else {
        ic_cdk::println!(
            "Borrow usage ratio less than optimal: {} vs {}",
            borrow_usage_ratio,
            params.optimal_usage_ratio
        );

        curr_borrow_rate +=
            params.variable_rate_slope1.clone() * borrow_usage_ratio * Nat::from(100u128)
                / params.optimal_usage_ratio.clone();

        ic_cdk::println!("Updated borrow rate: {:?}", curr_borrow_rate);
    }

    ic_cdk::println!("Overall borrow rate: {:?}", curr_borrow_rate);

    current_liquidity_rate = (curr_borrow_rate.clone().scaled_mul(supply_usage_ratio))
        .scaled_mul(Nat::from(100000000u128) - (reserve_factor / Nat::from(100u128)));

    ic_cdk::println!(
        "Calculated liquidity rate before adjustment: {:?}",
        current_liquidity_rate
    );

    ic_cdk::println!("Current liquidity rate: {:?}", current_liquidity_rate);

    (current_liquidity_rate, curr_borrow_rate)
}
