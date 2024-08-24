use crate::api::state_handler::mutate_state;
use crate::declarations::assets::ExecuteSupplyParams;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::types::datatypes::UserData;
use crate::{
    api::deposit::asset_transfer_from,
    constants::asset_address::{BACKEND_CANISTER, CKBTC_LEDGER_CANISTER, DTOKEN_CANISTER},
};
use candid::{Nat, Principal};
use ic_cdk::call;
pub struct SupplyLogic;
use crate::declarations::transfer::*;
impl SupplyLogic {
    pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
        ic_cdk::println!("Starting execute_supply with params: {:?}", params);
        
        let canister_id_ckbtc_ledger = "c2lt4-zmaaa-aaaaa-qaaiq-cai".to_string();
        
        // let dtoken_canister_id="c5kvi-uuaaa-aaaaa-qaaia-cai".to_string();
    ic_cdk::println!("Canister IDs fetched successfully");
    
      
        let ledger_canister_id =
            Principal::from_text(canister_id_ckbtc_ledger).map_err(|_| "Invalid ledger canister ID".to_string())?;
        // let user_principal = caller();
        let user_principal=Principal::from_text("i5hok-bgbg2-vmnlz-qa4ur-wm6z3-ha5xl-c3tut-i7oxy-6ayyw-2zvma-lqe".to_string()).map_err(|_| "Invalid user canister ID".to_string())?;
       
        let platform_principal=Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai".to_string()).map_err(|_| "Invalid platform canister ID".to_string())?;
        
        let dtoken_canister_principal= Principal::from_text("c5kvi-uuaaa-aaaaa-qaaia-cai".to_string()).map_err(|_| "Invalid dtoken canister ID".to_string())?;

       

        let amount_nat = Nat::from(params.amount);

        ic_cdk::println!("Principals and amount_nat prepared successfully");

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
            ledger_canister_principal,
            params.on_behalf_of,
            platform_principal,
            amount_nat.clone(),
        )
        .await
        .map_err(|e| format!("Asset transfer failed: {:?}", e))?;

        ic_cdk::println!("Asset transfer from user to backend canister executed successfully");

        let initial_user_data = UserData {
            net_worth: None,
            net_apy: None,
            health_factor: None,
            supply: None,
            borrow: None,
            // total_collateral: 0.0,
            // total_debt: 0.0,
            // available_borrow: 0.0,
            // ltv: 0.0,
            // current_liquidation_threshold: 80.0, 
        };

        mutate_state(|state| {
            let ini_user = &mut state.user_profile;
            ini_user.insert(params.on_behalf_of, Candid(initial_user_data));
            ic_cdk::println!("User added successfully");
        });

        let user_data = mutate_state(|state| {
            let data = &mut state.user_profile;
            data.get(&params.on_behalf_of)
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("User not found"))
        });

        let mut user_prof = match user_data {
            Ok(data) => {
                ic_cdk::println!("User data found");
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };

        user_prof.net_apy = Some(8.25);
        //      let asset_name = &params.asset;
        // let amount = params.amount;

        // if let Some(ref mut supply) = user_prof.supply {
        //     // Check if the asset is already present in the supply vector
        //     let mut asset_found = false;

        //     for (asset, existing_amount) in supply.iter_mut() {
        //         if asset == asset_name.clone() {
        //             // Update the existing amount by adding the new supply amount
        //             *existing_amount += amount;
        //             asset_found = true;
        //             break;
        //         }
        //     }

        //     if !asset_found {
        //         // Add the new asset with the supplied amount
        //         supply.push((asset_name.clone(), amount));
        //     }
        // } else {
        //     // Initialize the supply vector with the new asset and amount
        //     user_prof.supply = Some(vec![(asset_name.clone(), amount)]);
        // }

        mutate_state(|state| {
            let user_dt = &mut state.user_profile;
            user_dt.insert(params.on_behalf_of, Candid(user_prof.clone()));
        });

        ic_cdk::println!("User data: {:?}", user_prof);
        // let (balance,): (Nat,) = call(dtoken_canister_principal, "icrc1_balance_of", (user_principal,))
        //     .await
        //     .map_err(|e| e.1)?;
        
        // ic_cdk::println!("User balance: {}", balance);
        
        // if balance < params.amount {
        //     return Err("Insufficient funds for Dtoken transfer".to_string());
        // }
        
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

        let (new_result,): (TransferFromResult,) =
            call(dtoken_canister_principal, "icrc1_transfer", (dtoken_args, false))
                .await
                .map_err(|e| e.1)?;

        match new_result {
            TransferFromResult::Ok(new_balance) => {
                ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
                Ok(new_balance)
            }
            TransferFromResult::Err(err) => Err(format!("{:?}", err)),
        }
        // Ok(amount_nat)
    }
}
