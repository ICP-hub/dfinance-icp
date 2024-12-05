use candid::{Nat, Principal};
pub struct SupplyLogic;
use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;

use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::{get_exchange_rates, update_reserves_price};

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

        let user_principal = ic_cdk::caller();
        ic_cdk::println!("User principal: {:?}", user_principal.to_string());

        let platform_principal = ic_cdk::api::id();

        let amount_nat = Nat::from(params.amount);
        // Converting asset to usdt value
        let mut usd_amount = params.amount;

        update_reserves_price().await;
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

        let total_supplies = reserve_data.asset_supply.clone() + params.amount; //TODO not sure should store usd value or token amount
        let total_borrow = reserve_data.asset_borrow;
        let _ = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            total_borrow,
            total_supplies,
        )
        .await;
        reserve_data.total_supply += usd_amount;

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
                ic_cdk::println!("Processing withdrawal on behalf of: {}", on_behalf_of);
                let user_principal = Principal::from_text(on_behalf_of)
                    .map_err(|_| "Invalid user canister ID".to_string())?;
                let liquidator_principal = ic_cdk::caller();
                ic_cdk::println!("User principal: {:?}", user_principal);
                ic_cdk::println!("Liquidator principal: {:?}", liquidator_principal);
                (user_principal, Some(liquidator_principal))
            } else {
                let user_principal = ic_cdk::caller();
                ic_cdk::println!(
                    "No liquidator, using caller as user principal: {:?}",
                    user_principal
                );
                (user_principal, None)
            };

        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&params.asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
        })?;
        ic_cdk::println!("Ledger canister ID: {:?}", ledger_canister_id);

        let platform_principal = ic_cdk::api::id();
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let withdraw_amount = Nat::from(params.amount);
        ic_cdk::println!("Withdraw amount: {:?}", withdraw_amount);

        update_reserves_price().await;
        // Converting asset value to USD
        let mut usd_amount = params.amount;
        let withdraw_amount_to_usd =
            get_exchange_rates(params.asset.clone(), None, params.amount).await;
        match withdraw_amount_to_usd {
            Ok((amount_in_usd, _timestamp)) => {
                usd_amount = amount_in_usd;
                ic_cdk::println!("Withdraw amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                ic_cdk::println!("Error getting exchange rate: {:?}", e);
            }
        }

        ic_cdk::println!("Final Withdraw amount in USD: {:?}", usd_amount);

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
        ValidationLogic::validate_withdraw(
            &reserve_data,
            params.amount,
            usd_amount,
            user_principal,
            ledger_canister_id,
        )
        .await;
        ic_cdk::println!("Withdraw validated successfully");

        // Ask: if we subtract the upcoming amount, it will go into the -.
        let total_supplies = reserve_data.asset_supply - params.amount;
        let total_borrow = reserve_data.asset_borrow;
        ic_cdk::println!("Total supplies after withdraw: {:?}", total_supplies);
        ic_cdk::println!("Total borrow amount: {:?}", total_borrow);

        let _ = reserve::update_interest_rates(
            &mut reserve_data,
            &mut reserve_cache,
            total_borrow,
            total_supplies,
        )
        .await;
        ic_cdk::println!("Interest rates updated successfully");

        reserve_data.total_supply =
            (reserve_data.total_supply as i128 - usd_amount as i128).max(0) as u128;
        ic_cdk::println!(
            "Updated reserve total supply: {:?}",
            reserve_data.total_supply
        );

        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
        });
        ic_cdk::println!("Reserve data saved back to state");

        // Update logic
        let _ = UpdateLogic::update_user_data_withdraw(
            user_principal,
            &reserve_cache,
            params,
            &reserve_data,
            usd_amount.clone(),
        )
        .await;
        ic_cdk::println!("User data updated after withdrawal");

        // Transfers the asset from the user to our backend canister
        match asset_transfer_from(
            ledger_canister_id,
            platform_principal,
            transfer_to_principal,
            withdraw_amount.clone(),
        )
        .await
        {
            Ok(new_balance) => {
                ic_cdk::println!("Asset transfer from backend to user executed successfully");
                Ok(new_balance)
            }
            Err(e) => {
                ic_cdk::println!("Error during asset transfer: {:?}", e);
                Err(format!(
                    "Asset transfer failed, minted dtoken. Error: {:?}",
                    e
                ))
            }
        }
    }
}
