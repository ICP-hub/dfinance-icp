use crate::{
    constants::{
        errors::Error,
        interest_variables::{
            self,
            constants::{
                BASE_VARIABLE_BORROW_RATE, CKBTC_BASE_VARIABLE_BORROW_RATE,
                CKBTC_MAX_EXCESS_USAGE_RATIO, CKBTC_OPTIMAL_USAGE_RATIO,
                CKBTC_VARIABLE_RATE_SLOPE1, CKBTC_VARIABLE_RATE_SLOPE2,
                CKETH_BASE_VARIABLE_BORROW_RATE, CKETH_MAX_EXCESS_USAGE_RATIO,
                CKETH_OPTIMAL_USAGE_RATIO, CKETH_VARIABLE_RATE_SLOPE1, CKETH_VARIABLE_RATE_SLOPE2,
                CKUSDC_BASE_VARIABLE_BORROW_RATE, CKUSDC_MAX_EXCESS_USAGE_RATIO,
                CKUSDC_OPTIMAL_USAGE_RATIO, CKUSDC_VARIABLE_RATE_SLOPE1,
                CKUSDC_VARIABLE_RATE_SLOPE2, CKUSDT_BASE_VARIABLE_BORROW_RATE,
                CKUSDT_MAX_EXCESS_USAGE_RATIO, CKUSDT_OPTIMAL_USAGE_RATIO,
                CKUSDT_VARIABLE_RATE_SLOPE1, CKUSDT_VARIABLE_RATE_SLOPE2,
                ICP_BASE_VARIABLE_BORROW_RATE, ICP_MAX_EXCESS_USAGE_RATIO, ICP_OPTIMAL_USAGE_RATIO,
                ICP_VARIABLE_RATE_SLOPE1, ICP_VARIABLE_RATE_SLOPE2, MAX_EXCESS_USAGE_RATIO,
                VARIABLE_RATE_SLOPE1, VARIABLE_RATE_SLOPE2,
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

/* 
 * @title Interest Rate Parameter Initialization
 * @notice Initializes and returns interest rate parameters for a given asset.
 * @dev This function assigns predefined interest rate parameters based on the asset type.
 *      If an unrecognized asset is provided, it defaults to standard values.
 *
 * @param asset The asset identifier (e.g., "ckBTC", "ckETH", "ICP", "ckUSDC", "ckUSDT").
 * @return InterestRateParams A struct containing the asset's interest rate parameters.
 */
pub fn initialize_interest_rate_params(asset: &str) -> InterestRateParams {
    println!("asset name in initialize {:?}", asset.to_string());
    match asset {
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_MAX_EXCESS_USAGE_RATIO))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKBTC_BASE_VARIABLE_BORROW_RATE,
            ))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_MAX_EXCESS_USAGE_RATIO))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKETH_BASE_VARIABLE_BORROW_RATE,
            ))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_MAX_EXCESS_USAGE_RATIO))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                ICP_BASE_VARIABLE_BORROW_RATE,
            ))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDC_OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDC_MAX_EXCESS_USAGE_RATIO,
            ))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDC_BASE_VARIABLE_BORROW_RATE,
            ))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
        "ckUSDT" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDT_OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDT_MAX_EXCESS_USAGE_RATIO,
            ))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDT_BASE_VARIABLE_BORROW_RATE,
            ))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(OPTIMAL_USAGE_RATIO))/Nat::from(100u128),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(MAX_EXCESS_USAGE_RATIO))/Nat::from(100u128),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(BASE_VARIABLE_BORROW_RATE))/Nat::from(100u128),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE1))/Nat::from(100u128),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE2))/Nat::from(100u128),
        },
    }
}

/* 
 * @title Interest Rate Calculation
 * @notice Computes the borrow and liquidity rates based on liquidity, debt, and asset parameters.
 * @dev This function calculates interest rates considering liquidity added, liquidity taken, and total debt.
 *      It follows the optimal usage ratio and adjusts borrow rates accordingly if excess usage occurs.
 *
 * @param liq_added The amount of liquidity added.
 * @param liq_taken The amount of liquidity taken.
 * @param total_debt The total debt amount.
 * @param params Interest rate parameters for the asset.
 * @param reserve_factor The reserve factor for the asset, used in liquidity rate calculations.
 * @param asset The asset name (e.g., "ckBTC", "ckETH", "ICP").
 *
 * @return A tuple containing:
 *         - (Nat) current_liquidity_rate: The computed liquidity rate.
 *         - (Nat) curr_borrow_rate: The computed borrow rate.
 */
