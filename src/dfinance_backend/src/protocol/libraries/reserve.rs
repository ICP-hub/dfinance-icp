use crate::api::inter_canister::asset_transfer;
use crate::api::inter_canister::get_balance;
use crate::api::inter_canister::get_total_supply;
use crate::api::query::user_normalized_supply;
use crate::constants::constant_variables::constants::{ONE_VALUE, TOLERANCE_FACTOR};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::validate_asset_image_url;
use crate::constants::validators::validate_asset_name;
use crate::declarations::datatypes::AssetInfo;
use crate::declarations::datatypes::ReserveCache;
use crate::declarations::datatypes::ReserveData;
use crate::declarations::datatypes::UserReserveData;
use crate::declarations::structs::AccrueToTreasuryLocalVars;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::guards::access_control::guard_admin_only;
use crate::protocol::libraries::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::protocol::utils::math_utils;
use crate::protocol::utils::math_utils::current_timestamp;
use crate::protocol::utils::math_utils::ScalingMath;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::stable_storage::storable::Candid;
use crate::{debug, error, info, trace};
use candid::{Nat, Principal};
use ic_cdk::update;

impl Default for AccrueToTreasuryLocalVars {
    fn default() -> Self {
        AccrueToTreasuryLocalVars {
            prev_total_variable_debt: zero_nat_value(),
            curr_total_variable_debt: zero_nat_value(),
            total_debt_accrued: zero_nat_value(),
            amount_to_mint: zero_nat_value(),
        }
    }
}

/*
 * @title Reserve Cache Generator
 * @notice Generates a cache structure from `ReserveData`.
 * @functionality This function extracts essential parameters from the `ReserveData` and stores them in a `ReserveCache`.
 *                This allows for quicker access to these values during subsequent operations without having to repeatedly
 *                fetch them from the original `ReserveData`.
 * @dev This function copies essential reserve parameters into `ReserveCache` for quick access.
 * @param reserve_data The reference to `ReserveData`.
 * @return `ReserveCache` The generated cache.
 */
pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(), //needed?
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,

        curr_liquidity_index: reserve_data.liquidity_index.clone(),
        next_liquidity_index: reserve_data.liquidity_index.clone(),
        curr_liquidity_rate: reserve_data.current_liquidity_rate.clone(),

        curr_debt_index: reserve_data.debt_index.clone(),
        curr_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_index: reserve_data.debt_index.clone(),
        debt_last_update_timestamp: 0,

        reserve_factor: reserve_data.configuration.reserve_factor.clone(),

        curr_debt: reserve_data.asset_borrow.clone(), //TODO take from total_supply of debt token or update this while minting and burning the tokens
        next_debt: reserve_data.asset_borrow.clone(),
        curr_supply: reserve_data.asset_supply.clone(), //TODO take from total_supply of d token or update this while minting and burning the tokens
    }
}

/**
 * @title Update State Function
 *
 * @notice Updates the reserve state if the current timestamp differs from the last update timestamp.
 *         It ensures only necessary updates are made, such as updating indexes and accruing treasury rewards.
 * @functionality This function checks if the reserve data is outdated by comparing the current timestamp
 *                with the last update timestamp. If outdated, it updates reserve indexes, accrues treasury rewards,
 *                and updates the last update timestamp to the current time. This helps keep the reserve data fresh
 *                and up-to-date.
 *
 * @dev The function follows these steps:
 *      1. Compares the current timestamp with the last update timestamp.
 *      2. If outdated, updates reserve indexes and accrues treasury rewards.
 *      3. Updates the last update timestamp to the current time.
 *
 * @param reserve_data The mutable reference to the `ReserveData` struct.
 * @param reserve_cache The mutable reference to the `ReserveCache` struct.
 *
 * @return Result<(), Error> Returns a success message if updated successfully or an error if failed.
 */
pub fn update_state(
    reserve_data: &mut ReserveData,
    reserve_cache: &mut ReserveCache,
) -> Result<(), Error> {
    trace!("update state function called");

    let current_time = current_timestamp();
    debug!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return Ok(());
    }

    update_indexes(reserve_data, reserve_cache);
    info!("updated indexes successfully");

    accrue_to_treasury(reserve_data, reserve_cache)?;
    info!("accrued to treasury successfully");

    reserve_data.last_update_timestamp = current_time;
    debug!(
        "Updated reserve data last update timestamp to: {}",
        reserve_data.last_update_timestamp
    );
    Ok(())
}

