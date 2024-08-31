use candid::{Nat, Principal};
use ic_cdk::call;
pub struct SupplyLogic;
use crate::api::state_handler::mutate_state;
use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::{
    api::deposit::asset_transfer_from,
    constants::asset_address::{BACKEND_CANISTER, CKBTC_LEDGER_CANISTER, CKETH_LEDGER_CANISTER, DTOKEN_CANISTER},
};

impl SupplyLogic {
    // -------------------------------------
    // ----------- SUPPLY LOGIC ------------
    // -------------------------------------

    pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
        ic_cdk::println!("Starting execute_supply with params: {:?}", params);

        // Fetchs the canister ids, principal and amount
        let ledger_canister_id = Principal::from_text(CKBTC_LEDGER_CANISTER)
            .map_err(|_| "Invalid ledger canister ID".to_string())?;

        let user_principal = Principal::from_text(params.on_behalf_of)
            .map_err(|_| "Invalid user canister ID".to_string())?;

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

        // Updates the liquidity and borrow index
        reserve::update_state(&mut reserve_data, &mut reserve_cache);
        ic_cdk::println!("Reserve state updated successfully");

        // Validates supply using the reserve_data
        ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount).await;
        ic_cdk::println!("Supply validated successfully");

        // Updates inetrest rates with the assets and the amount
        reserve::update_interest_rates(
            &mut reserve_data,
            &reserve_cache,
            params.asset,
            params.amount,
            0,
        )
        .await;
        ic_cdk::println!("Interest rates updated successfully");

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert("ckbtc".to_string(), Candid(reserve_data.clone()));
        });

        // Transfers the asset from the user to our backend cansiter
        asset_transfer_from(
            ledger_canister_id,
            user_principal,
            platform_principal,
            amount_nat.clone(),
        )
        .await
        .map_err(|e| format!("Asset transfer failed: {:?}", e))?;

        ic_cdk::println!("Asset transfer from user to backend canister executed successfully");

        // Transfers dtoken from pool to the user principal
        let dtoken_args = TransferArgs {
            to: TransferAccount {
                owner: user_principal,
                subaccount: None,
            },
            fee: None,
            spender_subaccount: None,
            memo: None,
            created_at_time: None,
            amount: amount_nat,
        };

        let (new_result,): (TransferFromResult,) = call(
            dtoken_canister_principal,
            "icrc1_transfer",
            (dtoken_args, false),
        )
        .await
        .map_err(|e| e.1)?;

        match new_result {
            TransferFromResult::Ok(new_balance) => {
                ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
                Ok(new_balance)
            }
            TransferFromResult::Err(err) => Err(format!("{:?}", err)),
        }

        // ----------- User updation logic here -------------
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
            // let liquidator_principal = ic_cdk::caller();
            let liquidator_principal = Principal::from_text("37nia-rv3ep-e4hzo-5vtfx-3zrxb-kwfhi-m27sj-wsvci-d2qyt-3dbs3-mqe".to_string()).map_err(|_| "Invalid liquidator id".to_string())?;
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

        match result {
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
            (dtoken_args, false),
        )
        .await
        .map_err(|e| e.1)?;
        ic_cdk::println!("Dtoken call result : {:?}", new_result);
        ic_cdk::println!("Dtoken Asset transfer from user to backend canister executed successfully");

        // ---------- Update reserve data ----------

        // ---------- Update user data ----------

        Ok(())
    }
}