pub async fn calculate_interest_rates(
    liq_added: Nat,
    liq_taken: Nat,
    total_debt: Nat,
    params: &InterestRateParams,
    reserve_factor: Nat,
    asset: String,
) -> Result<(Nat, Nat), Error> {
    ic_cdk::println!("--- Calculating Interest Rates ---");
    ic_cdk::println!("Asset: {:?}", asset);
    ic_cdk::println!("Total Debt: {:?}", total_debt);
    ic_cdk::println!("Liquidity Added: {:?}", liq_added);
    ic_cdk::println!("Liquidity Taken: {:?}", liq_taken);
    ic_cdk::println!("Reserve Factor: {:?}", reserve_factor);

    let mut current_liquidity_rate = Nat::from(0u128);
    let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();

    let reserve_data_result = get_reserve_data(asset.clone());
    let reserve = reserve_data_result.map_err(|e| e)?;

    let total_supply = reserve.clone().asset_supply.scaled_mul(user_normalized_supply(reserve.clone()).unwrap());
    ic_cdk::println!("Total Supply: {:?}", total_supply);
    ic_cdk::println!("Liquidity in reserve: {:?}", reserve.asset_supply);
    // ic_cdk::println!("interest: {:?}", user_normalized_supply(reserve.clone()).unwrap());
    let available_liq = total_supply.clone() + liq_added.clone() - liq_taken.clone();
    
    
    ic_cdk::println!("Available Liquidity: {:?}", available_liq);

    if total_debt.clone() != Nat::from(0u128) {
        let utilization_ratio = total_debt.clone().scaled_div(total_debt.clone() + available_liq.clone());
        ic_cdk::println!("Utilization Ratio: {:?}", utilization_ratio);
        ic_cdk::println!("Optimal Usage Ratio: {:?}", params.optimal_usage_ratio);
        
        if utilization_ratio > params.optimal_usage_ratio.clone() {
            let excess_ratio = utilization_ratio.clone() - params.optimal_usage_ratio.clone();
            let excess_usage_scaled = excess_ratio.clone().scaled_div(params.max_excess_usage_ratio.clone());
            
            ic_cdk::println!("Excess Ratio: {:?}", excess_ratio);
            ic_cdk::println!("Excess Usage Scaled: {:?}", excess_usage_scaled);
            
            curr_borrow_rate += params.variable_rate_slope1.clone()
                + params.variable_rate_slope2.clone().scaled_mul(excess_usage_scaled);
            
            ic_cdk::println!("Borrow Rate (After Excess Usage Applied): {:?}", curr_borrow_rate);
        } else {
            curr_borrow_rate += params.variable_rate_slope1.clone()
                .scaled_mul(utilization_ratio.clone())
                .scaled_div(params.optimal_usage_ratio.clone());
            // curr_borrow_rate = curr_borrow_rate * Nat::from(100u128);
            
            ic_cdk::println!("Borrow Rate (Within Optimal Usage): {:?}", curr_borrow_rate);
        }

        current_liquidity_rate = curr_borrow_rate.clone().scaled_mul(utilization_ratio.clone())
            .scaled_mul(Nat::from(100000000u128) - (reserve_factor/Nat::from(100u128)));

        ic_cdk::println!("Final Borrow Rate: {:?}", curr_borrow_rate);
        ic_cdk::println!("Final Liquidity Rate: {:?}", current_liquidity_rate);
    }

    ic_cdk::println!("--- Interest Rate Calculation Completed ---");

    Ok((current_liquidity_rate, curr_borrow_rate))
}































































// pub async fn calculate_interest_rates(
//     liq_added: Nat,
//     liq_taken: Nat,
//     total_debt: Nat,
//     params: &InterestRateParams,
//     reserve_factor: Nat,
//     asset: String,
// ) -> Result<(Nat, Nat), Error> {
//     ic_cdk::println!("total debt: {:?}", total_debt);

//     let mut current_liquidity_rate = Nat::from(0u128);
//     let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();
//     let mut supply_usage_ratio = Nat::from(0u128);

//     let mut borrow_usage_ratio = Nat::from(0u128);

//     ic_cdk::println!("Getting reserve data for asset: {}", asset);

//     let reserve_data_result = get_reserve_data(asset);

//     let reserve = match reserve_data_result {
//         Ok(data) => {
//             ic_cdk::println!("Reserve data found for asset: {:?}", data);
//             data
//         }
//         Err(e) => {
//             return Err(e);
//         }
//     };

