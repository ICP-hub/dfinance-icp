// struct InterestRateParams {
//     optimal_usage_ratio: f64,
//     max_excess_usage_ratio: f64,
//     base_variable_borrow_rate: f64,
//     variable_rate_slope1: f64,
//     variable_rate_slope2: f64,
//     stable_rate_slope1: f64,
//     stable_rate_slope2: f64,
//     base_stable_rate_offset: f64,
//     stable_rate_excess_offset: f64,
//     optimal_stable_to_total_debt_ratio: f64,
//     max_excess_stable_to_total_debt_ratio: f64,
// }

// fn initialize_interest_rate_params() -> InterestRateParams {
//     InterestRateParams {
//         optimal_usage_ratio: 0.80, // 80% utilization
//         max_excess_usage_ratio: 0.20, // The rest (20%) up to 100%
//         base_variable_borrow_rate: 0.02, // 2% base variable rate
//         variable_rate_slope1: 0.04, // 4% slope before optimal usage
//         variable_rate_slope2: 0.75, // 75% slope after optimal usage
//         stable_rate_slope1: 0.02, // 2% slope before optimal usage for stable rates
//         stable_rate_slope2: 0.60, // 60% slope after optimal usage for stable rates
//         base_stable_rate_offset: 0.01, // 1% base premium for stable borrow rates
//         stable_rate_excess_offset: 0.05, // 5% additional premium if stable debt is high
//         optimal_stable_to_total_debt_ratio: 0.30, // 30% of debt should be stable
//         max_excess_stable_to_total_debt_ratio: 0.70, // The rest (70%) to reach 100%
//     }
// }

// fn calculate_utilization_rate(total_supply: f64, total_borrowed: f64) -> f64 {
//     if total_supply == 0.0 {
//         0.0
//     } else {
//         total_borrowed / total_supply
//     }
// }

// fn calculate_interest_rates(
//     total_supply: f64,
//     total_borrowed: f64, //without interest
//     total_stable_debt: f64,
//     total_variable_debt: f64,
//     average_stable_borrow_rate: f64,
//     params: &InterestRateParams,
//     reserve_factor: f64,
// ) -> (f64, f64, f64) {
//     let total_debt = total_stable_debt + total_variable_debt; //include interest
//     if total_debt == 0.0 {
//         return (0.0, params.base_stable_rate_offset, params.base_variable_borrow_rate);
//     }

//     let utilization_rate = calculate_utilization_rate(total_supply + total_debt, total_borrowed);
//     let mut current_variable_borrow_rate = params.base_variable_borrow_rate;
//     let mut current_stable_borrow_rate = params.base_stable_rate_offset;

//     if utilization_rate > params.optimal_usage_ratio {
//         let excess_borrow_usage_ratio = (utilization_rate - params.optimal_usage_ratio)
//             / params.max_excess_usage_ratio;

//         current_stable_borrow_rate += params.stable_rate_slope1
//             + params.stable_rate_slope2 * excess_borrow_usage_ratio;

//         current_variable_borrow_rate += params.variable_rate_slope1
//             + params.variable_rate_slope2 * excess_borrow_usage_ratio;
//     } else {
//         current_stable_borrow_rate += params.stable_rate_slope1 * (utilization_rate / params.optimal_usage_ratio);
//         current_variable_borrow_rate += params.variable_rate_slope1 * (utilization_rate / params.optimal_usage_ratio);
//     }

//     let stable_to_total_debt_ratio = if total_debt == 0.0 {
//         0.0
//     } else {
//         total_stable_debt / total_debt
//     };

//     if stable_to_total_debt_ratio > params.optimal_stable_to_total_debt_ratio {
//         let excess_stable_debt_ratio = (stable_to_total_debt_ratio - params.optimal_stable_to_total_debt_ratio)
//             / params.max_excess_stable_to_total_debt_ratio;
//         current_stable_borrow_rate += params.stable_rate_excess_offset * excess_stable_debt_ratio;
//     }

//     let current_liquidity_rate = calculate_overall_borrow_rate(
//         total_stable_debt,
//         total_variable_debt,
//         current_variable_borrow_rate,
//         average_stable_borrow_rate,
//     ) * utilization_rate * (1.0 - reserve_factor);

//     (
//         current_liquidity_rate,
//         current_stable_borrow_rate,
//         current_variable_borrow_rate,
//     )
// }

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
 
pub fn initialize_interest_rate_params() -> InterestRateParams {
    InterestRateParams {
        optimal_usage_ratio: 0.80, // 80% utilization
        max_excess_usage_ratio: 0.20, // The rest (20%) up to 100%
        base_variable_borrow_rate: 0.02, // 2% base variable rate
        variable_rate_slope1: 0.04, // 4% slope before optimal usage
        variable_rate_slope2: 0.75, // 75% slope after optimal usage

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