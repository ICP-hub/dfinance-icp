use candid::{Nat, Principal};
use ic_cdk::call;
pub struct SupplyLogic;
use crate::api::state_handler::mutate_state;
use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::declarations::asset_price::get_exchange_rate;
use crate::protocol::libraries::math::calculate::{UserPosition, calculate_health_factor, calculate_ltv};
use crate::{
    api::functions::{asset_transfer, asset_transfer_from},
    constants::asset_address::{
        BACKEND_CANISTER, CKBTC_LEDGER_CANISTER, CKETH_LEDGER_CANISTER, DEBTTOKEN_CANISTER,
        DTOKEN_CANISTER,
    },
};

impl SupplyLogic {
    // update function
    async fn update_user_data(
        user_principal: Principal,
        params: ExecuteSupplyParams,
    ) -> Result<(), String> {
        // Fetchs user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };
        user_data.total_collateral = Some(
            user_data.total_collateral.unwrap_or(0.0) + amount_in_usd
        );
        ic_cdk::println!(
            "Converted ckBTC amount: {} to ICP amount: {} with rate: {}",
            params.amount, amount_in_usd, ckbtc_to_usd_rate
        );
        user_data.net_worth = Some(
            user_data.net_worth.unwrap_or(0.0) + amount_in_usd
        );

        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0.0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0.0), // Assuming total_debt is stored in user_data
            liquidation_threshold: 0.8, // Set to the desired liquidation threshold (80%)
        };
    
        
        let health_factor = calculate_health_factor(&user_position);
        user_data.health_factor = Some(health_factor); 
    
        ic_cdk::println!("Updated user health factor: {}", health_factor);

        let ltv= calculate_ltv(&user_position);
        user_data.ltv = Some(ltv);

    
        // Checks if the reserve data for the asset already exists in the user's reserves
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == params.asset),
            None => None,
        };

        if let Some((_, reserve_data)) = user_reserve {
            // If Reserve data exists, it will update asset supply
            reserve_data.asset_supply += params.amount as f64;
            ic_cdk::println!(
                "Updated asset supply for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // Reserve data does not exist, create a new one
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                asset_supply: params.amount as f64,
                ..Default::default()
            };

            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((params.asset.clone(), new_reserve));
            } else {
                user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
            }

            ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
        }

        // Save the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

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

        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

        let platform_principal = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let dtoken_canister_principal = Principal::from_text(DTOKEN_CANISTER)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

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
                return Err(format!("Minting failed, burned dtoken. Error: {:?}", err));
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
                let _ = SupplyLogic::update_user_data(user_principal, params).await;
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

    pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<(), String> {
        ic_cdk::println!("Starting execute_withdraw with params: {:?}", params);

        let (user_principal, liquidator_principal) = if let Some(on_behalf_of) = params.on_behalf_of
        {
            let user_principal = Principal::from_text(on_behalf_of)
                .map_err(|_| "Invalid user canister ID".to_string())?;
            let liquidator_principal = ic_cdk::caller();
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            (user_principal, None)
        };

        let ledger_canister_id = Principal::from_text(CKBTC_LEDGER_CANISTER)
            .map_err(|_| "Invalid ledger canister ID".to_string())?;

        let platform_principal = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let dtoken_canister_principal = Principal::from_text(DTOKEN_CANISTER)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

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

        // ---------- Update state() ----------

        // ---------- Validate withdraw() ----------

        let withdraw_amount = Nat::from(params.amount);

        // Determines the receiver principal
        let transfer_to_principal = if let Some(liquidator) = liquidator_principal {
            liquidator
        } else {
            user_principal
        };

        // Tranfers the withdraw amount from the pool to the user
        let args = TransferFromArgs {
            to: TransferAccount {
                owner: transfer_to_principal,
                subaccount: None,
            },
            fee: None,
            spender_subaccount: None,
            from: TransferAccount {
                owner: platform_principal,
                subaccount: None,
            },
            memo: None,
            created_at_time: None,
            amount: withdraw_amount.clone(),
        };
        let (result,): (TransferFromResult,) =
            call(ledger_canister_id, "icrc2_transfer_from", (args,))
                .await
                .map_err(|e| e.1)?;

        let _ = match result {
            TransferFromResult::Ok(balance) => Ok(()),
            TransferFromResult::Err(err) => Err(format!("{:?}", err)),
        };

        let dtoken_args = TransferArgs {
            to: TransferAccount {
                owner: platform_principal,
                subaccount: None,
            },
            fee: None,
            spender_subaccount: None,
            memo: None,
            created_at_time: None,
            amount: withdraw_amount.clone(),
        };

        let (new_result,): (TransferFromResult,) = call(
            dtoken_canister_principal,
            "icrc1_transfer",
            (dtoken_args, false, Some(user_principal)),
        )
        .await
        .map_err(|e| e.1)?;
        ic_cdk::println!("Dtoken call result : {:?}", new_result);
        ic_cdk::println!(
            "Dtoken Asset transfer from user to backend canister executed successfully"
        );

        // ---------- Update reserve data ----------

        // ---------- Update user data ----------
        // Fetchs user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };

        // Checks if the reserve data for the asset already exists in the user's reserves
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == params.asset),
            None => None,
        };

        // If the reserve exists, it will subtract the withdrawal amount from the asset supply
        if let Some((_, reserve_data)) = user_reserve {
            // Ensures the user has enough supply to withdraw
            if reserve_data.asset_supply >= params.amount as f64 {
                reserve_data.asset_supply -= params.amount as f64;
                ic_cdk::println!(
                    "Reduced asset supply for existing reserve: {:?}",
                    reserve_data
                );
            } else {
                ic_cdk::println!("Insufficient asset supply for withdrawal.");
                return Err(format!(
                    "Insufficient supply for withdrawal: requested {}, available {}",
                    params.amount, reserve_data.asset_supply
                ));
            }
        } else {
            // If Reserve data does not exist,it returns an error since we cannot withdraw what is not supplied
            ic_cdk::println!("Error: Reserve not found for asset: {:?}", params.asset);
            return Err(format!(
                "Cannot withdraw from a non-existing reserve for asset: {}",
                params.asset
            ));
        }

        // Saves the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);

        Ok(())
    }
}
