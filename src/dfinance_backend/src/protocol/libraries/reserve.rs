use crate::api::inter_canister::{asset_transfer,get_balance, get_total_supply};
use crate::constants::{
    constant_variables::constants::{ONE_VALUE, TOLERANCE_FACTOR},
    data_types::zero_nat_value,
    errors::Error,
    validators::{validate_asset_image_url, validate_zero_value, validate_asset_name},
};
use crate::declarations::datatypes::{AssetInfo,ReserveCache, ReserveData, UserReserveData};
use crate::declarations::structs::AccrueToTreasuryLocalVars;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::guards::access_control::guard_admin_only;
use crate::protocol::libraries::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::utils::{
    log::{log_internal, LogLevel},
    math_utils::{ScalingMath, calculate_compounded_interest, calculate_linear_interest, current_timestamp}

};
use crate::stable_storage::{
    state_handler::{mutate_state, read_state, insert_certified_value},
    storable::Candid
};
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
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,

        curr_liquidity_index: reserve_data.liquidity_index.clone(),
        next_liquidity_index: reserve_data.liquidity_index.clone(),
        curr_liquidity_rate: reserve_data.current_liquidity_rate.clone(),

        curr_debt_index: reserve_data.debt_index.clone(),
        curr_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_index: reserve_data.debt_index.clone(),

        reserve_factor: reserve_data.configuration.reserve_factor.clone(),

        curr_debt: reserve_data.asset_borrow.clone(),
        next_debt: reserve_data.asset_borrow.clone(),
        curr_supply: reserve_data.asset_supply.clone(), 
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

    if reserve_data.last_update_timestamp == current_time {
        return Ok(());
    }
    
    update_indexes(reserve_data, reserve_cache);
    accrue_to_treasury(reserve_data, reserve_cache)?;
    

    reserve_data.last_update_timestamp = current_time;
    debug!(
        "Updated reserve data last update timestamp to: {}",
        reserve_data.last_update_timestamp
    );
    info!("Indexes have been updated and accrued to treasury successfully");
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

    // Update liquidity index if there's an active liquidity rate
    if reserve_cache.curr_liquidity_rate != zero_nat_value() {
        
        let cumulated_liquidity_interest = calculate_linear_interest(
            reserve_cache.curr_liquidity_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
        );
        
        reserve_cache.next_liquidity_index =
            cumulated_liquidity_interest.clone().scaled_mul(reserve_cache.curr_liquidity_index.clone());
       
        reserve_data.liquidity_index = reserve_cache.next_liquidity_index.clone();
        
        debug!(
            "[Liquidity Update] curr_rate: {}, cumulated_interest: {}, next_index: {}, updated_index: {}",
            reserve_cache.curr_liquidity_rate,
            cumulated_liquidity_interest,
            reserve_cache.next_liquidity_index,
            reserve_data.liquidity_index
        );
    }

    // Update debt index if there's outstanding debt
    if reserve_cache.curr_debt != zero_nat_value() {
        let cumulated_borrow_interest = calculate_compounded_interest(
            reserve_cache.curr_debt_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        reserve_cache.next_debt_index =
            cumulated_borrow_interest.clone().scaled_mul(reserve_cache.curr_debt_index.clone());
        
        reserve_data.debt_index = reserve_cache.next_debt_index.clone();
        
        debug!(
            "[Debt Update] curr_debt: {}, debt_rate: {}, cumulated_interest: {}, next_index: {}, updated_index: {}",
            reserve_cache.curr_debt,
            reserve_cache.curr_debt_rate,
            cumulated_borrow_interest,
            reserve_cache.next_debt_index,
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
    let total_supply = reserve_cache.clone().curr_supply.scaled_mul(reserve_cache.next_liquidity_index.clone());

    let asset = reserve_data.asset_name.clone();
    let interest_rate_params = initialize_interest_rate_params(&asset);


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
    trace!("calculate interest rate function executed successfully");

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
        amount.clone().scaled_div(index.clone())
    };

    if adjusted_amount == zero_nat_value() {
        error!("Error: Adjusted amount is zero");
        return Err(Error::InvalidBurnAmount);
    }

    let balance = get_balance(token_canister_principal, user_principal).await?;

    debug!("user balance = {}, Adjusted amount calculated: {}", balance, adjusted_amount);
    let balance_increase: Nat;
    if burn_dtoken {
        is_withdraw = true;
        info!("Processing DToken burn...");
        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());
       
        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;


        if user_state.d_token_balance == adjusted_amount {
            debug!("Setting DToken balance to zero");
            user_state.d_token_balance = zero_nat_value();
        } else if user_state.d_token_balance < adjusted_amount {
            error!("DToken balance is less than adjusted amount");
            return Err(Error::ErrorDTokenBalanceLessThan);
        } else {
           
            user_state.d_token_balance -= adjusted_amount.clone();

            if user_state.d_token_balance < Nat::from(1000u128) {
                user_state.d_token_balance = zero_nat_value();
            }
        }

        user_state.liquidity_index = index.clone();
        debug!(
            "balance increase: {}, final_d_token_balance: {}, new_liquidity_index: {}",
            balance_increase,
            user_state.d_token_balance,
            user_state.liquidity_index
        );
    } else {
        info!("Processing variable borrow burn...");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.variable_borrow_index.clone());
      
        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError);
        }
        balance_increase = balance_indexed - balance_user_indexed;

       
        if user_state.debt_token_blance == adjusted_amount {
            debug!("Setting debt token balance to zero");
            user_state.debt_token_blance = zero_nat_value();
        } else if user_state.debt_token_blance < adjusted_amount.clone() {
            error!("Debt token balance is less than adjusted amount");
            return Err(Error::DebtTokenBalanceLessThan);
        } else {
           
            user_state.debt_token_blance -= adjusted_amount.clone();

            if user_state.debt_token_blance < Nat::from(1000u128) {
                user_state.debt_token_blance = zero_nat_value();
            }
        }


        user_state.variable_borrow_index = index;
        debug!(
            "balance_increase: {}, final_debt_token_balance: {}, new_variable_borrow_index: {}",
            balance_increase,
            user_state.debt_token_blance,
            user_state.variable_borrow_index
        );
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
            amount_to_burn = balance.clone();
            if burn_dtoken {
                user_state.d_token_balance = zero_nat_value();
            } else {
                user_state.debt_token_blance = zero_nat_value();
            }
        }
        debug!(
            " amount_to_burn = {}",
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

    if adjusted_amount == zero_nat_value() {
        error!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    let balance = get_balance(token_canister_principal, user_principal).await?;
    
    debug!("Adjusted amount: {}, previous token balance {}", adjusted_amount, balance);
    let balance_increase: Nat;
    if minting_dtoken {
        trace!("minting dtoken");

        let balance_indexed = balance.clone().scaled_mul(index.clone());
        let balance_user_indexed = balance
            .clone()
            .scaled_mul(user_state.liquidity_index.clone());

        if balance_indexed < balance_user_indexed {
            error!("Error: Balance indexed is less than user indexed");
            return Err(Error::AmountSubtractionError);
        }

        balance_increase = balance_indexed - balance_user_indexed;

       
        if user_state.liquidity_index == zero_nat_value() {
            user_state.d_token_balance = amount.clone();
        } else {
            user_state.d_token_balance += adjusted_amount.clone();
        }
       

        user_state.liquidity_index = index;
        debug!("balance incre dtoken{}, new dtoken balance of user {}, user new liq index {} ", balance_increase, user_state.d_token_balance, user_state.liquidity_index);
       
    } else {
        trace!("minting debttoken");
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
        if user_state.variable_borrow_index == zero_nat_value() {
            user_state.debt_token_blance = amount.clone();
        } else {
            user_state.debt_token_blance += adjusted_amount.clone();
        }

        user_state.variable_borrow_index = index;
       
        debug!("balance increase debttoken {}, new debt balance {}, new debt index {} ", balance_increase, user_state.debt_token_blance, user_state.variable_borrow_index);
    }

    let newmint = amount + balance_increase;
    debug!("minted token {}", newmint);
  
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        newmint,
    )
    .await
    {
        Ok(_) => {
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
 * @Formula used in accrue_to_treasury:
 *
 * 1. Previous Total Variable Debt:
 *    prev_total_variable_debt = reserve_cache.curr_debt * reserve_cache.curr_debt_index
 *
 * 2. Current Total Variable Debt:
 *    curr_total_variable_debt = reserve_cache.curr_debt * reserve_cache.next_debt_index
 *
 * 3. Total Debt Accrued:
 *    total_debt_accrued = curr_total_variable_debt - prev_total_variable_debt
 *
 * 4. Amount to Mint:
 *    amount_to_mint = total_debt_accrued * reserve_cache.reserve_factor
 *
 * 5. Amount Accrued to Platform:
 *    amount_to_platform = amount_to_mint * Next Liquidity Index / 100
 *    reserve_data.accure_to_platform += (amount_to_mint * reserve_cache.next_liquidity_index) / 100
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
        debug!("Skipping treasury accrual (reserve factor is zero).");
        return Ok(());
    }

    vars.prev_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.curr_debt_index.clone(),
    );
    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );

    if vars.curr_total_variable_debt < vars.prev_total_variable_debt {
        error!("Error: Current total variable debt is less than previous total variable debt");
        return Err(Error::AmountSubtractionError);
    }

    vars.total_debt_accrued = vars.curr_total_variable_debt.clone() - vars.prev_total_variable_debt.clone();
    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone()/Nat::from(100u128),
    ); 

    debug!(
        "Treasury Accrual: prev_debt={:?}, curr_debt={:?}, accrued={:?}, accrue_to_platform={:?}",
        vars.prev_total_variable_debt,
        vars.curr_total_variable_debt,
        vars.total_debt_accrued,
        vars.amount_to_mint
    );
    if vars.amount_to_mint != zero_nat_value() {
        reserve_data.accure_to_platform += vars.amount_to_mint.clone();
    }
    Ok(())
}

