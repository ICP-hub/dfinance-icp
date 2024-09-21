use candid::{Nat, Principal};
pub struct SupplyLogic;
use crate::api::state_handler::mutate_state;
use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::{
    api::functions::{asset_transfer, asset_transfer_from},
    constants::asset_address::BACKEND_CANISTER,
};

impl SupplyLogic {
    // -------------------------------------
    // ----------- SUPPLY LOGIC ------------
    // -------------------------------------

    pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
        ic_cdk::println!("Starting execute_supply with params: {:?}", params);

        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&params.asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
        })?;
        let dtoken_canister = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .and_then(|reserve_data| reserve_data.d_token_canister.clone()) // Retrieve d_token_canister
                .ok_or_else(|| format!("No d_token_canister found for asset: {}", params.asset))
        })?;

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;
        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

        let platform_principal = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let amount_nat = Nat::from(params.amount);

        ic_cdk::println!("Canister ids, principal and amount successfully");

        // Reads the reserve data from the asset
        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        });

        let mut reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };

        // Fetches the reserve logic cache having the current values
        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Updates the liquidity index
        reserve::update_state(&mut reserve_data, &mut reserve_cache);
        ic_cdk::println!("Reserve state updated successfully");

        // Validates supply using the reserve_data
        ValidationLogic::validate_supply(
            &reserve_data,
            params.amount,
            user_principal,
            ledger_canister_id,
        )
        .await;
        ic_cdk::println!("Supply validated successfully");

        // Minting dtoken
        match asset_transfer(
            user_principal,
            dtoken_canister_principal,
            platform_principal,
            amount_nat.clone(),
        )
        .await
        {
            Ok(balance) => {
                ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
                balance
            }
            Err(err) => {
                return Err(format!("Minting failed. Error: {:?}", err));
            }
        };

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
                // ----------- Update logic here -------------
                let _ = UpdateLogic::update_user_data_supply(user_principal, params).await;
                Ok(new_balance)
            }
            Err(e) => {
                // Burning dtoken
                asset_transfer(
                    platform_principal,
                    dtoken_canister_principal,
                    user_principal,
                    amount_nat.clone(),
                )
                .await?;
                return Err(format!(
                    "Asset transfer failed, burned dtoken. Error: {:?}",
                    e
                ));
            }
        }
    }

    // -------------------------------------
    // ---------- WITHDRAW LOGIC -----------
    // -------------------------------------

    pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<Nat, String> {
        ic_cdk::println!("Starting execute_withdraw with params: {:?}", params);

        let (user_principal, liquidator_principal) =
            if let Some(on_behalf_of) = params.on_behalf_of.clone() {
                let user_principal = Principal::from_text(on_behalf_of)
                    .map_err(|_| "Invalid user canister ID".to_string())?;
                let liquidator_principal = ic_cdk::caller();
                (user_principal, Some(liquidator_principal))
            } else {
                let user_principal = ic_cdk::caller();
                (user_principal, None)
            };

        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&params.asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
        })?;
        let dtoken_canister = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .and_then(|reserve_data| reserve_data.d_token_canister.clone()) // Retrieve d_token_canister
                .ok_or_else(|| format!("No d_token_canister found for asset: {}", params.asset))
        })?;

        let platform_principal = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let withdraw_amount = Nat::from(params.amount);

        // Determines the receiver principal
        let transfer_to_principal = if let Some(liquidator) = liquidator_principal {
            liquidator
        } else {
            user_principal
        };

        // Reads the reserve data from the asset
        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        });

        let mut reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };

        // Fetches the reserve logic cache having the current values
        let mut reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Updates the liquidity index
        reserve::update_state(&mut reserve_data, &mut reserve_cache);
        ic_cdk::println!("Reserve state updated successfully");

        // Validates supply using the reserve_data
        ValidationLogic::validate_withdraw(
            &reserve_data,
            params.amount,
            user_principal,
            ledger_canister_id,
        )
        .await;
        ic_cdk::println!("Withdraw validated successfully");

        // Burn dtoken
        match asset_transfer(
            platform_principal,
            dtoken_canister_principal,
            user_principal,
            withdraw_amount.clone(),
        )
        .await
        {
            Ok(balance) => {
                ic_cdk::println!(
                    "Dtoken Asset transfer from user to backend canister executed successfully"
                );
                balance
            }
            Err(err) => {
                return Err(format!("Burn failed. Error: {:?}", err));
            }
        };

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
                // ----------- Update logic here -------------
                let _ = UpdateLogic::update_user_data_withdraw(user_principal, params).await;
                Ok(new_balance)
            }
            Err(e) => {
                // Minted dtoken
                asset_transfer(
                    user_principal,
                    dtoken_canister_principal,
                    platform_principal,
                    withdraw_amount.clone(),
                )
                .await?;
                return Err(format!(
                    "Asset transfer failed, minted dtoken. Error: {:?}",
                    e
                ));
            }
        }
    }
}