/*
 * @title Update Indexes
 * @notice Updates liquidity and debt indices based on reserve data.
 * @functionality This function updates the liquidity and debt indices in the `ReserveCache` based on the current
 *                reserve data, calculating linear interest for liquidity and compounded interest for debt.
 *                The indices are updated and stored in both the `reserve_cache` and `reserve_data` structures.
 * @dev Uses linear interest for liquidity and compounded interest for debt.
 *
 * @param reserve_data Reference to `ReserveData` for reserve state.
 * @param reserve_cache Reference to `ReserveCache` for liquidity/debt details.
 *
 * @return Result<(), Error> Returns `Ok` if the update indexes are successfully updated, or an error if the update indexes fails.
 */
pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    trace!("calling update indexes function");
    if reserve_cache.curr_liquidity_rate != zero_nat_value() {
        debug!(
            "Current liquidity rate: {}",
            reserve_cache.curr_liquidity_rate
        );

        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
        )
        ;
        info!("called calculate linear interest function in update indexes");
        debug!(
            "Cumulated liquidity interest calculated: {}",
            cumulated_liquidity_interest
        );

        reserve_cache.next_liquidity_index =
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index.clone());
        debug!(
            "Next liquidity index of cache updated: {}",
            reserve_cache.next_liquidity_index
        );

        reserve_data.liquidity_index = reserve_cache.next_liquidity_index.clone();
        debug!(
            "Reserve data liquidity index updated to: {}",
            reserve_data.liquidity_index
        );
    }

    if reserve_cache.curr_debt != zero_nat_value() {
        debug!("Current debt: {}", reserve_cache.curr_debt);

        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        info!("called calculate compounded interest function in update indexes");
        debug!(
            "Cumulated borrow interest calculated: {}",
            cumulated_borrow_interest
        );

        reserve_cache.next_debt_index =
            cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index.clone());
        debug!(
            "Next debt index of cache updated: {}",
            reserve_cache.next_debt_index
        );

        reserve_data.debt_index = reserve_cache.next_debt_index.clone();
        debug!(
            "Reserve data debt index updated to: {}",
            reserve_data.debt_index
        );
    }
}

/*
 * @title Update Interest Rates
 * @notice Updates the interest rates based on collateral changes and debt levels.
 *         It calculates new liquidity and debt rates, and updates the reserve data accordingly.
 *
 * @functionality This function is responsible for updating the interest rates in the reserve based on
 *                changes in collateral (both added and taken) and debt levels. It recalculates the
 *                liquidity and debt rates and updates the `ReserveData` struct accordingly.
 *
 * @dev The function follows these steps:
 *      1. Calculates the total debt using the current debt index.
 *      2. Initializes the interest rate parameters based on the asset.
 *      3. Calculates the new liquidity and debt rates using the updated collateral and debt data.
 *      4. Updates the reserve data with the new interest rates.
 *      5. Returns an error if the calculation fails.
 *
 * @param reserve_data The mutable reference to the `ReserveData` struct containing the current reserve state.
 * @param reserve_cache The mutable reference to the `ReserveCache` struct holding the current reserve-related data.
 * @param liq_taken The amount of collateral taken during liquidation.
 * @param liq_added The amount of collateral added to the reserve.
 *
 * @return Result<(), Error> Returns `Ok` if the interest rates are successfully updated, or an error if the calculation fails.
 */
pub async fn update_interest_rates(
    reserve_data: &mut ReserveData,
    reserve_cache: &mut ReserveCache,
    liq_taken: Nat,
    liq_added: Nat,
) -> Result<(), Error> {
    trace!("update interest rates function called");
    let total_debt = reserve_cache
        .curr_debt
        .clone()
        .scaled_mul(reserve_cache.next_debt_index.clone());
    // let user_normalized_supply = user_normalized_supply(reserve_data.clone())?;
    let total_supply = reserve_cache.clone().curr_supply.scaled_mul(reserve_cache.next_liquidity_index.clone());
    debug!("curr debt {}", reserve_cache.curr_debt);
    debug!("next debt index {}", reserve_cache.next_debt_index);

    let asset = reserve_data.asset_name.clone();
    let interest_rate_params = initialize_interest_rate_params(&asset);
    debug!("interest rate params {:?}", interest_rate_params);
    debug!("total debt: {:?}", total_debt);

    let (next_liquidity_rate, next_debt_rate) = calculate_interest_rates(
        liq_added,
        liq_taken,
        total_debt,
        total_supply,
        &interest_rate_params,
        reserve_cache.reserve_factor.clone(),
        asset,
    )
    .await?;
    info!("called calculate interest rate function successfully");

    reserve_data.current_liquidity_rate = next_liquidity_rate;
    reserve_data.borrow_rate = next_debt_rate;
    debug!(
        "Updated liquidity rate: {} and borrow rate: {}",
        reserve_data.current_liquidity_rate, reserve_data.borrow_rate
    );
    Ok(())
}