/*
 * @title Reserve Initialization (Only for Testnet)
 * @notice Provides functionalities for initializing reserves, modifying reserve configurations,
 *         and verifying controller permissions.
 * @dev This module handles the creation of token canisters, updating reserve parameters,
 *      and ensures only controllers can execute certain operations.
 *
 * @param token_name The name of the token to be initialized.
 * @param reserve_data The reserve data structure containing metadata and token-related details.
 *
 * @return `Ok(())` on success.
 *
 * @functionality Initializes a reserve by creating its associated canisters and storing metadata.
 */
#[cfg(feature = "testnet")]
#[update]
pub async fn initialize(
    token_name: String,
    mut reserve_data: ReserveData,
    asset_image: String,
) -> Result<(), Error> {
    guard_admin_only()?;
    validate_asset_name(&token_name)?;
    validate_asset_image_url(&asset_image)?;

    if read_state(|state| state.reserve_list.contains_key(&token_name)) {
        return Err(Error::TokenAlreadyExist);
    }

    let token_canister_id =
        match create_testtoken_canister(token_name.clone(), token_name.clone()).await {
            Ok(principal) =>{
                info!("Successfully created test token ledger");  //debug?
                principal
            },
            Err(e) =>{ 
                error!("Failed to create test token ledger : {:?}", e);
                return Err(e)
            },
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
            Ok(principal) => {
                info!("Successfully created d token canister");
                Some(principal)
            },
            Err(e) => {
                error!("error while calling create token canister = {:?}", e);
                return Err(e);
            }
        };
    reserve_data.debt_token_canister =
        match create_token_canister(debt_token_name.clone(), debt_token_name).await {
            Ok(principal) => {
                info!("Successfully created debt token canister");
                Some(principal)
            },
            Err(e) => {
                error!("error while calling create token canister = {:?}", e);
                return Err(e);
            }
        };

    reserve_data.last_update_timestamp = current_timestamp();

    mutate_state(|state| {
        state
            .reserve_list
            .insert(token_name.clone(), token_canister_id);

            insert_certified_value("asset_principal".to_string(),token_canister_id);
        state
            .asset_records
            .insert(token_name.clone(), Candid(asset_info.clone()));
        insert_certified_value("all_assets".to_string(), asset_info);
        let reserve_data_e = &mut state.asset_index;
      
        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
    });
    info!("Reserve for {} initialized successfully", token_name);

    Ok(())
}

