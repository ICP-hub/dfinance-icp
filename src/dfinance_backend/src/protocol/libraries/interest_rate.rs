use crate::{
    constants::{
        data_types::zero_nat_value,
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
    debug,
    protocol::utils::math_utils::ScalingMath,
};

use crate::constants::constant_variables::constants::PERCENTAGE_FACTOR;
use crate::declarations::structs::InterestRateParams;
use crate::protocol::utils::log::{log_internal, LogLevel};
use candid::Nat;
use interest_variables::constants::OPTIMAL_USAGE_RATIO;

/*
 * @title Interest Rate Parameter Initialization
 * @notice Initializes and returns interest rate parameters for a given asset.
 * @dev This function assigns predefined interest rate parameters based on the asset type.
 *      If an unrecognized asset is provided, it defaults to standard values.
 *
 * @functionality:
 *      - Initializes interest rate parameters (optimal usage ratio, max excess usage ratio, base variable borrow rate, etc.)
 *      - Returns the appropriate interest rate parameters for the provided asset.
 *
 * @param asset The asset identifier (e.g., "ckBTC", "ckETH", "ICP", "ckUSDC", "ckUSDT").
 * @return InterestRateParams A struct containing the asset's interest rate parameters.
 */
pub fn initialize_interest_rate_params(asset: &str) -> InterestRateParams {
    match asset {
        "ckBTC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKBTC_MAX_EXCESS_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKBTC_BASE_VARIABLE_BORROW_RATE,
            )) / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKBTC_VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
        "ckETH" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(CKETH_MAX_EXCESS_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKETH_BASE_VARIABLE_BORROW_RATE,
            )) / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKETH_VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
        "ICP" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(ICP_MAX_EXCESS_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                ICP_BASE_VARIABLE_BORROW_RATE,
            )) / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(ICP_VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
        "ckUSDC" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDC_OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDC_MAX_EXCESS_USAGE_RATIO,
            )) / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDC_BASE_VARIABLE_BORROW_RATE,
            )) / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDC_VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
        "ckUSDT" => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(CKUSDT_OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(
                CKUSDT_MAX_EXCESS_USAGE_RATIO,
            )) / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(
                CKUSDT_BASE_VARIABLE_BORROW_RATE,
            )) / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(CKUSDT_VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
        _ => InterestRateParams {
            optimal_usage_ratio: ScalingMath::to_scaled(Nat::from(OPTIMAL_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            max_excess_usage_ratio: ScalingMath::to_scaled(Nat::from(MAX_EXCESS_USAGE_RATIO))
                / Nat::from(PERCENTAGE_FACTOR),
            base_variable_borrow_rate: ScalingMath::to_scaled(Nat::from(BASE_VARIABLE_BORROW_RATE))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope1: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE1))
                / Nat::from(PERCENTAGE_FACTOR),
            variable_rate_slope2: ScalingMath::to_scaled(Nat::from(VARIABLE_RATE_SLOPE2))
                / Nat::from(PERCENTAGE_FACTOR),
        },
    }
}

/*
 * @title Interest Rate Calculation
 * @notice Computes the borrow and liquidity rates based on liquidity, debt, and asset parameters.
 * @dev This function calculates interest rates considering liquidity added, liquidity taken, and total debt.
 *      It follows the optimal usage ratio and adjusts borrow rates accordingly if excess usage occurs.
 *
 * @functionality:
 *      - Computes interest rates for borrowing and liquidity based on asset parameters.
 *      - Adjusts the borrow rate according to excess usage or optimal usage ratio.
 *      - Calculates the liquidity rate based on the borrow rate and reserve factor.
 *
 * @param liq_added The amount of liquidity added.
 * @param liq_taken The amount of liquidity taken.
 * @param total_debt The total debt amount.
 * @param total_supply The total Supply amount.
 * @param params Interest rate parameters for the asset.
 * @param reserve_factor The reserve factor for the asset, used in liquidity rate calculations.
 * @param asset The asset name (e.g., "ckBTC", "ckETH", "ICP").
 *
 * @Formula used in calculate_interest_rates:
 *
 *    Available Liquidity = Total Supply + Liquidity Added - Liquidity Taken
 *
 *    Utilization Ratio = Total Debt / (Total Debt + Available Liquidity)
 *
 *    Excess Ratio (When Utilization Ratio > Optimal Usage Ratio):
 *    Excess Ratio = Utilization Ratio - Optimal Usage Ratio
 *
 *    Excess Usage Scaled = Excess Ratio / Max Excess Usage Ratio
 *
 *    Borrow Rate (After Excess Usage Applied):
 *    Borrow Rate = Base Variable Borrow Rate + Slope1 + Slope2 * Excess Usage Scaled
 *
 *    Borrow Rate (Within Optimal Usage):
 *    Borrow Rate = Base Variable Borrow Rate + Slope1 * (Utilization Ratio / Optimal Usage Ratio)
 *
 *    Liquidity Rate = Borrow Rate * Utilization Ratio * (1 - Reserve Factor / Percentage Factor)
 *
 * @return A tuple containing:
 *         - (Nat) current_liquidity_rate: The computed liquidity rate.
 *         - (Nat) curr_borrow_rate: The computed borrow rate.
 */
pub async fn calculate_interest_rates(
    liq_added: Nat,
    liq_taken: Nat,
    total_debt: Nat,
    total_supply: Nat,
    params: &InterestRateParams,
    reserve_factor: Nat,
    asset: String,
) -> Result<(Nat, Nat), Error> {
    let mut current_liquidity_rate = zero_nat_value();
    let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();

    let available_liq = (total_supply + liq_added) - liq_taken;
    debug!("Available Liquidity: {:?}", available_liq);

    if total_debt != zero_nat_value() {
        let utilization_ratio = total_debt
            .clone()
            .scaled_div(total_debt.clone() + available_liq.clone());
        if utilization_ratio > params.optimal_usage_ratio {
            let excess_ratio = utilization_ratio.clone() - params.optimal_usage_ratio.clone();
            let excess_usage_scaled = excess_ratio
                .clone()
                .scaled_div(params.max_excess_usage_ratio.clone());

            curr_borrow_rate += params.variable_rate_slope1.clone()
                + params
                    .variable_rate_slope2
                    .clone()
                    .scaled_mul(excess_usage_scaled);
        } else {
            curr_borrow_rate += params
                .variable_rate_slope1
                .clone()
                .scaled_mul(utilization_ratio.clone())
                .scaled_div(params.optimal_usage_ratio.clone());
        }

        current_liquidity_rate = curr_borrow_rate
            .clone()
            .scaled_mul(utilization_ratio.clone())
            .scaled_mul(
                Nat::from(100_000_000u128) - (reserve_factor / Nat::from(PERCENTAGE_FACTOR)),
            );

        debug!(
            "Asset: {}, Utilization: {:?}, Borrow Rate: {:?}, Liquidity Rate: {:?}",
            asset, utilization_ratio, curr_borrow_rate, current_liquidity_rate
        );
    }

    Ok((current_liquidity_rate, curr_borrow_rate))
}