//     if total_debt != Nat::from(0u128) {
//         ic_cdk::println!("liq added = {}", liq_added);
//         ic_cdk::println!("liq taken = {}", liq_taken);

//         let total_supply = reserve.asset_supply.scaled_mul(reserve.liquidity_index);
//         ic_cdk::println!("total supply {}", total_supply.clone());

//         let mut available_liq = Nat::from(0u128);

//         if total_supply.clone() + liq_added.clone() < liq_taken
//             && liq_taken.clone() - (total_supply.clone() + liq_added.clone()) < Nat::from(1000u128)
//         {
//             available_liq = Nat::from(0u128);
//         } else if total_supply.clone() + liq_added.clone() < liq_taken {
//             return Err(Error::AmountSubtractionError);
//         } else {
//             available_liq = total_supply + liq_added - liq_taken;
//         }

//         ic_cdk::println!("Available liquidity: {:?}", available_liq);
 
//         let available_liq_plus_debt = available_liq + total_debt.clone();
//         ic_cdk::println!("Available liquidity + debt: {:?}", available_liq_plus_debt);

//         borrow_usage_ratio = total_debt
//             .clone()
//             .scaled_div(available_liq_plus_debt.clone());
//         ic_cdk::println!("Borrow usage ratio: {:?}", borrow_usage_ratio);

//         supply_usage_ratio = total_debt.scaled_div(available_liq_plus_debt);
//         ic_cdk::println!("Supply usage ratio: {:?}", supply_usage_ratio);
//     }

//     if borrow_usage_ratio > (params.optimal_usage_ratio.clone() / Nat::from(100u128)) {
//         ic_cdk::println!(
//             "Borrow usage ratio more than optimal: {} vs {}",
//             borrow_usage_ratio,
//             params.optimal_usage_ratio
//         );

//         let scaled_borrow_usage = borrow_usage_ratio * Nat::from(100u128);

//         if scaled_borrow_usage < params.optimal_usage_ratio {
//             return Err(Error::AmountSubtractionError); // Handle the error gracefully
//         }

//         let excess_borrow_usage_ratio = (scaled_borrow_usage - params.optimal_usage_ratio.clone())
//             .scaled_div(params.max_excess_usage_ratio.clone());

//         // let excess_borrow_usage_ratio = ((borrow_usage_ratio * Nat::from(100u128))
//         //     - params.optimal_usage_ratio.clone())
//         // .scaled_div(params.max_excess_usage_ratio.clone());

//         ic_cdk::println!("Excess borrow usage ratio: {:?}", excess_borrow_usage_ratio);

//         curr_borrow_rate += params.variable_rate_slope1.clone()
//             + (params
//                 .variable_rate_slope2
//                 .clone()
//                 .scaled_mul(excess_borrow_usage_ratio));
//         ic_cdk::println!(
//             "Updated borrow rate due to excess borrow: {:?}",
//             curr_borrow_rate
//         );
//     } else {
//         ic_cdk::println!(
//             "Borrow usage ratio less than optimal: {} vs {}",
//             borrow_usage_ratio,
//             params.optimal_usage_ratio
//         );

//         curr_borrow_rate +=
//             (params.variable_rate_slope1.clone() * borrow_usage_ratio * Nat::from(100u128)
//                 / params.optimal_usage_ratio.clone());

//         ic_cdk::println!("Updated borrow rate: {:?}", curr_borrow_rate);
//     }

//     ic_cdk::println!("Overall borrow rate: {:?}", curr_borrow_rate);

//     let scaled_reserve_factor = reserve_factor / Nat::from(100u128);
//     let scaling_factor_nat = Nat::from(SCALING_FACTOR);

//     if scaling_factor_nat < scaled_reserve_factor {
//         return Err(Error::AmountSubtractionError); // Handle the error gracefully
//     }

//     let adjusted_factor = scaling_factor_nat - scaled_reserve_factor;
//     current_liquidity_rate =
//         (curr_borrow_rate.clone().scaled_mul(supply_usage_ratio)).scaled_mul(adjusted_factor);

//     // current_liquidity_rate = (curr_borrow_rate.clone().scaled_mul(supply_usage_ratio))
//     //     .scaled_mul(Nat::from(SCALING_FACTOR) - (reserve_factor / Nat::from(100u128)));

//     ic_cdk::println!(
//         "Calculated liquidity rate before adjustment: {:?}",
//         current_liquidity_rate
//     );

//     ic_cdk::println!("Current liquidity rate: {:?}", current_liquidity_rate);

//     Ok((current_liquidity_rate, curr_borrow_rate))
// }
