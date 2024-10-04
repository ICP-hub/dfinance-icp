


use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: f64,
    pub max_excess_usage_ratio: f64,
    pub base_variable_borrow_rate: f64,
    pub variable_rate_slope1: f64,
    pub variable_rate_slope2: f64,
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
            optimal_usage_ratio: 0.45, // 45% utilization
            max_excess_usage_ratio: 0.55, // 20% up to 100%
            base_variable_borrow_rate: 0.0, // 2% base variable rate
            variable_rate_slope1: 0.04, // 4% slope before optimal usage
            variable_rate_slope2: 0.300, // 75% slope after optimal usage
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: 0.45, // Custom utilization for ckETH
            max_excess_usage_ratio: 0.55, // Custom excess usage
            base_variable_borrow_rate: 0.0, // 3% base variable rate for ckETH
            variable_rate_slope1: 0.04, // 5% slope before optimal usage
            variable_rate_slope2: 0.300, // 80% slope after optimal usage
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: 0.45, 
            max_excess_usage_ratio: 0.55, 
            base_variable_borrow_rate: 0.0, 
            variable_rate_slope1: 0.04, 
            variable_rate_slope2: 0.300, // 
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: 0.80, // 75% utilization for ckUSDC
            max_excess_usage_ratio: 0.20, // 25% excess usage
            base_variable_borrow_rate: 0.0, // 1.5% base variable rate for ckUSDC
            variable_rate_slope1: 0.04, // 3.5% slope before optimal usage
            variable_rate_slope2: 0.75, // 65% slope after optimal usage
        },
        _ => InterestRateParams {
            optimal_usage_ratio: 0.80, // Default values
            max_excess_usage_ratio: 0.20,
            base_variable_borrow_rate: 0.02,
            variable_rate_slope1: 0.04,
            variable_rate_slope2: 0.75,
        },
    }
}


fn calculate_utilization_rate(total_supply: f64, total_borrowed: f64) -> f64 {
    if total_supply == 0.0 {
        0.0
    } else {
        total_borrowed / total_supply
    }
}


pub fn calculate_interest_rates(
    total_supply: f64,
    total_borrowed: f64, //without interest
    total_debt: f64, //include interest
    borrow_rate: f64,
    params: &InterestRateParams,
    // reserve_factor: f64,
) -> (f64, f64) {
   
    if total_debt == 0.0 {
        return (0.0, params.base_variable_borrow_rate);
    }

    let utilization_rate = calculate_utilization_rate(total_supply.clone() + total_debt.clone(), total_borrowed.clone());
    let mut current_variable_borrow_rate = params.base_variable_borrow_rate.clone();


    if utilization_rate > params.optimal_usage_ratio {
        let excess_borrow_usage_ratio = (utilization_rate - params.optimal_usage_ratio)
            / params.max_excess_usage_ratio;

        current_variable_borrow_rate += params.variable_rate_slope1
            + params.variable_rate_slope2 * excess_borrow_usage_ratio;
    } else {
        current_variable_borrow_rate += params.variable_rate_slope1 * (utilization_rate / params.optimal_usage_ratio);
    }
    

    let current_liquidity_rate = calculate_overall_borrow_rate(
       
        total_debt,
    
        current_variable_borrow_rate,
    
    ) * utilization_rate * (1.0);
    // * utilization_rate * (1.0 - reserve_factor);
      
    (
        current_liquidity_rate,
        current_variable_borrow_rate,
    )
}

fn calculate_overall_borrow_rate(
    total_debt: f64,
    current_variable_borrow_rate: f64,
) -> f64 {

    if total_debt == 0.0 {
        return 0.0;
    }
   
    let weighted_variable_rate = total_debt * current_variable_borrow_rate;
    weighted_variable_rate / total_debt
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