use ic_cdk::update;
use candid::{Nat, Principal};
use crate::api::state_handler::*;
use crate::constants::errors::Error;
use crate::reserve_ledger_canister_id;
use crate::declarations::storable::Candid;
use crate::api::functions::{asset_transfer_from, request_limiter};
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::update_token_price;
use crate::constants::interest_variables::constants::INITIAL_DEBT_INDEX;
use crate::declarations::assets::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::api::resource_manager::{
    acquire_lock, is_amount_locked, release_amount, release_lock, repay_release_amount,
};

/*
-------------------------------------
----------- BORROW LOGIC ------------
-------------------------------------
 */

/**
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
    if params.asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if params.asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if params.amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {:?}", user_principal);

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    if let Err(e) = request_limiter("execute_borrow") {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }

    let operation_key = user_principal;
    // Acquire the lock
    {
        if let Err(e) = acquire_lock(&operation_key) {
            ic_cdk::println!("Lock acquisition failed: {:?}", e);
            return Err(Error::LockAcquisitionFailed);
        }
    }

    let amount_requested = params.amount.clone();

    let result: Result<Nat, Error> = async {
        let ledger_canister_id = match reserve_ledger_canister_id(params.asset.clone()) {
            Ok(principal) => principal,
            Err(e) => {
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

        let platform_principal = ic_cdk::api::id();

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let mut reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

        if reserve_data.asset_borrow == Nat::from(0u128) {
            *&mut reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
        }
        ic_cdk::println!(
            "Updated debt index for reserve data: {:?}",
            reserve_data.debt_index
        );

        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Updates the liquidity and borrow index
        if let Err(e) = reserve::update_state(&mut reserve_data, &mut reserve_cache) {
            ic_cdk::println!("Failed to update reserve state: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Reserve state updated successfully");

        if let Err(e) = ValidationLogic::validate_borrow(
            &reserve_data,
            params.amount.clone(),
            user_principal,
            ledger_canister_id,
        )
        .await
        {
            ic_cdk::println!("Borrow validation failed: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Borrow validated successfully");

        // ----------- Update logic here -------------
        if let Err(e) = UpdateLogic::update_user_data_borrow(
            user_principal,
            &reserve_cache,
            params.clone(),
            &mut reserve_data,
        )
        .await
        {
            ic_cdk::println!("Failed to update user data: {:?}", e);
            if let Err(e) = release_amount(&params.asset, &amount_requested) {
                ic_cdk::println!(
                    "Failed to release amount for asset {}: {:?}",
                    params.asset,
                    e
                );
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("User data updated successfully");

        reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
        ic_cdk::println!("Current debt: {:?}", reserve_cache.curr_debt);

        if let Err(e) = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            params.amount.clone(),
            Nat::from(0u128),
        )
        .await
        {
            ic_cdk::println!("Failed to update interest rates: {:?}", e);
            if let Err(e) = release_amount(&params.asset, &amount_requested) {
                ic_cdk::println!(
                    "Failed to release amount for asset {}: {:?}",
                    params.asset,
                    e
                );
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
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
                Ok(new_balance)
            }
            Err(e) => {
                //Rollback user state
                let repay_param = ExecuteRepayParams {
                    asset: params.asset.clone(),
                    amount: params.amount.clone(),
                    on_behalf_of: None,
                };
                if let Err(e) = UpdateLogic::update_user_data_repay(
                    user_principal,
                    &reserve_cache,
                    repay_param,
                    &mut reserve_data,
                )
                .await
                {
                    ic_cdk::println!("Failed to rollback user state: {:?}", e);
                    if let Err(e) = release_amount(&params.asset, &amount_requested) {
                        ic_cdk::println!(
                            "Failed to release amount for asset {}: {:?}",
                            params.asset,
                            e
                        );
                        if let Err(e) = release_lock(&operation_key) {
                            ic_cdk::println!("Failed to release lock: {:?}", e);
                        }
                        return Err(e);
                    }
                    if let Err(e) = release_lock(&operation_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    return Err(Error::ErrorRollBack);
                };
                mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
                });
                ic_cdk::println!("Asset transfer failed, mint debt token. Error: {:?}", e);
                if let Err(e) = release_amount(&params.asset, &amount_requested) {
                    ic_cdk::println!(
                        "Failed to release amount for asset {}: {:?}",
                        params.asset,
                        e
                    );
                    if let Err(e) = release_lock(&operation_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    return Err(e);
                }
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(Error::ErrorMintDebtTokens);
            }
        }
    }
    .await;

    if is_amount_locked(&user_principal) {
        if let Err(e) = release_amount(&params.asset, &amount_requested) {
            ic_cdk::println!(
                "Failed to release amount for asset {}: {:?}",
                params.asset,
                e
            );
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
    }
    if let Err(e) = release_lock(&operation_key) {
        ic_cdk::println!("Failed to release lock: {:?}", e);
        return Err(e);
    }
    result
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
 */
