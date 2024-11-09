use candid::{Nat, Principal};
pub struct SupplyLogic;
use crate::api::functions::{asset_transfer, asset_transfer_from};
use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;

use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::protocol::libraries::logic::reserve::{self, mint_scaled};
use crate::protocol::libraries::logic::update::UpdateLogic;
// use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::get_exchange_rates;

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
                .and_then(|reserve_data| reserve_data.d_token_canister.clone())
                .ok_or_else(|| format!("No d_token_canister found for asset: {}", params.asset))
        })?;

        
        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

        let platform_principal = ic_cdk::api::id();

        let amount_nat = Nat::from(params.amount);
        // Converting asset to usdt value
        let mut usd_amount = params.amount;

        let supply_amount_to_usd =
            get_exchange_rates(params.asset.clone(), None, params.amount.clone()).await;
        match supply_amount_to_usd {
            Ok((amount_in_usd, _timestamp)) => {
                usd_amount = amount_in_usd;
                ic_cdk::println!("Supply amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                ic_cdk::println!("Error getting exchange rate: {:?}", e);
            }
        }

        ic_cdk::println!("Supply amount in USD: {:?}", usd_amount);

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

        let total_supplies= (reserve_data.total_borrowed.clone() + usd_amount);
        let total_borrow = reserve_data.total_borrowed;
        let _= reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache,total_borrow ,total_supplies).await;


        ic_cdk::println!("Interest rates updated successfully");

        if let Some(userlist) = &mut reserve_data.userlist {
            if !userlist
                .iter()
                .any(|(principal, _)| principal == &user_principal.to_string())
            {
                userlist.push((user_principal.to_string(), true));
            }
        } else {
            reserve_data.userlist = Some(vec![(user_principal.to_string(), true)]);
        }

        ic_cdk::println!("user list of reserve {:?}", reserve_data.userlist.clone());

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });

        // ----------- Update logic here -------------
        let _ = UpdateLogic::update_user_data_supply(
            user_principal,
            &reserve_cache,
            params.clone(),
            &reserve_data,
            usd_amount.clone(),
        )
        .await;

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

        let platform_principal = ic_cdk::api::id();

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let withdraw_amount = Nat::from(params.amount);

        // Converting asset value to usdt
        let mut usd_amount = params.amount;
        let withdraw_amount_to_usd =
            get_exchange_rates(params.asset.clone(), None, params.amount).await;
        match withdraw_amount_to_usd {
            Ok((amount_in_usd, _timestamp)) => {
                // Extracted the amount in USD
                usd_amount = amount_in_usd;
                ic_cdk::println!("Withdraw amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                ic_cdk::println!("Error getting exchange rate: {:?}", e);
            }
        }

        ic_cdk::println!("Withdraw amount in USD: {:?}", usd_amount);

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

        // Validates withdraw using the reserve_data
        ValidationLogic::validate_withdraw(
            &reserve_data,
            params.amount,
            user_principal,
            ledger_canister_id,
        )
        .await;
        ic_cdk::println!("Withdraw validated successfully");

        let total_supplies= (reserve_data.total_supply as i128 - usd_amount as i128).max(0) as u128;
        let total_borrow = reserve_data.total_borrowed;
        let _= reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache,total_borrow ,total_supplies).await;

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });

        // ----------- Update logic here -------------
        let _ = UpdateLogic::update_user_data_withdraw(
            user_principal,
            &reserve_cache,
            params,
            &reserve_data,
            usd_amount.clone(),
        )
        .await;

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
                return Err(format!(
                    "Asset transfer failed, minted dtoken. Error: {:?}",
                    e
                ));
            }
        }
    }
}
