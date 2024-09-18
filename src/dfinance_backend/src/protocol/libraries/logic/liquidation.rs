use candid::Principal;

use crate::{
    api::functions::get_balance,
    constants::asset_address::{
        BACKEND_CANISTER, CKBTC_LEDGER_CANISTER, CKETH_LEDGER_CANISTER, DEBTTOKEN_CANISTER,
        DTOKEN_CANISTER,
    },
};
use crate::{repay, withdraw};
use ic_cdk::api;

pub struct LiquidationLogic;

impl LiquidationLogic {
    pub async fn execute_liquidation(
        asset_name: String,
        amount: u128,
        on_behalf_of: String,
    ) -> Result<(), String> {
        let ckbtc_canister = Principal::from_text(CKBTC_LEDGER_CANISTER)
            .map_err(|_| "Invalid ledger canister ID".to_string())?;

        let backend_canister = Principal::from_text(BACKEND_CANISTER)
            .map_err(|_| "Invalid platform canister ID".to_string())?;

        let dtoken_canister = Principal::from_text(DTOKEN_CANISTER)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let debt_canister = Principal::from_text(DEBTTOKEN_CANISTER)
            .map_err(|_| "Invalid debttoken canister ID".to_string())?;

        let user_principal = Principal::from_text(on_behalf_of)
            .map_err(|_| "Invalid user canister ID".to_string())?;
        ic_cdk::println!("User Principal (Debt User): {}", user_principal);

        let liquidator_principal = api::caller();
        ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

        let backend_canister_principal = backend_canister;
        ic_cdk::println!("Backend Canister Principal: {}", backend_canister_principal);

        ic_cdk::println!("Checking balances before liquidation...");

        let user_balance = get_balance(ckbtc_canister, user_principal).await;
        let liquidator_balance = get_balance(ckbtc_canister, liquidator_principal).await;
        let backend_balance = get_balance(ckbtc_canister, backend_canister_principal).await;
        let user_debt_token_balance = get_balance(debt_canister, user_principal).await;

        ic_cdk::println!("User Balance: {}", user_balance);
        ic_cdk::println!("Liquidator Balance: {}", liquidator_balance);
        ic_cdk::println!("Backend Canister Balance: {}", backend_balance);
        ic_cdk::println!("User Debt Token Balance: {}", user_debt_token_balance);

        let asset = asset_name.clone();

        let repay_response = repay(asset.clone(), amount, Some(user_principal.to_string())).await;

        match repay_response {
            Ok(_) => ic_cdk::println!("Repayment successful"),
            Err(e) => ic_cdk::trap(&format!("Repayment failed: {}", e)),
        }
        let user_balance_after = get_balance(ckbtc_canister, user_principal).await;
        let liquidator_balance_after = get_balance(ckbtc_canister, liquidator_principal).await;
        let backend_balance_after = get_balance(ckbtc_canister, backend_canister_principal).await;
        let user_debt_token_balance_after = get_balance(debt_canister, user_principal).await;
        ic_cdk::println!("User Balance after repay: {}", user_balance_after);
        ic_cdk::println!(
            "Liquidator Balance after repay: {}",
            liquidator_balance_after
        );
        ic_cdk::println!(
            "Backend Canister Balance after repay: {}",
            backend_balance_after
        );
        ic_cdk::println!(
            "User Debt Token Balance after repay: {}",
            user_debt_token_balance_after
        );
        // Withdraw the collateral
        let collateral = true; //params
        let withdrawamount = amount + 210;
        let withdraw_response = withdraw(
            asset.clone(),
            withdrawamount,
            Some(user_principal.to_string()),
            collateral,
        )
        .await;
        match withdraw_response {
            Ok(_) => ic_cdk::println!("Withdraw successful"),
            Err(e) => ic_cdk::trap(&format!("Withdraw failed: {}", e)),
        }

        // Check balances after withdrawal
        let user_balance_after_withdraw = get_balance(ckbtc_canister, user_principal).await;
        let liquidator_balance_after_withdraw =
            get_balance(ckbtc_canister, liquidator_principal).await;
        let backend_balance_after_withdraw =
            get_balance(ckbtc_canister, backend_canister_principal).await;
        let user_d_token_balance = get_balance(dtoken_canister, user_principal).await;

        ic_cdk::println!(
            "User Balance after withdraw: {}",
            user_balance_after_withdraw
        );
        ic_cdk::println!(
            "Liquidator Balance after withdraw: {}",
            liquidator_balance_after_withdraw
        );
        ic_cdk::println!(
            "Backend Canister Balance after withdraw: {}",
            backend_balance_after_withdraw
        );
        ic_cdk::println!("User DToken Balance: {}", user_d_token_balance);
        Ok(())
    }
}
