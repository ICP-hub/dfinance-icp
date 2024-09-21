use crate::{
    api::{functions::asset_transfer, state_handler::mutate_state},
    constants::asset_address::BACKEND_CANISTER,
    repay,
};
use candid::{Nat, Principal};
use ic_cdk::api;

pub struct LiquidationLogic;

impl LiquidationLogic {
    pub async fn execute_liquidation(
        asset_name: String,
        collateral_asset: String,
        amount: u128,
        on_behalf_of: String,
    ) -> Result<(), String> {
        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&asset_name.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| format!("No canister ID found for asset: {}", asset_name))
        })?;

        let dtoken_canister = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&collateral_asset.to_string().clone())
                .and_then(|reserve_data| reserve_data.d_token_canister.clone()) // Retrieve d_token_canister
                .ok_or_else(|| format!("No d_token_canister found for asset: {}", collateral_asset))
        })?;

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let platform_principal = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let user_principal = Principal::from_text(on_behalf_of)
            .map_err(|_| "Invalid user canister ID".to_string())?;
        ic_cdk::println!("User Principal (Debt User): {}", user_principal);

        let liquidator_principal = api::caller();
        ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

        ic_cdk::println!("Checking balances before liquidation...");

        let asset = asset_name.clone();

        // Repaying debt
        let repay_response = repay(asset.clone(), amount, Some(user_principal.to_string())).await;

        match repay_response {
            Ok(_) => ic_cdk::println!("Repayment successful"),
            Err(e) => ic_cdk::trap(&format!("Repayment failed: {}", e)),
        }

         let reward_amount = Nat::from(amount) + Nat::from(10u64);

        // Burn dtoken
        match asset_transfer(
            platform_principal,
            dtoken_canister_principal,
            user_principal,
            reward_amount.clone(),
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

         // Mint dtoken
         match asset_transfer(
            liquidator_principal,
            dtoken_canister_principal,
            platform_principal,
            reward_amount.clone(),
        )
        .await
        {
            Ok(balance) => {
                ic_cdk::println!(
                    "Dtoken Asset transfer from backend to liquidator executed successfully"
                );
                balance
            }
            Err(err) => {
                asset_transfer(
                    platform_principal,
                    dtoken_canister_principal,
                    user_principal,
                    reward_amount.clone(),
                )
                .await?;
                return Err(format!("Mint failed, min. Error: {:?}", err));
            }
        };

        // Withdrawing the reward
        // let reward_amount = amount + 10;
        // let reward_response = withdraw(
        //     collateral_asset.clone(),
        //     reward_amount,
        //     Some(user_principal.to_string()),
        //     true,
        // )
        // .await;
        // match reward_response {
        //     Ok(_) => ic_cdk::println!("Withdraw successful"),
        //     Err(e) => ic_cdk::trap(&format!("Withdraw failed: {}", e)),
        // }

        Ok(())
    }
}