/*
 * @title Token Burn Handler
 * @notice Handles token burning, adjusting user and reserve states.
 *
 * @functionality The function burns tokens for a user, either DTokens or debt tokens, and updates the user state
 * and reserve state accordingly. It performs various checks, calculates adjusted amounts, handles rounding errors,
 * and transfers tokens to or from the user and platform as required. The function handles both DToken and debt token burns,
 * ensuring that balances are updated correctly, and the minting of additional tokens is done if necessary.
 *
 * @param reserve Mutable reference to `ReserveData` (reserve state).
 * @param user_state Mutable reference to `UserReserveData` (user balances, debt).
 * @param amount Amount to be burned (`Nat`).
 * @param index Scaling index (interest/supply rate).
 * @param user_principal User’s principal ID.
 * @param token_canister_principal Token canister responsible for transfers.
 * @param platform_principal Principal ID of the protocol performing the burn.
 * @param burn_dtoken Flag for burning DTokens (`true`) or variable borrow (`false`).
 *
 * @return `Result<(), Error>` Success (`Ok(())`) or failure (`Err(Error)`).
 */
pub async fn burn_scaled(
    reserve: &mut ReserveData,
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    burn_dtoken: bool,
) -> Result<(), Error> {
    trace!("calling burn scaled function");
    let mut is_withdraw = false;
    let adjusted_amount = if amount.clone() % index.clone() != zero_nat_value()
        && amount.clone() < Nat::from(10u128)
    {
        debug!("Rounding up due to remainder and amount < 10");
        amount.clone().scaled_div(index.clone()) + Nat::from(ONE_VALUE)
    } else {
        debug!("No rounding required");
        amount.clone().scaled_div(index.clone())
    };

    debug!("Adjusted amount calculated: {}", adjusted_amount);

    if adjusted_amount == zero_nat_value() {
        error!("Error: Adjusted amount is zero");
        return Err(Error::InvalidBurnAmount);
    }

    let balance = get_balance(token_canister_principal, user_principal).await?;

    debug!("user balance = {}", balance);
    let balance_increase: Nat;
    if burn_dtoken {
        is_withdraw = true;
        debug!("Processing DToken burn...");
        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());
        debug!(
            "balance_increase calculated = {} {}",
            balance_indexed, balance_user_indexed
        );
        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError); // Handle the error gracefully
        }

        balance_increase = balance_indexed - balance_user_indexed;

        debug!("balance_increase calculated = {}", balance_increase);
        debug!(
            "dtoken vs adjusted {} {}",
            user_state.d_token_balance, adjusted_amount
        );

        if user_state.d_token_balance == adjusted_amount {
            debug!("Setting DToken balance to zero");
            user_state.d_token_balance = zero_nat_value();
        } else if user_state.d_token_balance < adjusted_amount {
            error!("DToken balance is less than adjusted amount");
            return Err(Error::ErrorDTokenBalanceLessThan);
        } else {
            debug!("Subtracting adjusted amount from DToken balance");
            user_state.d_token_balance -= adjusted_amount.clone();

            debug!(
                "dtoken balance after subtraction = {}",
                user_state.d_token_balance
            );
            if user_state.d_token_balance < Nat::from(1000u128) {
                user_state.d_token_balance = zero_nat_value();
            }
        }

        debug!("Updated DToken balance: {}", user_state.d_token_balance);

        user_state.liquidity_index = index.clone();
    } else {
        debug!("Processing variable borrow burn...");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());
        debug!(
            "balance_increase calculated = {} {}",
            balance_indexed, balance_user_indexed
        );
        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError); // Handle the error gracefully
        }

        balance_increase = balance_indexed - balance_user_indexed;

        debug!("Balance increase calculated: {}", balance_increase);
        debug!(
            "adjusted_amount {} {}",
            adjusted_amount, user_state.debt_token_blance
        );
        if user_state.debt_token_blance == adjusted_amount {
            debug!("Setting debt token balance to zero");
            user_state.debt_token_blance = zero_nat_value();
        } else if user_state.debt_token_blance < adjusted_amount.clone() {
            error!("Debt token balance is less than adjusted amount");
            return Err(Error::AmountSubtractionError);
        } else {
            debug!("Subtracting adjusted amount from debt token balance");
            user_state.debt_token_blance -= adjusted_amount.clone();
            debug!(
                "debt token balance after subtraction = {}",
                user_state.debt_token_blance
            );

            if user_state.debt_token_blance < Nat::from(1000u128) {
                user_state.debt_token_blance = zero_nat_value();
            }
        }

        debug!(
            "Updated debt token balance: {}",
            user_state.debt_token_blance
        );
        debug!("before updating asset borrow = {:?}", reserve.asset_borrow);

        user_state.variable_borrow_index = index;
    }

    if balance_increase > amount {
        let amount_to_mint = balance_increase - amount;
        debug!("Minting tokens, amount: {}", amount_to_mint);

        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            amount_to_mint,
        )
        .await
        {
            Ok(_) => {
                info!("Minting successful");
                if is_withdraw {
                    reserve.asset_supply = get_total_supply(token_canister_principal).await?;
                } else {
                    reserve.asset_borrow = get_total_supply(token_canister_principal).await?;
                }
                Ok(())
            }
            Err(err) => {
                error!("Error during minting: {:?}", err);
                Err(Error::ErrorMintTokens)
            }
        }
    } else {
        if amount < balance_increase {
            error!("Error: Amount is less than balance increase");
            return Err(Error::AmountSubtractionError);
        }
        let mut amount_to_burn = amount - balance_increase;
        debug!("Burning tokens, initial amount: {}", amount_to_burn);

        if balance.clone() > amount_to_burn.clone()
            && balance.clone() - amount_to_burn.clone() < Nat::from(TOLERANCE_FACTOR)
        {
            debug!("Adjusting burn amount to balance");
            amount_to_burn = balance.clone();
            if burn_dtoken {
                user_state.d_token_balance = zero_nat_value();
            } else {
                user_state.debt_token_blance = zero_nat_value();
            }
        }
        debug!(
            "balance_increase is not greater than amount, amount_to_burn = {}",
            amount_to_burn
        );

        match asset_transfer(
            platform_principal,
            token_canister_principal,
            user_principal,
            Nat::from(amount_to_burn),
        )
        .await
        {
            Ok(_) => {
                info!("Burning successful");
                if is_withdraw {
                    reserve.asset_supply = get_total_supply(token_canister_principal).await?;
                } else {
                    reserve.asset_borrow = get_total_supply(token_canister_principal).await?;
                }
                Ok(())
            }
            Err(err) => {
                error!("Error during burning: {:?}", err);
                Err(Error::ErrorBurnTokens)
            }
        }
    }
}

