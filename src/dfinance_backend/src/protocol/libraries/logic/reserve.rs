use crate::api::functions::asset_transfer;
use crate::api::functions::get_balance;
use crate::api::resource_manager::get_locked_amount;
use crate::api::resource_manager::{
    get_locked_transaction_amount, lock_transaction_amount, release_transaction_lock,
};
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;
use crate::get_reserve_data;
use crate::protocol::libraries::logic::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::libraries::math::math_utils;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use candid::{Nat, Principal};
use futures::future::ok;
use ic_cdk::api::time;

/*
 * @title Accrual Treasury Variables
 * @notice Stores temporary values used during the treasury accrual process.
 * @dev Holds previous debt values and calculated accrual amounts.
 */
struct AccrueToTreasuryLocalVars {
    //
    prev_total_variable_debt: Nat,
    curr_total_variable_debt: Nat,
    total_debt_accrued: Nat,
    amount_to_mint: Nat,
}

impl Default for AccrueToTreasuryLocalVars {
    fn default() -> Self {
        AccrueToTreasuryLocalVars {
            prev_total_variable_debt: Nat::from(0u128),
            curr_total_variable_debt: Nat::from(0u128),
            total_debt_accrued: Nat::from(0u128),
            amount_to_mint: Nat::from(0u128),
        }
    }
}

/*
 * @title Timestamp Utility
 * @notice Returns the current timestamp in seconds.
 * @dev Converts nanoseconds from `time()` API to seconds.
 * @return `u64` The current timestamp.
 */
fn current_timestamp() -> u64 {
    time() / 1_000_000_000
}

/*
 * @title Reserve Cache Generator
 * @notice Generates a cache structure from `ReserveData`.
 * @dev This function copies essential reserve parameters into `ReserveCache` for quick access.
 * @param reserve_data The reference to `ReserveData`.
 * @return `ReserveCache` The generated cache.
 */
pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
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
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return Ok(());
    }

    update_indexes(reserve_data, reserve_cache);
    if let Err(e) = accrue_to_treasury(reserve_data, reserve_cache) {
        ic_cdk::println!("Error accruing to treasury: {:?}", e);
        return Err(e);
    }

    reserve_data.last_update_timestamp = current_time;
    Ok(())
}

/*
 * @title Update Indexes
 * @notice Updates liquidity and debt indices based on reserve data.
 * @dev Uses linear interest for liquidity and compounded interest for debt.
 *
 * @param reserve_data Reference to `ReserveData` for reserve state.
 * @param reserve_cache Reference to `ReserveCache` for liquidity/debt details.
 *
 * @return Result<(), Error> Returns `Ok` if the update indexes are successfully updated, or an error if the update indexes fails.
 */
pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != Nat::from(0u128) {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
        );
        reserve_cache.next_liquidity_index =
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index.clone());

        reserve_data.liquidity_index = reserve_cache.next_liquidity_index.clone();
    }

    if reserve_cache.curr_debt != Nat::from(0u128) {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        ic_cdk::println!(
            "cumulated borrow interest when performing action {}",
            cumulated_borrow_interest
        );
        reserve_cache.next_debt_index =
            cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index.clone());
        ic_cdk::println!("next debt index {}", reserve_cache.next_debt_index);
        reserve_data.debt_index = reserve_cache.next_debt_index.clone();
    }
}