#[update]
pub async fn execute_repay(params: ExecuteRepayParams) -> Result<Nat, Error> {
    if params.asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if params.asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if params.amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if let Some(principal) = params.on_behalf_of {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }

    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            let liquidator_principal = ic_cdk::caller();
            if liquidator_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            ic_cdk::println!("Caller is: {:?}", user_principal.to_string());
            (user_principal, None)
        };

    let operation_key = user_principal;

    if let Err(e) = request_limiter("execute_repay") {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }

    if params.on_behalf_of.is_none() {
        ic_cdk::println!("inside the on behalf");
        // Acquire the lock
        {
            if let Err(e) = acquire_lock(&operation_key) {
                ic_cdk::println!("Lock acquisition failed: {:?}", e);
                return Err(Error::LockAcquisitionFailed);
            }
        }
    }

    let result = async {
        let ledger_canister_id = match reserve_ledger_canister_id(params.asset.clone()) {
            Ok(principal) => principal,
            Err(e) => {
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

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

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let mut reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset");
                data
            }
            Err(e) => {
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

        if reserve_data.debt_index == Nat::from(0u128) {
            reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
        }

        // Fetches the reserve logic cache having the current values
        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Updates the liquidity and borrow index
        if let Err(e) = reserve::update_state(&mut reserve_data, &mut reserve_cache) {
            ic_cdk::println!("Failed to update reserve state: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Reserve state updated successfully");

        // Validates repay using the reserve_data
        if let Err(e) = ValidationLogic::validate_repay(
            &reserve_data,
            params.amount.clone(),
            user_principal,
            liquidator_principal,
            ledger_canister_id,
        )
        .await
        {
            ic_cdk::println!("Repay validation failed: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Repay validated successfully");

        if let Err(e) = update_token_price(params.asset.clone()).await {
            ic_cdk::println!("Failed to update token price: {:?}", e);
        }

        ic_cdk::println!("Asset borrow: {:?}", reserve_data.asset_borrow);

        let adjusted_amount = if params.amount.clone() % reserve_cache.next_debt_index.clone()
            != Nat::from(0u128)
            && params.amount.clone() < Nat::from(10u128)
        {
            ic_cdk::println!("Rounding up due to remainder and amount < 10");
            params
                .amount
                .clone()
                .scaled_div(reserve_cache.next_debt_index.clone())
                + Nat::from(1u128)
        } else {
            ic_cdk::println!("No rounding required");
            params
                .amount
                .clone()
                .scaled_div(reserve_cache.next_debt_index.clone())
        };

        // ----------- Update logic here -------------
        if let Err(e) = UpdateLogic::update_user_data_repay(
            user_principal,
            &reserve_cache,
            params.clone(),
            &mut reserve_data,
        )
        .await
        {
            ic_cdk::println!("Failed to update user data: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            if let Err(e) = repay_release_amount(&params.asset, &adjusted_amount) {
                ic_cdk::println!("Failed to release amount lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("User data updated successfully");
        reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
        ic_cdk::println!("Current debt: {:?}", reserve_cache.curr_debt);
        if let Err(e) = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            Nat::from(0u128),
            params.amount.clone(),
        )
        .await
        {
            ic_cdk::println!("Failed to update interest rates: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }

        // if let Err(e) = repay_release_amount(&params.asset, &adjusted_amount) {
        //     ic_cdk::println!("Failed to release amount lock: {:?}", e);
        // }

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
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
                Ok(new_balance)
            }
            Err(e) => {
                ic_cdk::println!("inside the error");
                //Rollback user state
                let borrow_param = ExecuteBorrowParams {
                    asset: params.asset.clone(),
                    amount: params.amount,
                };
                if let Err(e) = UpdateLogic::update_user_data_borrow(
                    user_principal,
                    &reserve_cache,
                    borrow_param,
                    &mut reserve_data,
                )
                .await
                {
                    ic_cdk::println!("Failed to rollback user state: {:?}", e);
                    if let Err(e) = release_lock(&operation_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    return Err(Error::ErrorRollBack);
                };
                mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
                });
                ic_cdk::println!("Asset transfer failed, error: {:?}", e);
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(Error::ErrorBurnDebtTokens);
            }
        }
    }
    .await;

    // Release the lock
    if let Err(e) = release_lock(&operation_key) {
        ic_cdk::println!("Failed to release lock: {:?}", e);
        return Err(e);
    }

    result
}