/**
 * @title Token Mint Handler
 *
 * @dev Adjusts mint amount, updates balances, modifies supply/borrow data,
 *      and calls `asset_transfer` to finalize the minting process.
 *
 * @notice Mints tokens for users, updating both user and reserve states.
 *
 * @functionality This function is responsible for minting tokens (either DTokens or DebtTokens) to the user.
 *               It adjusts the amount to be minted based on the supply/borrow index, updates the user's token balance,
 *               and ensures that the minting process is completed by transferring the minted tokens to the user.
 *
 * @param reserve Mutable reference to `ReserveData` (reserve state).
 * @param user_state Mutable reference to `UserReserveData` (user balances, debt).
 * @param amount Amount to be minted (`Nat`).
 * @param index Scaling index (interest/supply rate).
 * @param user_principal User’s principal ID.
 * @param token_canister_principal Token canister responsible for transfers.
 * @param platform_principal Principal ID of the protocol performing the mint.
 * @param minting_dtoken Flag for minting DTokens (`true`) or DebtTokens (`false`).
 *
 * @return `Result<(), Error>` Success (`Ok(())`) or failure (`Err(Error)`).
 */
pub async fn mint_scaled(
    reserve: &mut ReserveData,
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    minting_dtoken: bool,
) -> Result<(), Error> {
    trace!("calling mind scaled function ");
    let mut is_supply = true;
    let adjusted_amount = if amount.clone() % index.clone() != zero_nat_value()
        && amount.clone() < Nat::from(10u128)
    {
        amount.clone().scaled_div(index.clone()) + Nat::from(ONE_VALUE) // Round up if there's a remainder
    } else {
        amount.clone().scaled_div(index.clone())
    };

    debug!("Adjusted amount: {}", adjusted_amount);
    //acuire transaction lock
    if adjusted_amount == zero_nat_value() {
        error!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    let balance = get_balance(token_canister_principal, user_principal).await?;
    debug!("Fetched balance in Nat: {:?}", balance);

    let balance_increase: Nat;
    if minting_dtoken {
        debug!("minting dtoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());

        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;

        debug!("balance incre dtoken{}", balance_increase);
        if user_state.liquidity_index == zero_nat_value() {
            user_state.d_token_balance = amount.clone();
        } else {
            user_state.d_token_balance += adjusted_amount.clone();
        }
        debug!("new dtoken balance {}", user_state.d_token_balance);

        debug!("user new dtoken balance {}", user_state.d_token_balance);
        user_state.liquidity_index = index;
        debug!("user new liq index {}", user_state.liquidity_index);
    } else {
        debug!("minting debttoken");
        is_supply = false;
        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());

        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;
        debug!("balance incr debttoken{}", balance_increase);
        if user_state.variable_borrow_index == zero_nat_value() {
            user_state.debt_token_blance = amount.clone();
        } else {
            user_state.debt_token_blance += adjusted_amount.clone();
        }

        debug!("new debt balance {}", user_state.debt_token_blance);
        // reserve.asset_borrow += adjusted_amount;
        user_state.variable_borrow_index = index;
        debug!("new debt index {}", user_state.variable_borrow_index);
    }

    let newmint = amount + balance_increase;
    debug!("minted token {}", newmint);
    // Perform token transfer to the user with the newly minted aTokens
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        newmint,
    )
    .await
    {
        Ok(_) => {
            info!("Dtoken transfer from backend to user executed successfully");
            if is_supply {
                reserve.asset_supply = get_total_supply(token_canister_principal).await?;
            } else {
                reserve.asset_borrow = get_total_supply(token_canister_principal).await?;
            }

            Ok(())
        }
        Err(err) => {
            error!("Error: Minting failed. Error: {:?}", err);
            Err(Error::ErrorMintTokens)
        }
    }
}

