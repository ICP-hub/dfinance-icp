use crate::{
    api::{functions::asset_transfer, state_handler::mutate_state},
    constants::asset_address::BACKEND_CANISTER,
    declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams},
    protocol::libraries::logic::update::UpdateLogic,
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
    ) -> Result<Nat, String> {
        // Reads the reserve data from the asset
        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&collateral_asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| {
                    format!(
                        "Reserve not found for asset: {}",
                        collateral_asset.to_string()
                    )
                })
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

    let dtoken_canister = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&collateral_asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.d_token_canister.clone()) // Retrieve d_token_canister
            .ok_or_else(|| format!("No d_token_canister found for asset: {}", collateral_asset))
    })?;

    let dtoken_canister_principal = Principal::from_text(dtoken_canister)
        .map_err(|_| "Invalid dtoken canister ID".to_string())?;

    let platform_principal = ic_cdk::api::id();
        // .map_err(|_| "Invalid platform canister ID".to_string())?;

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

    let bonus = (amount as f64 * (5f64 / 100f64)).round() as u64; // reserve_data.configuration.liquidation_penalty
    let reward_amount = Nat::from(amount) + Nat::from(bonus);

    let reward_amount_param = amount + bonus as u128;

    let supply_param = ExecuteSupplyParams {
        asset: collateral_asset.to_string(),
        amount: reward_amount_param,
        is_collateral: true,
    };

    let withdraw_param = ExecuteWithdrawParams {
        asset: collateral_asset.to_string(),
        is_collateral: true,
        on_behalf_of: None,
        amount: reward_amount_param,
    };

    // Burning dtoken
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

    // Minting dtoken
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
            let _ =
                UpdateLogic::update_user_data_withdraw(user_principal, withdraw_param).await;
            let _ =
                UpdateLogic::update_user_data_supply(liquidator_principal, supply_param).await;
            Ok(balance)
        }
        Err(err) => {
            asset_transfer(
                user_principal,
                dtoken_canister_principal,
                platform_principal,
                reward_amount.clone(),
            )
            .await?;
            return Err(format!(
                "Mint to liquidator failed, minted dtoken to user. Error: {:?}",
                err
            ));
        }
    }
}
}