/*
 * @title Update Interest Rates
 * @notice Updates the interest rates based on collateral changes and debt levels.
 *         It calculates new liquidity and debt rates, and updates the reserve data accordingly.
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
    let total_debt = reserve_cache
        .curr_debt
        .clone()
        .scaled_mul(reserve_cache.next_debt_index.clone());
    ic_cdk::println!("curr debt {}", reserve_cache.curr_debt);
    ic_cdk::println!("next debt index {}", reserve_cache.next_debt_index);
    let asset = reserve_data
        .asset_name
        .clone()
        .unwrap_or("no token".to_string());
    let interest_rate_params = initialize_interest_rate_params(&asset);
    ic_cdk::println!("interest rate params {:?}", interest_rate_params);
    ic_cdk::println!("total debt: {:?}", total_debt);
    let calculated_interest_rates = calculate_interest_rates(
        liq_added,
        liq_taken,
        total_debt,
        &interest_rate_params,
        reserve_cache.reserve_factor.clone(),
        reserve_data.asset_name.clone().expect("no name"),
    )
    .await;

    let (next_liquidity_rate, next_debt_rate) = match calculated_interest_rates {
        Ok((liquidity_rate, debt_rate)) => {
            ic_cdk::println!("liquidity rate: {:?}", liquidity_rate);
            ic_cdk::println!("debt rate: {:?}", debt_rate);
            (liquidity_rate, debt_rate)
        }
        Err(e) => {
            ic_cdk::println!("Error calculating interest rates: {:?}", e);
            return Err(e);
        }
    };

    reserve_data.current_liquidity_rate = next_liquidity_rate;
    reserve_data.borrow_rate = next_debt_rate;
    Ok(())
}

/*
 * @title Token Burn Handler
 * @notice Handles token burning, adjusting user and reserve states.
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
    ic_cdk::println!("Starting burn_scaled function...");
    ic_cdk::println!("Initial parameters:");
    ic_cdk::println!("  Amount: {}", amount);
    ic_cdk::println!("  Index: {}", index);
    ic_cdk::println!("  User Principal: {}", user_principal);
    ic_cdk::println!("  Token Canister Principal: {}", token_canister_principal);
    ic_cdk::println!("  Platform Principal: {}", platform_principal);
    ic_cdk::println!("  Burn DToken: {}", burn_dtoken);

    ic_cdk::println!("Checking if amount has a remainder when divided by index...");
    ic_cdk::println!("Amount remainder: {}", amount.clone() % index.clone());

    let mut adjusted_amount = if amount.clone() % index.clone() != Nat::from(0u128)
        && amount.clone() < Nat::from(10u128)
    {
        ic_cdk::println!("Rounding up due to remainder and amount < 10");
        amount.clone().scaled_div(index.clone()) + Nat::from(1u128)
    } else {
        ic_cdk::println!("No rounding required");
        amount.clone().scaled_div(index.clone())
    };

    ic_cdk::println!("Adjusted amount calculated: {}", adjusted_amount);

    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Adjusted amount is zero");
        return Err(Error::InvalidBurnAmount);
    }

    ic_cdk::println!("Fetching user balance...");
    let balance_result = get_balance(token_canister_principal, user_principal).await;

    let balance = match balance_result {
        Ok(bal) => {
            ic_cdk::println!("Balance fetched successfully: {}", bal);
            bal
        }
        Err(err) => {
            ic_cdk::println!("Error fetching balance: {:?}", err);
            return Err(err);
        }
    };
    ic_cdk::println!("burn balance = {}", balance);
    ic_cdk::println!("adjusted balance = {}", adjusted_amount);
    let mut balance_increase = Nat::from(0u128);
    if burn_dtoken {
        ic_cdk::println!("Processing DToken burn...");
        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());
        ic_cdk::println!(
            "balance_increase calculated = {} {}",
            balance_indexed,
            balance_user_indexed
        );
        if balance_indexed < balance_user_indexed {
            return Err(Error::AmountSubtractionError); // Handle the error gracefully
        }

        balance_increase = balance_indexed - balance_user_indexed;

        ic_cdk::println!("balance_increase calculated = {}", balance_increase);
        ic_cdk::println!(
            "dtoken vs adjusted {} {}",
            user_state.d_token_balance,
            adjusted_amount
        );
        if user_state.d_token_balance == adjusted_amount {
            ic_cdk::println!("Setting DToken balance to zero");
            user_state.d_token_balance = Nat::from(0u128);
        } else if user_state.d_token_balance < adjusted_amount {
            return Err(Error::ErrorDTokenBalanceLessThan);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from DToken balance");
            user_state.d_token_balance -= adjusted_amount.clone();

            ic_cdk::println!(
                "dtoken balance after subtraction = {}",
                user_state.d_token_balance
            );
            // if user_state.d_token_balance < Nat::from(1000u128) {
            //     user_state.d_token_balance = Nat::from(0u128);
            // }
        }

        ic_cdk::println!("Updated DToken balance: {}", user_state.d_token_balance);
        ic_cdk::println!("before updating asset borrow = {:?}", reserve.asset_borrow);

        if reserve.asset_supply == adjusted_amount {
            ic_cdk::println!("Setting asset supply to zero");
            reserve.asset_supply = Nat::from(0u128);
        } else if reserve.asset_supply < adjusted_amount {
            return Err(Error::AmountSubtractionError);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from asset supply");
            reserve.asset_supply -= adjusted_amount;
        }

        ic_cdk::println!("Updated asset supply: {}", reserve.asset_supply);
        user_state.liquidity_index = index.clone();
    } else {
        ic_cdk::println!("Processing variable borrow burn...");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());
        ic_cdk::println!(
            "balance_increase calculated = {} {}",
            balance_indexed,
            balance_user_indexed
        );
        if balance_indexed < balance_user_indexed {
            return Err(Error::AmountSubtractionError); // Handle the error gracefully
        }

        balance_increase = balance_indexed - balance_user_indexed;

        ic_cdk::println!("Balance increase calculated: {}", balance_increase);
        ic_cdk::println!(
            "adjusted_amount {} {}",
            adjusted_amount,
            user_state.debt_token_blance
        );
        if user_state.debt_token_blance == adjusted_amount {
            ic_cdk::println!("Setting debt token balance to zero");
            user_state.debt_token_blance = Nat::from(0u128);
        } else if user_state.debt_token_blance < adjusted_amount.clone() {
            return Err(Error::AmountSubtractionError);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from debt token balance");
            user_state.debt_token_blance -= adjusted_amount.clone();
            ic_cdk::println!(
                "debt token balance after subtraction = {}",
                user_state.debt_token_blance
            );

            // if user_state.debt_token_blance < Nat::from(1000u128) {
            // user_state.debt_token_blance = Nat::from(0u128);
            // }
        }

        ic_cdk::println!(
            "Updated debt token balance: {}",
            user_state.debt_token_blance
        );
        ic_cdk::println!("before updating asset borrow = {:?}", reserve.asset_borrow);

        // if let Err(err) = repay_lock_amount(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
        // {
        //     ic_cdk::println!("Error in repay_lock_amount: {:?}", err);
        //     return Err(err);
        // }

        if reserve.asset_borrow == adjusted_amount {
            ic_cdk::println!("Setting asset borrow to zero");
            reserve.asset_borrow = Nat::from(0u128);
        } else if reserve.asset_borrow < adjusted_amount {
            return Err(Error::AmountSubtractionError);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from asset borrow");
            // let repay_amount = get_repay_locked_amount(&reserve.asset_name.clone().unwrap());
            // ic_cdk::println!("repay amount = {}", repay_amount);
            reserve.asset_borrow -= adjusted_amount;
        }

        ic_cdk::println!("Updated asset borrow: {}", reserve.asset_borrow);
        user_state.variable_borrow_index = index;
    }

    ic_cdk::println!("balance_increase in burning: {}", balance_increase);

    if balance_increase > amount {
        let amount_to_mint = balance_increase - amount;
        ic_cdk::println!("Minting tokens, amount: {}", amount_to_mint);

        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            amount_to_mint,
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("Miniting interest successful");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error during minting: {:?}", err);
                Err(Error::ErrorMintTokens)
            }
        }
    } else {
        if amount < balance_increase {
            return Err(Error::AmountSubtractionError);
        }
        ic_cdk::println!("Burning tokens, amount: {}", amount);
        let amount_to_burn = amount - balance_increase;
        ic_cdk::println!("Burning tokens, initial amount: {}", amount_to_burn);

        // if balance.clone() > amount_to_burn.clone()
        //     && balance.clone() - amount_to_burn.clone() < Nat::from(1000u128)
        // {
        //     ic_cdk::println!("Adjusting burn amount to balance");
        //     amount_to_burn = balance.clone();
        //     if burn_dtoken {
        //         user_state.d_token_balance = Nat::from(0u128);
        //     } else {
        //         user_state.debt_token_blance = Nat::from(0u128);
        //     }
        // }
        ic_cdk::println!(
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
                ic_cdk::println!("Burning successful");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error during burning: {:?}", err);
                Err(Error::ErrorBurnTokens)
            }
        }
    }
}

/*
 * @title Token Mint Handler
 *
 * @dev Adjusts mint amount, updates balances, modifies supply/borrow data,
 *      and calls `asset_transfer` to finalize the minting process.
 *
 * @notice Mints tokens for users, updating both user and reserve states.
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
    ic_cdk::println!("--- mint_scaled_modified called ---");
    ic_cdk::println!("Initial user state: {:?}", user_state);
    ic_cdk::println!("Amount value: {}", amount);
    ic_cdk::println!("current index value = {}", index);

    ic_cdk::println!("Original amount: {}", amount.clone());
    ic_cdk::println!("Index: {}", index.clone());
    ic_cdk::println!("Amount % Index: {}", amount.clone() % index.clone());
    ic_cdk::println!("Amount < 10: {}", amount.clone() < Nat::from(10u128));

    let  adjusted_amount = if amount.clone() % index.clone() != Nat::from(0u128)
        && amount.clone() < Nat::from(10u128)
    {
        let scaled = amount.clone().scaled_div(index.clone());
        ic_cdk::println!("Scaled amount before rounding up: {}", scaled);
        scaled + Nat::from(1u128) // Round up if there's a remainder
    } else {
        let scaled = amount.clone().scaled_div(index.clone());
        ic_cdk::println!("Scaled amount without rounding: {}", scaled);
        scaled
    };

    ic_cdk::println!("Final Adjusted amount: {}", adjusted_amount.clone());

    ic_cdk::println!("Adjusted amount: {}", adjusted_amount);
    //acuire transaction lock
    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    // if let Err(e) = lock_transaction_amount(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
    // {
    //     return Err(e);
    // }
    // ic_cdk::println!(
    //     "Fetching user balance... {:?}",
    //     get_locked_transaction_amount(&reserve.asset_name.clone().unwrap())
    // );

    let balance_result = get_balance(token_canister_principal, user_principal).await;
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            // if let Err(e) =
                // release_transaction_lock(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
            // {
            //     ic_cdk::println!("Failed to release transaction lock: {:?}", e);
            // }
            ic_cdk::println!("Error converting balance to u128: {:?}", err);
            return Err(Error::ErrorGetBalance);
        }
    };
    ic_cdk::println!("Fetched balance in Nat: {:?}", balance);
    ic_cdk::println!("mint balance = {}", balance);

    let mut balance_increase = Nat::from(0u128);
    if minting_dtoken {
        ic_cdk::println!("minting dtoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());

        if balance_indexed < balance_user_indexed {
            // if let Err(e) =
            //     release_transaction_lock(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
            // {
            //     ic_cdk::println!("Failed to release transaction lock: {:?}", e);
            // }
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;

        ic_cdk::println!("balance incr dtoken{}", balance_increase);
        if user_state.liquidity_index == Nat::from(0u128) {
            user_state.d_token_balance = amount.clone();
        } else {
            user_state.d_token_balance += adjusted_amount.clone();
        }
        ic_cdk::println!("new dtoken balance {}", user_state.d_token_balance);
        ic_cdk::println!("before updating asset supply = {:?}", reserve.asset_supply);
        reserve.asset_supply += adjusted_amount;
        // ic_cdk::println!("locked amount = {:?}", get_locked_transaction_amount(&reserve.asset_name.clone().unwrap()));
        // reserve.asset_supply += get_locked_transaction_amount(&reserve.asset_name.clone().unwrap());
        ic_cdk::println!("updated asset supply {}", reserve.asset_supply);
        user_state.liquidity_index = index;

    } else {
        ic_cdk::println!("minting debttoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());

        if balance_indexed < balance_user_indexed {
            if let Err(e) =
                release_transaction_lock(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
            {
                ic_cdk::println!("Failed to release transaction lock: {:?}", e);
            }
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;
        println!("balance incr debttoken{}", balance_increase);
        if user_state.variable_borrow_index == Nat::from(0u128) {
            user_state.debt_token_blance = amount.clone();
        } else {
            user_state.debt_token_blance += adjusted_amount.clone();
        }

        println!("new debt balance {}", user_state.debt_token_blance);
        reserve.asset_borrow +=adjusted_amount;
        // reserve.asset_borrow += get_locked_transaction_amount(&reserve.asset_name.clone().unwrap());
        user_state.variable_borrow_index = index;
        println!("new debt index {}", user_state.variable_borrow_index);
    }


    let newmint = amount + balance_increase;
    println!("minted token {}", newmint);
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
            // if let Err(e) =
            //     release_transaction_lock(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
            // {
            //     ic_cdk::println!("Failed to release transaction lock: {:?}", e);
            // }
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
            Ok(())
        }
        Err(err) => {
            // if let Err(e) =
            //     release_transaction_lock(&reserve.asset_name.clone().unwrap(), &adjusted_amount)
            // {
            //     ic_cdk::println!("Failed to release transaction lock: {:?}", e);
            // }
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
            Err(Error::ErrorMintTokens)
        }
    }
}

/*
 * @title Treasury Accrual Handler
 * @notice Calculates and mints accrued debt to the treasury based on reserve factor.
 *
 * @dev Determines accrued debt by comparing scaled total variable debt before and after index updates.
 *      If reserve factor is non-zero, computes mintable amount and updates treasury.
 *
 * @param reserve_data Mutable reference to `ReserveData` (treasury accumulation).
 * @param reserve_cache Reference to `ReserveCache` (current & next debt/liquidity indices).
 *
 *
 * @return None. This function modifies `reserve_data`, updating the treasury accumulation.
 *
 */