/**
 * @title Treasury Accrual Handler
 * @notice Calculates and mints accrued debt to the treasury based on reserve factor.
 *
 * @dev Determines accrued debt by comparing scaled total variable debt before and after index updates.
 *      If reserve factor is non-zero, computes mintable amount and updates treasury.
 *
 * @functionality This function is responsible for calculating the accrued debt in the treasury, determining the amount
 *               to be minted, and updating the treasury data accordingly based on the current debt and reserve factors.
 *
 * @param reserve_data Mutable reference to `ReserveData` (treasury accumulation).
 * @param reserve_cache Reference to `ReserveCache` (current & next debt/liquidity indices).
 *
 * @return None. This function modifies `reserve_data`, updating the treasury accumulation.
 *
 */
pub fn accrue_to_treasury(
    reserve_data: &mut ReserveData,
    reserve_cache: &ReserveCache,
) -> Result<(), Error> {
    trace!("calling update accure to treasury function");
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == zero_nat_value() {
        return Ok(());
    }

    vars.prev_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.curr_debt_index.clone(),
    );
    debug!(
        "prev_total_variable_debt in accure: {:?}",
        vars.prev_total_variable_debt
    );

    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );
    debug!(
        "curr_total_variable_debt in accure: {:?}",
        vars.curr_total_variable_debt
    );

    if vars.curr_total_variable_debt < vars.prev_total_variable_debt {
        error!("Error: Current total variable debt is less than previous total variable debt");
        return Err(Error::AmountSubtractionError);
    }

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;
    debug!(
        "total_debt_accrued in accure: {:?}",
        vars.total_debt_accrued
    );
    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone(),
    ); //percent
    debug!("amount_to_mint in accure: {:?}", vars.amount_to_mint);
    if vars.amount_to_mint != zero_nat_value() {
        reserve_data.accure_to_platform += (ScalingMath::scaled_mul(
            vars.amount_to_mint,
            reserve_cache.next_liquidity_index.clone(),
        )) / 100 as u128;
        debug!(
            "updated reserve data accure to platform : {:?}",
            reserve_data.accure_to_platform
        );
    }
    Ok(())
}

