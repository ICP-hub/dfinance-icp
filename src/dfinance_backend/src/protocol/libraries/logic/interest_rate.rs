use crate::{
    constants::{
        errors::Error,
        interest_variables::{
            self,
            constants::{
                BASE_VARIABLE_BORROW_RATE, CKBTC_BASE_VARIABLE_BORROW_RATE, CKBTC_MAX_EXCESS_USAGE_RATIO, CKBTC_OPTIMAL_USAGE_RATIO, CKBTC_VARIABLE_RATE_SLOPE1, CKBTC_VARIABLE_RATE_SLOPE2, CKETH_BASE_VARIABLE_BORROW_RATE, CKETH_MAX_EXCESS_USAGE_RATIO, CKETH_OPTIMAL_USAGE_RATIO, CKETH_VARIABLE_RATE_SLOPE1, CKETH_VARIABLE_RATE_SLOPE2, CKUSDC_BASE_VARIABLE_BORROW_RATE, CKUSDC_MAX_EXCESS_USAGE_RATIO, CKUSDC_OPTIMAL_USAGE_RATIO, CKUSDC_VARIABLE_RATE_SLOPE1, CKUSDC_VARIABLE_RATE_SLOPE2, CKUSDT_BASE_VARIABLE_BORROW_RATE, CKUSDT_MAX_EXCESS_USAGE_RATIO, CKUSDT_OPTIMAL_USAGE_RATIO, CKUSDT_VARIABLE_RATE_SLOPE1, CKUSDT_VARIABLE_RATE_SLOPE2, ICP_BASE_VARIABLE_BORROW_RATE, ICP_MAX_EXCESS_USAGE_RATIO, ICP_OPTIMAL_USAGE_RATIO, ICP_VARIABLE_RATE_SLOPE1, ICP_VARIABLE_RATE_SLOPE2, MAX_EXCESS_USAGE_RATIO, SCALING_FACTOR, VARIABLE_RATE_SLOPE1, VARIABLE_RATE_SLOPE2
            },
        },
    },
    get_reserve_data,
    protocol::libraries::math::math_utils::ScalingMath, user_normalized_supply,
};
use candid::{CandidType, Deserialize, Nat};
use interest_variables::constants::OPTIMAL_USAGE_RATIO;
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
    println!("asset name in initialize {:?}", asset.to_string());
    match asset {
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_MAX_EXCESS_USAGE_RATIO)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKBTC_BASE_VARIABLE_BORROW_RATE,
            )),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE2)),
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_MAX_EXCESS_USAGE_RATIO)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKETH_BASE_VARIABLE_BORROW_RATE,
            )),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE2)),
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_MAX_EXCESS_USAGE_RATIO)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                ICP_BASE_VARIABLE_BORROW_RATE,
            )),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE2)),
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDC_OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDC_MAX_EXCESS_USAGE_RATIO,
            )),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDC_BASE_VARIABLE_BORROW_RATE,
            )),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE2)),
        },
        "ckUSDT" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDT_OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDT_MAX_EXCESS_USAGE_RATIO,
            )),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDT_BASE_VARIABLE_BORROW_RATE,
            )),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE2)),
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(OPTIMAL_USAGE_RATIO)),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(MAX_EXCESS_USAGE_RATIO)),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(BASE_VARIABLE_BORROW_RATE)),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE1)),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE2)),
        },
    }
}


pub async fn calculate_interest_rates(
    liq_added: Nat,
    liq_taken: Nat,
    total_debt: Nat,
    params: &InterestRateParams,
    reserve_factor: Nat,
    asset: String,
) -> Result<(Nat, Nat),Error> {
    ic_cdk::println!("total debt: {:?}", total_debt);

    let mut current_liquidity_rate = Nat::from(0u128);
    let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();
    let mut supply_usage_ratio = Nat::from(0u128);

    let mut borrow_usage_ratio = Nat::from(0u128);

    ic_cdk::println!("Getting reserve data for asset: {}", asset);

    let reserve_data_result = get_reserve_data(asset);
    

    let  reserve = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    if total_debt != Nat::from(0u128) {
        ic_cdk::println!("liq added = {}",liq_added);
        ic_cdk::println!("liq taken = {}",liq_taken);
        
        // let total_supply = reserve.asset_supply.scaled_mul(reserve.liquidity_index);
        let total_supply = match user_normalized_supply(reserve.clone()) {
            Ok(supply) => reserve.asset_supply.scaled_mul(supply),
            Err(e) => return Err(e),
        };
        ic_cdk::println!("total supply = {}",total_supply);
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
            (params.variable_rate_slope1.clone() * borrow_usage_ratio * Nat::from(100u128)
                / params.optimal_usage_ratio.clone());

        ic_cdk::println!("Updated borrow rate: {:?}", curr_borrow_rate);
    }

    ic_cdk::println!("Overall borrow rate: {:?}", curr_borrow_rate);

    current_liquidity_rate = (curr_borrow_rate.clone().scaled_mul(supply_usage_ratio))
        .scaled_mul(Nat::from(SCALING_FACTOR) - (reserve_factor / Nat::from(100u128)));

    ic_cdk::println!(
        "Calculated liquidity rate before adjustment: {:?}",
        current_liquidity_rate
    );

    ic_cdk::println!("Current liquidity rate: {:?}", current_liquidity_rate);

    Ok((current_liquidity_rate, curr_borrow_rate))
}
