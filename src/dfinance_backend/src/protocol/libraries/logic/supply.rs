use candid::{Nat, Principal};
pub struct SupplyLogic;
use crate::api::functions::{asset_transfer, asset_transfer_from};
use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;

use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::update::UpdateLogic;
// use crate::protocol::libraries::logic::validation::ValidationLogic;
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

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;
        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

        let platform_principal = ic_cdk::api::id();

        let amount_nat = Nat::from(params.amount);
        // Converting asset to usdt value
        let mut usd_amount = params.amount as f64;

        let supply_amount_to_usd =
            get_exchange_rates(params.asset.clone(), params.amount as f64).await;
        match supply_amount_to_usd {
            Ok((amount_in_usd, _timestamp)) => {
                // Extracted the amount in USD
                usd_amount = amount_in_usd;
                ic_cdk::println!("Supply amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                // Handling the error
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
        // ValidationLogic::validate_supply(
        //     &reserve_data,
        //     params.amount,
        //     user_principal,
        //     ledger_canister_id,
        // )
        // .await;
        // ic_cdk::println!("Supply validated successfully");

        let liquidity_taken=0f64;
        let _= reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache,usd_amount , liquidity_taken).await;
               

        ic_cdk::println!("Interest rates updated successfully");
        
        mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });
        

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
                let _ = UpdateLogic::update_user_data_supply(user_principal, params, &reserve_data).await;
                
        
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

        let platform_principal = ic_cdk::api::id();

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let withdraw_amount = Nat::from(params.amount);

        // Converting asset value to usdt
        let mut usd_amount = params.amount as f64;
        let withdraw_amount_to_usd =
            get_exchange_rates(params.asset.clone(), params.amount as f64).await;
        match withdraw_amount_to_usd {
            Ok((amount_in_usd, _timestamp)) => {
                // Extracted the amount in USD
                usd_amount = amount_in_usd;
                ic_cdk::println!("Withdraw amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                // Handling the error
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

        // Validates supply using the reserve_data
        // ValidationLogic::validate_withdraw(
        //     &reserve_data,
        //     params.amount,
        //     user_principal,
        //     ledger_canister_id,
        // )
        // .await;
        // ic_cdk::println!("Withdraw validated successfully");

        reserve_data.total_supply-=usd_amount;

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });


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