pub fn accrue_to_treasury(
    reserve_data: &mut ReserveData,
    reserve_cache: &ReserveCache,
) -> Result<(), Error> {
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == Nat::from(0u128) {
        return Ok(());
    }

    vars.prev_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.curr_debt_index.clone(),
    );
    ic_cdk::println!(
        "prev_total_variable_debt in accure: {:?}",
        vars.prev_total_variable_debt
    );

    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );
    ic_cdk::println!(
        "curr_total_variable_debt in accure: {:?}",
        vars.curr_total_variable_debt
    );

    if vars.curr_total_variable_debt < vars.prev_total_variable_debt {
        return Err(Error::AmountSubtractionError);
    }

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;
    ic_cdk::println!(
        "total_debt_accrued in accure: {:?}",
        vars.total_debt_accrued
    );
    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone(),
    ); //percent
    ic_cdk::println!("amount_to_mint in accure: {:?}", vars.amount_to_mint);
    if vars.amount_to_mint != Nat::from(0u128) {
        reserve_data.accure_to_platform += (ScalingMath::scaled_mul(
            vars.amount_to_mint,
            reserve_cache.next_liquidity_index.clone(),
        )) / 100 as u128;
        ic_cdk::println!(
            "accure_to_platform in accure: {:?}",
            reserve_data.accure_to_platform
        );
    }
    Ok(())
}
