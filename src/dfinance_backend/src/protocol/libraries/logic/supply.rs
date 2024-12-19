use candid::{Nat, Principal};
use ic_cdk::update;
pub struct SupplyLogic;
use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;

use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::{get_exchange_rates, update_reserves_price};

// impl SupplyLogic {
// -------------------------------------
// ----------- SUPPLY LOGIC ------------
// -------------------------------------

    pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
        ic_cdk::println!("Starting execute_supply with params: {:?}", params);
        //TODO fetch from function in read state
        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&params.asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
        })?;

        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

    // Fetch the platform principal
    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let amount_nat = Nat::from(params.amount);

        //TODO create a comman func to get asset reserve data in mutate state
        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        });

    let mut reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset");
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {}", e);
            return Err(e);
        }
    };

    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

        // Validates supply using the reserve_data
        //TODO replace the validation code from backend three
        //TODO error handling
        ValidationLogic::validate_supply(
            &reserve_data,
            params.amount,
            user_principal,
            ledger_canister_id,
        )
        .await;
        ic_cdk::println!("Supply validated successfully");
        
        //TODO call mint function here

        let liq_added = params.amount;
        let liq_taken = 0u128;
        let _ = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            liq_taken,
            liq_added,
        )
        .await;
    
       

    ic_cdk::println!("Interest rates updated successfully");

        let _ = UpdateLogic::update_user_data_supply(
            user_principal,
            &reserve_cache,
            params.clone(),
            &mut reserve_data,
        )
        .await;
        ic_cdk::println!("User data supply updated");

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });

        //TODO update pricecache

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
            Err(e) => {
                //TODO add burn function here
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
        ic_cdk::println!("Starting execute_withdraw with params: {:?}", params.clone());

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
        //TODO in readable form
        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&params.asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
        })?;

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

    // Validates withdraw using the reserve_data
    let _ = ValidationLogic::validate_withdraw(
        &reserve_data,
        params.amount.clone(),
        //usd_amount,
        user_principal,
        ledger_canister_id,
    )
    .await;
    ic_cdk::println!("Withdraw validated successfully");

        let _ = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            params.amount,
            0u128,
        )
        .await;
       
      

        // ----------- Update logic here -------------
        let _ = UpdateLogic::update_user_data_withdraw(
            user_principal,
            &reserve_cache,
            params.clone(),
            &mut reserve_data,
        )
        .await;

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

                Ok(new_balance)
            }
            Err(e) => {
                //TODO mint the dtoken back to user
                return Err(format!(
                    "Asset transfer failed, minted dtoken. Error: {:?}",
                    e
                ));
            }
        }
    }
}
//}
