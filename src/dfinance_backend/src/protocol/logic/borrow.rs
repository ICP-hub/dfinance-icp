use crate::api::inter_canister::asset_transfer_from;
use crate::stable_storage::state_handler::*;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::{
    INITIAL_DEBT_INDEX, TOKEN_TRANSFER_FEE,
};
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::stable_storage::storable::Candid;
use crate::declarations::structs::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::guards::access_control::guard_prevent_anonymous;
use crate::protocol::libraries::reserve::{self};
use crate::protocol::libraries::update::UpdateLogic;
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::math_utils::ScalingMath;
use crate::protocol::utils::price::update_token_price;
use crate::api::query::{get_asset_debt, get_cached_exchange_rate, reserve_ledger_canister_id};
use candid::{Nat, Principal};
use ic_cdk::update;
use crate::guards::locks::CallerGuard;
use crate::guards::api_limitor::request_limiter;

/*
-------------------------------------
----------- BORROW LOGIC ------------
-------------------------------------
 */

/**
 * @functionality This function allows users to borrow a specified amount of an asset. It performs
 * a series of checks, validations, state updates, and transfers:
 * - Validates the asset and amount parameters.
 * - Ensures that the caller is authenticated and not anonymous.
 * - Acquires a lock to prevent concurrent operations on the same user.
 * - Validates the borrowing request and updates relevant data (reserve and user state).
 * - Transfers the borrowed amount to the user's wallet.
 * - Implements a rollback mechanism in case of any failure during the transaction.
 *
 * @title Execute Borrow Function
 *
 * @notice Allows users to borrow a specified amount of assets while performing necessary checks,
 *         state updates, and validations. The function:
 *         - Validates input parameters.
 *         - Checks the caller's identity.
 *         - Acquires a lock.
 *         - Validates the borrow request.
 *         - Updates user and reserve data.
 *         - Transfers the asset to the user.
 *         - Rolls back changes if any operation fails.
 *
 * @dev The function follows a structured workflow:
 *      1. **Input validation**: Ensures a valid asset name, a positive amount, and a known caller.
 *      2. **Lock acquisition**: Ensures only one operation can proceed at a time for a user.
 *      3. **State mutation**: Updates reserve data and the user's profile in the canister's state.
 *      4. **Borrow validation**: Verifies that the request complies with platform rules (e.g., limits, availability).
 *      5. **Asset transfer**: Moves the requested amount from the platform's reserve to the user's wallet.
 *      6. **Rollback mechanism**: If any step fails, reverts all changes and releases resources.
 *
 * @param params The parameters required to execute the borrow operation:
 *               - `asset`: The name of the asset to be borrowed.
 *               - `amount`: The amount of the asset to be borrowed.
 *
 * @return Result<Nat, Error> The user's new balance after a successful transaction or an error code if the operation fails.
 */
#[update]
pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<Nat, Error> {
    request_limiter()?;
    // prevent anonymous access
    guard_prevent_anonymous()?;
    let user_principal = ic_cdk::caller();
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;

    // input validations
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

    ic_cdk::println!("User principal: {:?}", user_principal);

    let borrow_amount = params.amount.clone();
    ic_cdk::println!("borrow amount = {}", borrow_amount);

    let ledger_canister_id = reserve_ledger_canister_id(params.asset.clone())?;

    let platform_principal = ic_cdk::api::id();

    let mut reserve_data = read_state(|state| {
        state
            .asset_index
            .get(&params.asset.to_string())
            .map(|res| res.0)
    })
    .ok_or_else(|| Error::NoReserveDataFound)?;

    if reserve_data.asset_borrow == zero_nat_value() {
        *&mut reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }

    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    ic_cdk::println!("Reserve state updated successfully");

    ValidationLogic::validate_borrow(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await?;

    // ----------- Update logic here -------------
    UpdateLogic::update_user_data_borrow(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;

    ic_cdk::println!("User data updated successfully");

    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
    ic_cdk::println!("Current debt: {:?}", reserve_cache.curr_debt);

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(),
        zero_nat_value(),
    )
    .await?;

    mutate_state(|state| {
        state
            .asset_index
            .insert(params.asset.clone(), Candid(reserve_data.clone()))
    });

    // Transfers borrow amount from the pool to the user
    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        params.amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                new_balance
            );
            // mutate_state(|state| {
            //     let asset_index = &mut state.asset_index;
            //     asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
            // });
            Ok(new_balance)
        }
        Err(_) => {
            //Rollback user state
            let repay_param = ExecuteRepayParams {
                asset: params.asset.clone(),
                amount: borrow_amount.clone(),
                on_behalf_of: None,
            };

            UpdateLogic::update_user_data_repay(
                user_principal,
                &reserve_cache,
                repay_param,
                &mut reserve_data,
            )
            .await?;

            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            return Err(Error::ErrorMintDebtTokens);
        }
    }
}

/*
-------------------------------------
------------ REPAY LOGIC ------------
-------------------------------------
 */

