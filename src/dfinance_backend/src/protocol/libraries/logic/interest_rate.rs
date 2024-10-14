


use candid::{CandidType, Deserialize};
use serde::Serialize;
use crate::protocol::libraries::math::math_utils::ScalingMath;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: u128,
    pub max_excess_usage_ratio: u128,
    pub base_variable_borrow_rate: u128,
    pub variable_rate_slope1: u128,
    pub variable_rate_slope2: u128,
    // pub stable_rate_slope1: f64,
    // pub stable_rate_slope2: f64,
    // pub base_stable_rate_offset: f64,
    // pub stable_rate_excess_offset: f64,
    // pub optimal_stable_to_total_debt_ratio: f64,
    // pub max_excess_stable_to_total_debt_ratio: f64,
}
 

pub fn initialize_interest_rate_params(asset: &str) -> InterestRateParams {
    ic_cdk::println!("asset name in initialize {:?}", asset.to_string());
    match asset { 
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45), // 45% utilization
            max_excess_usage_ratio: ScalingMath::to_scaled(55), // 20% up to 100%
            base_variable_borrow_rate: ScalingMath::to_scaled(0), // 2% base variable rate
            variable_rate_slope1: ScalingMath::to_scaled(4), // 4% slope before optimal usage
            variable_rate_slope2: ScalingMath::to_scaled(30), // 75% slope after optimal usage
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45), // Custom utilization for ckETH
            max_excess_usage_ratio: ScalingMath::to_scaled(55), // Custom excess usage
            base_variable_borrow_rate: ScalingMath::to_scaled(0), // 3% base variable rate for ckETH
            variable_rate_slope1: ScalingMath::to_scaled(4), // 5% slope before optimal usage
            variable_rate_slope2: ScalingMath::to_scaled(30), // 80% slope after optimal usage          //review the value
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(45), 
            max_excess_usage_ratio: ScalingMath::to_scaled(55), 
            base_variable_borrow_rate: ScalingMath::to_scaled(0), 
            variable_rate_slope1: ScalingMath::to_scaled(4), 
            variable_rate_slope2: ScalingMath::to_scaled(30),                                           // review 
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(80), // 75% utilization for ckUSDC
            max_excess_usage_ratio: ScalingMath::to_scaled(20), // 25% excess usage
            base_variable_borrow_rate: ScalingMath::to_scaled(0), // 1.5% base variable rate for ckUSDC
            variable_rate_slope1: ScalingMath::to_scaled(4), // 3.5% slope before optimal usage
            variable_rate_slope2: ScalingMath::to_scaled(75), // 65% slope after optimal usage
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(80), // Default values
            max_excess_usage_ratio: ScalingMath::to_scaled(20),
            base_variable_borrow_rate: ScalingMath::to_scaled(0),
            variable_rate_slope1: ScalingMath::to_scaled(4),
            variable_rate_slope2: ScalingMath::to_scaled(75),
        },
    }
}


fn calculate_utilization_rate(total_supply: u128, total_borrowed: u128) -> u128 {
    if total_supply == 0 {
        0
    } else {
        (total_borrowed / total_supply) * 100000000
    }
}


pub fn calculate_interest_rates(
    total_supply: u128,
    total_borrowed: u128, //without interest
    total_debt: u128, //include interest
    borrow_rate: u128,
    params: &InterestRateParams,
    reserve_factor: u128,
) -> (u128, u128) {
   
    if total_debt == 0 {
        return (0, params.base_variable_borrow_rate);
    }

    let utilization_rate = calculate_utilization_rate(total_supply.clone() + total_debt.clone(), total_borrowed.clone());
    let mut current_variable_borrow_rate = params.base_variable_borrow_rate.clone();


    if utilization_rate > params.optimal_usage_ratio {
        let excess_borrow_usage_ratio = (utilization_rate - params.optimal_usage_ratio) * 100000000
            / params.max_excess_usage_ratio;  //scale_div

        current_variable_borrow_rate += params.variable_rate_slope1
            + params.variable_rate_slope2 * excess_borrow_usage_ratio;
    } else {
        current_variable_borrow_rate += (params.variable_rate_slope1 * ((utilization_rate * 100000000) / params.optimal_usage_ratio) ) / 100000000; //scaled_div scaled_mul
    }
    

    let current_liquidity_rate = (calculate_overall_borrow_rate(
       
        total_debt,
    
        current_variable_borrow_rate,
    
    ) * utilization_rate * (1 - reserve_factor))  / (100000000*100000000) ; //scal_mul
    
      
    (
        current_liquidity_rate,
        current_variable_borrow_rate,
    )
}

fn calculate_overall_borrow_rate(
    total_debt: u128,
    current_variable_borrow_rate: u128,
) -> u128 {

    if total_debt == 0 {
        return 0;
    }
   
    let weighted_variable_rate = (total_debt * current_variable_borrow_rate) / 100000000; //scal_mul
    (weighted_variable_rate / total_debt) * 100000000 //scal_div
}



// mintdtoken function
// call when user relogin
// perform supply 
// 



// fn calculate_overall_borrow_rate(
//     total_stable_debt: f64,
//     total_variable_debt: f64,
//     current_variable_borrow_rate: f64,
//     current_average_stable_borrow_rate: f64,
// ) -> f64 {
//     let total_debt = total_stable_debt + total_variable_debt;

//     if total_debt == 0.0 {
//         return 0.0;
//     }

//     let weighted_variable_rate = total_variable_debt * current_variable_borrow_rate;
//     let weighted_stable_rate = total_stable_debt * current_average_stable_borrow_rate;

//     (weighted_variable_rate + weighted_stable_rate) / total_debt
// }