#[cfg(feature = "mainnet")]
#[update]
pub async fn initialize(
    token_name: String,
    mut reserve_data: ReserveData,
    token_canister_id: Principal,
    asset_image: String,
) -> Result<(), Error> {
    guard_admin_only()?;
    validate_asset_name(&token_name)?;
    validate_asset_image_url(&asset_image)?;

    if read_state(|state| state.reserve_list.contains_key(&token_name)) {
        return Err(Error::TokenAlreadyExist);
    }

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
            Err(e) => return Err(e),
        };
    reserve_data.debt_token_canister =
        match create_token_canister(debt_token_name.clone(), debt_token_name).await {
            Ok(principal) => Some(principal),
            Err(e) => return Err(e),
        };

    reserve_data.last_update_timestamp = current_timestamp();

    mutate_state(|state| {
        state
            .reserve_list
            .insert(token_name.clone(), token_canister_id);

        state
            .asset_records
            .insert(token_name.clone(), Candid(asset_info));

        let reserve_data_e = &mut state.asset_index;

        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
        info!("Reserve for {} initialized successfully", token_name);
    });

    Ok(())
}

/*
 * @title Reset Reserve Value
 * @notice Resets a specific variable in the reserve configuration.
 * @dev This function allows only the controller to modify key reserve parameters.
 *
 * @param asset_name The name of the asset whose reserve data is to be modified.
 * @param variable_name The specific variable to reset (e.g., "liquidity_index", "ltv").
 * @param reset_value The new value to set for the specified variable.
 *
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
    trace!("Executing reset_reserve_value");
    guard_admin_only()?;
    validate_asset_name(&asset_name.clone())?;
    validate_zero_value(&reset_value)?;

    let mut reserve_data = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&asset_name)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| {
                Error::NoReserveDataFound
            })
    })?;

    debug!(
        "Resetting reserve value for variable and reset value '{}, {}'",
        variable_name,
        reset_value
    );

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
        _ => {
            error!("Reset reserve value failed: Invalid variable name.");
            return Err(Error::InvalidVariableName)
        },
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(asset_name, Candid(reserve_data));
    });
    Ok(())
}

/*
 * @title Get Reserve Data
 * @dev Fetches the reserve data for a specific asset.
 * @param asset The asset name.
 * @returns The reserve data if found.
 *  @functionality Retrieve Reserve Data for a Specified Asset
 */

 pub fn get_reserve_data(asset: String) -> Result<ReserveData, Error> {
    read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })
}

/**
 * @title Get Asset Principal
 * @dev Retrieves the principal associated with a given asset name.
 * @param asset_name The name of the asset whose principal is to be fetched.
 * @returns The principal linked to the specified asset, or an error if the asset is not found or invalid.
 *
 * @functionality Validates the asset name and fetches the corresponding principal from the reserve list.
 */
pub fn get_asset_principal(asset_name: String) -> Result<Principal, Error> {
    validate_asset_name(&asset_name)?;

    let asset_principal = read_state(|state| {state.reserve_list.get(&asset_name).ok_or_else(|| Error::NotFoundAssetPrincipal)})?;
    
    Ok(asset_principal)
}