/*
 * @title Reserve Initialization
 * @notice Provides functionalities for initializing reserves, modifying reserve configurations,
 *         and verifying controller permissions.
 * @dev This module handles the creation of token canisters, updating reserve parameters,
 *      and ensures only controllers can execute certain operations.
 *
 * # Parameters
 * @param token_name The name of the token to be initialized.
 * @param reserve_data The reserve data structure containing metadata and token-related details.
 *
 * # Returns
 * @return `Ok(())` on success.
 *
 * @functionality Initializes a reserve by creating its associated canisters and storing metadata.
 */
//TODO: add validation of the params.
#[update]
pub async fn initialize(
    token_name: String,
    mut reserve_data: ReserveData,
    asset_image: String,
) -> Result<(), Error> {
    // admin only access check
    //TODO: add validation for the reserve data.
    guard_admin_only()?;
    validate_asset_name(&token_name)?;
    validate_asset_image_url(&asset_image)?;

    if read_state(|state| state.reserve_list.contains_key(&token_name)) {
        return Err(Error::TokenAlreadyExist);
    }

    let token_canister_id =
        match create_testtoken_canister(token_name.clone(), token_name.clone()).await {
            Ok(principal) => principal,
            Err(e) => return Err(e),
        };

    let d_token_name = format!("d{}", token_name.clone());
    let debt_token_name = format!("debt{}", token_name.clone());
    let asset_info = AssetInfo {
        asset_name: token_name.clone(),
        principal_id: token_canister_id,
        symbol: token_name.clone(),
        image: asset_image,
    };

    reserve_data.asset_name = token_name.clone();
    reserve_data.d_token_canister =
        match create_token_canister(d_token_name.clone(), d_token_name).await {
            Ok(principal) => Some(principal),
            Err(e) => {
                error!("error while calling create token canister = {:?}", e);
                return Err(e);
            }
        };
    reserve_data.debt_token_canister =
        match create_token_canister(debt_token_name.clone(), debt_token_name).await {
            Ok(principal) => Some(principal),
            Err(e) => {
                error!("error while calling create token canister = {:?}", e);
                return Err(e);
            }
        };

    reserve_data.last_update_timestamp = current_timestamp();

    debug!("reserve list, asset records and reserve data updated successfully");
    mutate_state(|state| {
        state
            .reserve_list
            .insert(token_name.clone(), token_canister_id);

        state
            .asset_records
            .insert(token_name.clone(), Candid(asset_info));

        let reserve_data_e = &mut state.asset_index;

        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
    });
    info!("Reserve for {} initialized successfully", token_name);

    Ok(())
}

/*
 * @title Reset Reserve Value
 * @notice Resets a specific variable in the reserve configuration.
 * @dev This function allows only the controller to modify key reserve parameters.
 *
 * # Parameters
 * @param asset_name The name of the asset whose reserve data is to be modified.
 * @param variable_name The specific variable to reset (e.g., "liquidity_index", "ltv").
 * @param reset_value The new value to set for the specified variable.
 *
 * # Returns
 * @return `Ok(())` on success.
 *
 * @functionality Modifies a specific parameter of an existing reserve configuration.
 */
#[update]
pub async fn reset_reserve_value(
    asset_name: String,
    variable_name: String,
    reset_value: Nat,
) -> Result<(), Error> {
    guard_admin_only()?;
    validate_asset_name(&asset_name.clone())?;
    if reset_value < zero_nat_value() {
        return Err(Error::InvalidValue);
    }

    let mut reserve_data = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&asset_name)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })?;

    match variable_name.as_str() {
        "liquidity_index" => reserve_data.liquidity_index = reset_value,
        "ltv" => reserve_data.configuration.ltv = reset_value,
        "liquidation_threshold" => reserve_data.configuration.liquidation_threshold = reset_value,
        "liquidation_bonus" => reserve_data.configuration.liquidation_bonus = reset_value,
        "borrow_cap" => reserve_data.configuration.borrow_cap = reset_value,
        "supply_cap" => reserve_data.configuration.supply_cap = reset_value,
        "reserve_factor" => reserve_data.configuration.reserve_factor = reset_value,
        "liquidation_protocol_fee" => {
            reserve_data.configuration.liquidation_protocol_fee = reset_value
        }
        _ => return Err(Error::InvalidVariableName),
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(asset_name, Candid(reserve_data));
    });
    Ok(())
}
