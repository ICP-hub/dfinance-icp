use crate::{get_reserve_data, protocol::libraries::math::math_utils::ScalingMath};
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: u128,
    pub max_excess_usage_ratio: u128,
    pub base_variable_borrow_rate: u128,
    pub variable_rate_slope1: u128,
    pub variable_rate_slope2: u128,
}

//TODO put it in constant folder
pub fn initialize_interest_rate_params(asset: &str) -> InterestRateParams {
    ic_cdk::println!("asset name in initialize {:?}", asset.to_string());
    match asset {
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45),
            max_excess_usage_ratio: ScalingMath::to_scaled(55),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(30),
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45),
            max_excess_usage_ratio: ScalingMath::to_scaled(55),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(30), //review the value
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45),
            max_excess_usage_ratio: ScalingMath::to_scaled(55),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(30), // review
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(80),
            max_excess_usage_ratio: ScalingMath::to_scaled(20),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(75),
        },
        "ckUSDT" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(92),
            max_excess_usage_ratio: ScalingMath::to_scaled(20),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(75),
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(80),
            max_excess_usage_ratio: ScalingMath::to_scaled(20),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(75),
        },
    }
}


pub async fn calculate_interest_rates(
    liq_added: u128,
    liq_taken: u128, 
    total_debt: u128,    
    dtoken: Principal,//TODO remove
    user: Principal, //TODO remove
    params: &InterestRateParams,
    reserve_factor: u128,
    asset: String,
) -> (u128, u128) {

    ic_cdk::println!("total debt: {:?}", total_debt);

    let mut current_liquidity_rate = 0;
    let mut curr_borrow_rate = params.base_variable_borrow_rate;
    let mut supply_usage_ratio = 0;

    let mut borrow_usage_ratio = 0;
    //TODO handle error
    let reserve = get_reserve_data(asset).unwrap();
    // if total_debt != 0 {
       //TODO verify asset_supply is updated
       let total_supply = reserve.asset_supply;
       let available_liq = total_supply + liq_added - liq_taken;
       let available_liq_plus_debt= available_liq + total_debt;
       borrow_usage_ratio = total_debt.scaled_div(available_liq_plus_debt);
       supply_usage_ratio = total_debt.scaled_div(available_liq_plus_debt);
    // }
    if borrow_usage_ratio > (params.optimal_usage_ratio/100) {
        ic_cdk::println!("borrow usage more than optimal {} {}",borrow_usage_ratio, params.optimal_usage_ratio);
        let excess_borrow_usage_ratio =
        ((borrow_usage_ratio*100) - params.optimal_usage_ratio).scaled_div(params.max_excess_usage_ratio);

        curr_borrow_rate +=
        params.variable_rate_slope1 + (params.variable_rate_slope2.scaled_mul(excess_borrow_usage_ratio));

    }  else {
        ic_cdk::println!("borrow usage less than optimal {} {}",borrow_usage_ratio, params.optimal_usage_ratio);
       curr_borrow_rate +=
            params.variable_rate_slope1 * borrow_usage_ratio * 100 / params.optimal_usage_ratio;
    }
    ic_cdk::println!("overall_borrow_rate: {:?}", curr_borrow_rate);
    current_liquidity_rate = (curr_borrow_rate
        .scaled_mul(supply_usage_ratio))
        .scaled_mul(100000000 - (reserve_factor/100));
    ic_cdk::println!("current_liquidity_rate: {:?}", current_liquidity_rate);

    (current_liquidity_rate, curr_borrow_rate)
}





