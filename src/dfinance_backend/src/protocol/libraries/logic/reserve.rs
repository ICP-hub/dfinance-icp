use crate::api::functions::asset_transfer;
use crate::api::functions::get_balance;
use crate::api::resource_manager::get_repay_locked_amount;
use crate::api::resource_manager::release_lock;
use crate::api::resource_manager::repay_lock_amount;
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::logic::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::libraries::math::math_utils;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use candid::{Nat, Principal};
use ic_cdk::api::time;

struct AccrueToTreasuryLocalVars {
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

/// Returns the current timestamp in seconds by dividing the result of `time()` by 1 billion (to convert from nanoseconds).
fn current_timestamp() -> u64 {
    time() / 1_000_000_000
}

//// To update the price cache variables.
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

/// @title Update State Function
/// @notice This function updates the state of the reserve data by checking if the state needs to be updated based on the current timestamp.
///         It performs necessary operations such as updating indexes and accruing rewards to the treasury if the state is out of date.
///         The function ensures that only necessary updates are made and prevents redundant state updates.
///
/// @dev The function follows a structured workflow:
///      1. **Timestamp Check**: Compares the current timestamp with the `last_update_timestamp` in `reserve_data` to determine if an update is needed.
///      2. **Update Indexes**: If the timestamp has changed, it proceeds to update the reserve indexes and accrue treasury rewards.
///      3. **Accrue to Treasury**: Calls the `accrue_to_treasury` function to update any funds that need to be accrued to the treasury.
///      4. **Update Last Update Timestamp**: Sets the `last_update_timestamp` to the current timestamp to mark the state as updated.
///
/// @param reserve_data The mutable reference to the `ReserveData` that holds the current state of the reserve, including the last update timestamp.
/// @param reserve_cache The mutable reference to the `ReserveCache` that stores additional reserve-related data used for updates.
///
/// @return None This function does not return any value. It modifies the state of `reserve_data` and `reserve_cache` based on the updates.
///
/// @error None This function does not have explicit error handling, as it primarily operates on state updates and timestamp comparison.
pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);
    accrue_to_treasury(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

/// @title Update Indexes Function
/// @notice This function updates the liquidity and debt indices based on the current state of the reserve data and cache.
///         It checks whether the liquidity rate or debt values are non-zero and, if so, calculates the new liquidity and debt indices.
///         The function uses linear interest calculations for liquidity and compounded interest for debt to update the indices accordingly.
///
/// @dev The function follows a structured workflow:
///      1. **Liquidity Index Update**:
///         - If the current liquidity rate is non-zero, it calculates the accumulated liquidity interest using the `calculate_linear_interest` function.
///         - The new liquidity index is computed by multiplying the accumulated interest with the current liquidity index.
///         - The `liquidity_index` in `reserve_data` is then updated with the newly calculated value.
///
///      2. **Debt Index Update**:
///         - If the current debt value is non-zero, it calculates the accumulated borrow interest using the `calculate_compounded_interest` function.
///         - The new debt index is computed by multiplying the accumulated borrow interest with the current debt index.
///         - The `debt_index` in `reserve_data` is then updated with the newly calculated value.
///
/// @param reserve_data The mutable reference to the `ReserveData` that holds the current reserve state, including the liquidity and debt indices.
/// @param reserve_cache The mutable reference to the `ReserveCache` that holds reserve-related data, including current liquidity and debt rates, indices, and timestamps.
///
/// @return None This function does not return any value. It modifies the state of the `reserve_data` and `reserve_cache` by updating the liquidity and debt indices.
///
/// @error None This function assumes the provided reserve data and cache contain the necessary fields. If rates or indices are invalid, there may be unintended results, but no explicit error handling is performed here.
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

/// @title Update Interest Rates Function
/// @notice This asynchronous function updates the liquidity and debt interest rates for the reserve based on the provided parameters.
///         It calculates the new interest rates by considering the amount of liquidity added or taken, total debt, and other interest rate parameters.
///
/// @dev The function follows these steps:
///      1. **Total Debt Calculation**:
///         - It calculates the total debt by multiplying the current debt with the next debt index, which accounts for any accumulated interest.
///      
///      2. **Interest Rate Parameters Initialization**:
///         - It retrieves the asset name from the `reserve_data` and initializes interest rate parameters using the `initialize_interest_rate_params` function.
///         - If no asset name is provided, it defaults to `"no token"`.
///      
///      3. **Interest Rates Calculation**:
///         - The `calculate_interest_rates` function is called to calculate the new liquidity and debt interest rates based on the provided liquidity changes (`liq_added` and `liq_taken`), total debt, and the interest rate parameters.
///      
///      4. **Updating the Reserve Data**:
///         - If the interest rates are successfully calculated, they are stored in the `reserve_data` as `current_liquidity_rate` and `borrow_rate`.
///      
///      5. **Error Handling**:
///         - If an error occurs during the interest rate calculation, the function logs the error and returns it to the caller.
///
/// @param reserve_data A mutable reference to the `ReserveData` struct, which contains data about the reserve, including liquidity and debt rates.
/// @param reserve_cache A mutable reference to the `ReserveCache` struct, which contains cache data like the current debt, next debt index, and reserve factor.
/// @param liq_taken The amount of liquidity taken from the reserve, used in interest rate calculations.
/// @param liq_added The amount of liquidity added to the reserve, used in interest rate calculations.
///
/// @return Result<(), Error> This function returns `Ok(())` if the interest rates are successfully updated, or an `Error` if an issue occurs during the calculation.
///
/// @error If the calculation of interest rates fails or if any expected value is missing (e.g., asset name), an error is logged and returned.
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

/// The burn_scaled function handles the burning of tokens based on user actions.
/// It manages the amount to be burned, adjusts the balance, and handles the corresponding reserve and user state changes.
///
/// # Arguments
/// * `reserve`: A mutable reference to the ReserveData structure, representing the reserve state (assets, borrow, etc.).
/// * `user_state`: A mutable reference to the UserReserveData structure, representing the user's state (balances, debt tokens, etc.).
/// * `amount`: The amount to be burned, as a Nat type.
/// * `index`: The index used to scale the amount, typically related to the interest rate or supply rate.
/// * `user_principal`: The user's principal ID, used to identify the user.
/// * `token_canister_principal`: The principal ID of the token canister responsible for transferring tokens.
/// * `platform_principal`: The principal ID of the platform or protocol performing the token burn.
/// * `burn_dtoken`: A flag indicating whether the burn is for DToken (true) or a variable borrow (false).
///
/// # Returns
/// * `Result<(), Error>`: A result indicating success (`Ok(())`) or failure (`Err(Error)`).
///
/// # Notes
/// This function is designed for burning tokens, either from a user's DToken balance or a variable borrow.
/// The burn operation reduces the user's balance and adjusts the reserve's asset or borrow state accordingly.
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
    // if balance.clone() > adjusted_amount.clone()
    //     && balance.clone() - adjusted_amount.clone() < Nat::from(1000u128)
    // {
    //     adjusted_amount = balance.clone();
    // }
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

        // balance_increase = (balance.clone().scaled_mul(index.clone()))
        //     - (balance
        //         .clone()
        //         .scaled_mul(user_state.liquidity_index.clone())); //fetch from user
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
            // mainting threasold here.
            // TODO: look into the threshold value again
            ic_cdk::println!(
                "dtoken balance after subtraction = {}",
                user_state.d_token_balance
            );
            if user_state.d_token_balance < Nat::from(1000u128) {
                user_state.d_token_balance = Nat::from(0u128);
            }
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

        // balance_increase = (balance.clone().scaled_mul(index.clone()))
        //     - (balance
        //         .clone()
        //         .scaled_mul(user_state.variable_borrow_index.clone()));

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
            // mainting threasold here.
            // TODO: look into the threshold value again
            if user_state.debt_token_blance < Nat::from(1000u128) {
                user_state.debt_token_blance = Nat::from(0u128);
            }
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
                ic_cdk::println!("Minting successful");
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
        let mut amount_to_burn = amount - balance_increase;
        ic_cdk::println!("Burning tokens, initial amount: {}", amount_to_burn);

        if balance.clone() > amount_to_burn.clone()
            && balance.clone() - amount_to_burn.clone() < Nat::from(1000u128)
        {
            ic_cdk::println!("Adjusting burn amount to balance");
            amount_to_burn = balance.clone();
            if burn_dtoken {
                user_state.d_token_balance = Nat::from(0u128);
            } else {
                user_state.debt_token_blance = Nat::from(0u128);
            }
        }
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

/// The mint_scaled function handles the minting of tokens based on user actions.
/// It calculates the amount of tokens to be minted, adjusts the user and reserve states accordingly, and performs a token transfer to the user.
///
/// # Arguments
/// * `reserve`: A mutable reference to the ReserveData structure, representing the reserve state (assets, borrow, etc.).
/// * `user_state`: A mutable reference to the UserReserveData structure, representing the user's state (balances, debt tokens, etc.).
/// * `amount`: The amount to be minted, as a Nat type.
/// * `index`: The index used to scale the amount, typically related to the interest rate or supply rate.
/// * `user_principal`: The user's principal ID, used to identify the user.
/// * `token_canister_principal`: The principal ID of the token canister responsible for transferring tokens.
/// * `platform_principal`: The principal ID of the platform or protocol performing the token mint.
/// * `minting_dtoken`: A flag indicating whether the mint is for DToken (true) or DebtToken (false).
///
/// # Returns
/// * `Result<(), Error>`: A result indicating success (`Ok(())`) or failure (`Err(Error)`).
///
/// # Notes
/// This function is designed for minting tokens, either DTokens or DebtTokens, based on the provided flag.
/// It first checks if the minting amount is valid, scales the amount, and updates the user's balance and the reserve's asset supply or borrow accordingly.
/// After that, it calls the `asset_transfer` function to transfer the minted tokens to the user.
///
/// # Steps
/// 1. Adjusts the mint amount based on the scaling index (rounding up if there's a remainder).
/// 2. Retrieves the user's balance from the token canister and calculates any increase in balance due to the minting action.
/// 3. If minting DToken, it updates the user's DToken balance and the reserve's asset supply.
/// 4. If minting DebtToken, it updates the user's DebtToken balance and the reserve's asset borrow.
/// 5. The function ensures that the liquidity index or borrow index is properly updated for the user.
/// 6. Finally, it performs the token transfer to the user using the adjusted amount and logs the result.
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

    let mut adjusted_amount = if amount.clone() % index.clone() != Nat::from(0u128)
        && amount.clone() < Nat::from(10u128)
    {
        amount.clone().scaled_div(index.clone()) + Nat::from(1u128) // Round up if there's a remainder
    } else {
        amount.clone().scaled_div(index.clone())
    };
    ic_cdk::println!("Adjusted amount: {}", adjusted_amount.clone());
    // if amount.clone() > adjusted_amount.clone()
    //     && amount.clone() - adjusted_amount.clone() < Nat::from(1000u128)
    // {
    //     adjusted_amount = amount.clone();
    // }

    ic_cdk::println!("Adjusted amount: {}", adjusted_amount);
    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    let balance_result = get_balance(token_canister_principal, user_principal).await;
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            ic_cdk::println!("Error converting balance to u128: {:?}", err);
            return Err(Error::ErrorGetBalance);
        }
    };
    ic_cdk::println!("Fetched balance in Nat: {:?}", balance);
    ic_cdk::println!("mint balance = {}", balance);

    let mut balance_increase = Nat::from(0u128);
    if minting_dtoken {
        println!("minting dtoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());

        if balance_indexed < balance_user_indexed {
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;
        // balance_increase = (balance.clone().scaled_mul(index.clone()))
        //     - (balance
        //         .clone()
        //         .scaled_mul(user_state.liquidity_index.clone())); //fetch from user
        println!("balance incr dtoken{}", balance_increase);
        if user_state.liquidity_index == Nat::from(0u128) {
            user_state.d_token_balance = amount.clone();
        } else {
            user_state.d_token_balance += adjusted_amount.clone();
        }
        ic_cdk::println!("new dtoken balance {}", user_state.d_token_balance);
        reserve.asset_supply += adjusted_amount;
        println!("updated asset supply{}", reserve.asset_supply);
        println!("user new dtoken balance {}", user_state.d_token_balance);
        user_state.liquidity_index = index;
        println!("user new liq index {}", user_state.liquidity_index);
    } else {
        println!("minting debttoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());

        if balance_indexed < balance_user_indexed {
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;
        // balance_increase = (balance.clone().scaled_mul(index.clone()))
        //     - (balance
        //         .clone()
        //         .scaled_mul(user_state.variable_borrow_index.clone()));
        println!("balance incr debttoken{}", balance_increase);
        if user_state.variable_borrow_index == Nat::from(0u128) {
            user_state.debt_token_blance = amount.clone();
        } else {
            user_state.debt_token_blance += adjusted_amount.clone();
        }

        println!("new debt balance {}", user_state.debt_token_blance);
        reserve.asset_borrow += adjusted_amount;
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
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
            Ok(())
        }
        Err(err) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
            Err(Error::ErrorMintTokens)
        }
    }
}

/// The accrue_to_treasury function calculates the accrued debt and mints the corresponding amount to the treasury.
/// It updates the reserve's balance based on changes in the debt and liquidity indices, considering the reserve factor.
///
/// # Arguments
/// * `reserve_data`: A mutable reference to the ReserveData structure, representing the current state of the reserve (accumulated treasury, etc.).
/// * `reserve_cache`: A reference to the ReserveCache structure, providing the current and next debt and liquidity indices for the reserve.
///
/// # Returns
/// * This function does not return any value, but it mutates the `reserve_data` structure, updating the treasury accumulation.
///
/// # Notes
/// The function calculates the accrued debt by comparing the total variable debt before and after applying the scaling indices.
/// It then determines how much to mint based on the reserve factor and updates the treasury accordingly.
///
/// # Steps
/// 1. Checks if the reserve factor is non-zero; if it is zero, the function terminates early.
/// 2. Calculates the previous total variable debt by scaling the current debt with the current debt index.
/// 3. Calculates the current total variable debt by scaling the current debt with the next debt index.
/// 4. If the current debt is less than the previous debt, the function releases a lock on the user’s principal.
/// 5. Computes the total debt accrued by subtracting the previous total debt from the current total debt.
/// 6. Calculates the amount to mint based on the total debt accrued and the reserve factor.
/// 7. If the amount to mint is non-zero, it updates the `accure_to_platform` in the `reserve_data`, scaling it by the next liquidity index.
/// 8. The function logs the updated values at each step for debugging purposes.
pub fn accrue_to_treasury(reserve_data: &mut ReserveData, reserve_cache: &ReserveCache) {
    // TODO: need to handle the error in this.
    let mut vars = AccrueToTreasuryLocalVars::default();

    let user_principal = ic_cdk::caller();

    if reserve_cache.reserve_factor == Nat::from(0u128) {
        return;
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
        let _ = release_lock(&user_principal);
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
}