/**
 * @notice Executes the repay operation for a given asset and amount.
 *         This function validates parameters, checks asset conditions,
 *         and updates the user's debt position in the reserve system.
 *         It ensures that only valid principals can perform the operation
 *         and manages locking to prevent race conditions.
 *         If the operation fails at any step, the state is rolled back to maintain consistency.
 *
 * @param params The parameters required for the repay operation:
 *               - `asset`: The name of the asset to be repaid (string).
 *               - `amount`: The amount of the asset to repay (Nat).
 *               - `on_behalf_of`: The principal ID of the user being repaid on behalf of (Optional, Principal).
 *
 * @return Result<Nat, Error> The updated balance (Nat) after successful repayment,
 *         or an error (Error) indicating why the repayment failed.
 *
 * @dev The function follows these steps:
 *      - Validates the input parameters (asset, amount, on-behalf-of principal).
 *      - Acquires a lock to prevent re-entrancy during the repayment process.
 *      - Fetches reserve data and ensures the repayment can proceed.
 *      - Updates the user’s debt position in the reserve system.
 *      - Transfers the tokens from the user or liquidator to the platform canister.
 *      - Rolls back changes if any step fails to maintain system consistency.
 *
 * @functionality:
 *      - Validates input parameters like asset name, amount, and optional on-behalf-of principal.
 *      - Handles locking mechanism to prevent re-entrancy during repayment.
 *      - Fetches and updates reserve data to reflect the repayment.
 *      - Transfers assets from user or liquidator and ensures consistency.
 *      - Rolls back any changes if any step fails during the repayment process.
 */

#[update]
pub async fn execute_repay(mut params: ExecuteRepayParams) -> Result<Nat, Error> {
    request_limiter()?;
    // guard to prevent anonymous access
    guard_prevent_anonymous()?;

    // for user. TODO: we can put this one as well as in guard file as function.
    if params.on_behalf_of == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }


    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            (user_principal, Some(ic_cdk::caller()))
        } else {
            (ic_cdk::caller(), None)
        };

    let _guard;
    if params.on_behalf_of.is_none() {
        _guard = CallerGuard::lock_principal(user_principal.clone())?;
    }
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

    let ledger_canister_id = reserve_ledger_canister_id(params.asset.clone())?;

    let platform_principal = ic_cdk::api::id();

    let repay_amount = params.amount.clone();
    ic_cdk::println!("Repay amount: {:?}", repay_amount);

    // Determines the sender principal
    let transfer_from_principal = if let Some(liquidator) = liquidator_principal {
        ic_cdk::println!("Liquidator principal: {:?}", liquidator);
        liquidator
    } else {
        user_principal
    };
    ic_cdk::println!(
        "Transfer from principal: {:?}",
        transfer_from_principal.to_string()
    );

    let mut reserve_data = read_state(|state| {
        state
            .asset_index
            .get(&params.asset.to_string())
            .map(|reserve| reserve.0.clone())
    })
    .ok_or_else(|| Error::NoReserveDataFound)?;

    if reserve_data.debt_index == zero_nat_value() {
        reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    ic_cdk::println!("Reserve state updated successfully");

    // Validates repay using the reserve_data
    ValidationLogic::validate_repay(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        liquidator_principal,
        ledger_canister_id,
    )
    .await?;

    ic_cdk::println!("Repay validated successfully");

    let _ = update_token_price(params.asset.clone()).await;

    ic_cdk::println!("Asset borrow: {:?}", reserve_data.asset_borrow);

    // get exchange rates
    let asset_price: Nat = get_cached_exchange_rate(params.asset.clone())?;

    let transfer_token_fee = Nat::from(TOKEN_TRANSFER_FEE).scaled_div(asset_price);

    if params.amount.clone() < transfer_token_fee {
        return Err(Error::FeeExceedsAmount);
    }
    params.amount = params.amount - transfer_token_fee.clone();

    let user_current_debt: Nat = get_asset_debt(params.asset.clone(), Some(user_principal)).await?;

    ic_cdk::println!("User current debt: {:?}", user_current_debt);
    if user_current_debt == zero_nat_value() {
        return Err(Error::NoDebtToRepay);
    }

    if params.amount.clone() > user_current_debt {
        return Err(Error::RepayMoreThanDebt);
    }

    // ----------- Update logic here -------------
    UpdateLogic::update_user_data_repay(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;

    ic_cdk::println!("User data updated successfully");
    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        zero_nat_value(),
        params.amount.clone(),
    )
    .await?;

    mutate_state(|state| {
        state
            .asset_index
            .insert(params.asset.clone(), Candid(reserve_data.clone()))
    });

    // Transfers the asset from the user to our backend canister
    match asset_transfer_from(
        ledger_canister_id,
        transfer_from_principal,
        platform_principal,
        repay_amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!(
                "Asset transfer from user to backend executed successfully, new balance: {:?}",
                new_balance
            );
            // mutate_state(|state| {
            //     let asset_index = &mut state.asset_index;
            //     asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
            // });
            Ok(new_balance)
        }
        Err(_) => {
            ic_cdk::println!("inside the error");
            //Rollback user state
            let borrow_param = ExecuteBorrowParams {
                asset: params.asset.clone(),
                amount: params.amount.clone(),
            };

            UpdateLogic::update_user_data_borrow(
                user_principal,
                &reserve_cache,
                borrow_param,
                &mut reserve_data,
            )
            .await?;

            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()));
            });
            return Err(Error::ErrorBurnDebtTokens);
        }
    }
}
