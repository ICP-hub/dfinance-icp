
use crate::api::functions::asset_transfer_from;
use crate::api::resource_manager::{acquire_lock, release_lock};
use crate::api::state_handler::mutate_state;
use crate::constants::errors::Error;
use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::update_token_price;
use crate::reserve_ledger_canister_id;
use candid::{Nat, Principal};
use ic_cdk::update;

/*
-------------------------------------
----------- SUPPLY LOGIC ------------
-------------------------------------
 */

/*
 * @title Execute Supply Function
 * @notice Allows users to supply assets to the platform, handling validation, state updates, and asset transfer.
 *         Ensures proper checks, updates, and error handling, including rollback if any step fails.
 *
 * @dev The function follows these steps:
 *      1. Validates input parameters (asset name, amount, and caller's identity).
 *      2. Acquires a lock to ensure only one operation per user at a time.
 *      3. Updates the reserve data and user profile state.
 *      4. Validates the supply request against platform rules (e.g., limits, reserves).
 *      5. Transfers the asset from the user to the platform.
 *      6. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the supply operation:
 *               - `asset`: The name of the asset being supplied.
 *               - `amount`: The amount of the asset being supplied.
 *               - `is_collateral`: Flag indicating if the asset is collateral.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, Error> {
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

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let operation_key = user_principal;
    // Acquire the lock
    {
        if let Err(e) = acquire_lock(&operation_key) {
            ic_cdk::println!("Lock acquisition failed: {:?}", e);
            return Err(Error::LockAcquisitionFailed);
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
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let amount_nat = params.amount.clone();

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let mut reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset = {:?}",data);
                data
            }
            Err(e) => {
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        if let Err(e) = reserve::update_state(&mut reserve_data, &mut reserve_cache) {
            ic_cdk::println!("Failed to update reserve state: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Reserve state updated successfully");

        // Validates supply using the reserve_data
        if let Err(e) = ValidationLogic::validate_supply(
            &reserve_data,
            params.amount.clone(),
            user_principal,
            ledger_canister_id,
        )
        .await
        {
            ic_cdk::println!("supply validation failed: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Supply validated successfully");

        if let Err(_) = update_token_price(params.asset.clone()).await {}

        let liq_added = params.amount.clone();
        let liq_taken = Nat::from(0u128);

        if let Err(e) = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            liq_taken,
            liq_added,
        )
        .await
        {
            ic_cdk::println!("Failed to update interest rates: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Interest rates updated successfully");

        if let Err(e) = UpdateLogic::update_user_data_supply(
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
            return Err(e);
        }
        ic_cdk::println!("User data supply updated");

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });

        // Transfers the asset from the user to our backend cansiter
        match asset_transfer_from(
            ledger_canister_id,
            user_principal,
            platform_principal,
            amount_nat.clone(),
        )
        .await
        {
            Ok(new_balance) => {
                println!("Asset transfer from user to backend canister executed successfully");
                Ok(new_balance)
            }
            Err(_) => {
                //Rollback user state
                let withdraw_param = ExecuteWithdrawParams {
                    asset: params.asset.clone(),
                    is_collateral: params.is_collateral,
                    on_behalf_of: None,
                    amount: params.amount.clone(),
                };
                if let Err(e) = UpdateLogic::update_user_data_withdraw(
                    user_principal,
                    &reserve_cache,
                    withdraw_param.clone(),
                    &mut reserve_data,
                )
                .await
                {
                    ic_cdk::println!("Failed to rollback user state: {:?}", e);
                    if let Err(e) = release_lock(&operation_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    return Err(e);
                }
                mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
                });
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(Error::ErrorMintTokens);
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

/*
-------------------------------------
---------- WITHDRAW LOGIC -----------
-------------------------------------
*/

/*
 * @title Execute Withdraw Function
 * @notice Allows users to withdraw assets from the platform, handling validation, state updates, and asset transfer.
 *         Ensures proper checks, updates, and error handling, including rollback if any step fails.
 *
 * @dev The function follows these steps:
 *      1. Validates input parameters (asset name, amount, and caller's identity).
 *      2. Acquires a lock to ensure only one operation per user at a time.
 *      3. Updates the reserve data and user profile state.
 *      4. Validates the withdrawal request against platform rules (e.g., limits, available assets).
 *      5. Transfers the requested asset from the platform to the user or liquidator.
 *      6. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the withdraw operation:
 *               - `asset`: The name of the asset being withdrawn.
 *               - `amount`: The amount of the asset being withdrawn.
 *               - `is_collateral`: Flag indicating if the asset is collateral.
 *               - `on_behalf_of`: Optional principal requesting the withdrawal on behalf of another user.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<Nat, Error> {
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
            if liquidator_principal != Principal::management_canister() {
                ic_cdk::println!("User is not allowed to perform such transaction");
                return Err(Error::InvalidPrincipal);
            }
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            (user_principal, None)
        };

    let operation_key = user_principal;
    // Acquire the lock
    {
        if let Err(e) = acquire_lock(&operation_key) {
            ic_cdk::println!("Lock acquisition failed: {:?}", e);
            return Err(Error::LockAcquisitionFailed);
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
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let withdraw_amount = Nat::from(params.amount.clone());
        ic_cdk::println!("Withdraw amount: {:?}", withdraw_amount);

        // Determines the receiver principal
        let transfer_to_principal = if let Some(liquidator) = liquidator_principal {
            ic_cdk::println!("Transferring to liquidator: {:?}", liquidator);
            liquidator
        } else {
            ic_cdk::println!("Transferring to user: {:?}", user_principal);
            user_principal
        };

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
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

        // Fetches the reserve logic cache having the current values
        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Updates the liquidity index
        if let Err(e) = reserve::update_state(&mut reserve_data, &mut reserve_cache) {
            ic_cdk::println!("Failed to update reserve state: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Reserve state updated successfully");

        if let Err(e) = ValidationLogic::validate_withdraw(
            &reserve_data,
            params.amount.clone(),
            user_principal,
            ledger_canister_id,
        )
        .await
        {
            ic_cdk::println!("Withdraw validation failed: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }
        ic_cdk::println!("Withdraw validated successfully");

        if let Err(e) = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            params.amount.clone(),
            Nat::from(0u128),
        )
        .await
        {
            ic_cdk::println!("Failed to update interest rates: {:?}", e);
            if let Err(e) = release_lock(&operation_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            return Err(e);
        }

        // ----------- Update logic here -------------
        if let Err(e) = UpdateLogic::update_user_data_withdraw(
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
            return Err(e);
        }

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });
        // Transfers the asset from the user to our backend cansiter
        match asset_transfer_from(
            ledger_canister_id,
            platform_principal,
            transfer_to_principal,
            withdraw_amount.clone(),
        )
        .await
        {
            Ok(new_balance) => {
                println!("Asset transfer from backend to user executed successfully");

                return Ok(new_balance);
            }
            Err(_) => {
                let supply_param = ExecuteSupplyParams {
                    asset: params.asset.clone(),
                    amount: params.amount.clone(),
                    is_collateral: params.is_collateral,
                };
                if let Err(e) = UpdateLogic::update_user_data_supply(
                    user_principal,
                    &reserve_cache,
                    supply_param,
                    &mut reserve_data,
                )
                .await
                {
                    ic_cdk::println!("Failed to update user data: {:?}", e);
                    if let Err(e) = release_lock(&operation_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    return Err(Error::ErrorRollBack);
                }

                mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
                });
                if let Err(e) = release_lock(&operation_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(Error::ErrorBurnTokens);
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
