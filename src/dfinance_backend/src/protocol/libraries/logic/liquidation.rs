use crate::api::state_handler::read_state;
use crate::constants::errors::Error;
use crate::declarations::assets::ExecuteRepayParams;
use crate::protocol::libraries::logic::borrow::execute_repay;
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::{
    api::{functions::asset_transfer, state_handler::mutate_state},
    declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams},
    protocol::libraries::{logic::update::UpdateLogic, math::calculate::get_exchange_rates},
};
use candid::{Nat, Principal};
use ic_cdk::{api, update};

// pub struct LiquidationLogic;

// impl LiquidationLogic {
#[update]
pub async fn execute_liquidation(
    asset_name: String,
    collateral_asset: String,
    amount: Nat,
    on_behalf_of: Principal,
) -> Result<Nat, Error> {
    if asset_name.trim().is_empty() && collateral_asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_name.len() > 7 && collateral_asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if on_behalf_of == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    ic_cdk::println!(
        "params asset_name and collateral_asset {:?} {:?}",
        asset_name,
        collateral_asset
    );
    ic_cdk::println!("liquidation amount = {}", amount);
    let mut usd_amount = Nat::from(0u128);

    let supply_amount_to_usd = get_exchange_rates(asset_name.clone(), None, amount.clone()).await;
    match supply_amount_to_usd {
        Ok((amount_in_usd, _timestamp)) => {
            // Extracted the amount in USD
            usd_amount = amount_in_usd;
            ic_cdk::println!("Supply amount in USD: {:?}", usd_amount);
        }
        Err(e) => {
            // Handling the error
            ic_cdk::println!("Error getting exchange rate: {:?}", e);
           return Err(e)
        }
    }

    ic_cdk::println!("Supply amount in USD: {:?}", usd_amount);

    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&collateral_asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {:?}", e);
            return Err(e);
        }
    };

    let dtoken_canister = read_state(|state| {
        let asset_index = &state.asset_index;
        asset_index
            .get(&collateral_asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.d_token_canister.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let dtoken_canister_principal = Principal::from_text(dtoken_canister)
        .map_err(|_| Error::ConversionErrorFromTextToPrincipal)?;

    let platform_principal = ic_cdk::api::id();

    let user_principal = on_behalf_of;
    ic_cdk::println!("User Principal (Debt User): {}", user_principal);

    let liquidator_principal = api::caller();
    ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

    if liquidator_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }
    if liquidator_principal != ic_cdk::caller() {
        return Err(Error::InvalidUser);
    }

    ic_cdk::println!("Checking balances before liquidation...");

    let asset = asset_name.clone();

    let collateral_amount = match get_exchange_rates(
        "USDT".to_string(),
        Some(collateral_asset.clone()),
        usd_amount,
    )
    .await
    {
        Ok((total_value, _time)) => {
            // Store the total_value returned from the get_exchange_rates function
            total_value
        }
        Err(e) => {
            // Handle the error case
            ic_cdk::println!("Error fetching exchange rate: {:?}", e);
            Nat::from(0u128) // Or handle the error as appropriate for your logic
        }
    };
    ic_cdk::println!("Collateral amount rate: {}", collateral_amount);
    let bonus = collateral_amount.clone()
        * (reserve_data.configuration.liquidation_bonus.clone() / Nat::from(100u128))
        / Nat::from(100000000u128);
    let reward_amount: Nat = collateral_amount.clone() + bonus.clone();
    ic_cdk::println!("bonus: {}", bonus);
    let reward_amount_param = collateral_amount + bonus;
    ic_cdk::println!("reward_amount_param: {}", reward_amount_param);
    let supply_param = ExecuteSupplyParams {
        asset: collateral_asset.to_string(),
        amount: reward_amount_param.clone(),
        is_collateral: true,
    };
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);
    let withdraw_param = ExecuteWithdrawParams {
        asset: collateral_asset.to_string(),
        is_collateral: true,
        on_behalf_of: None,
        amount: reward_amount_param,
    };

    //ValidationLogic::validate_liquidation(asset_name, amount, liquidator_principal).await;
    ic_cdk::println!("Borrow validated successfully");
    let params_repay  = ExecuteRepayParams {
        asset: asset.clone(),
        amount: amount.clone(),
        on_behalf_of: Some(user_principal),
    };
    let repay_response = execute_repay(params_repay).await;

    match repay_response {
        Ok(_) => ic_cdk::println!("Repayment successful"),
        Err(e) => return Err(e),
    }

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
            return Err(Error::ErrorBurnTokens);
        }
    };
    let usd_amount = 60812; //change it
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
            // let _ = UpdateLogic::update_user_data_withdraw(
            //     user_principal,
            //     &reserve_cache,
            //     withdraw_param,
            //     &reserve_data,
            // )
            // .await;
            // let _ = UpdateLogic::update_user_data_supply(
            //     liquidator_principal,
            //     &reserve_cache,
            //     supply_param,
            //     &mut reserve_data,
            //     //usd_amount,
            // )
            // .await;
            Ok(balance)
        }
        Err(_) => {
            if let Err(e) = asset_transfer(
                user_principal,
                dtoken_canister_principal,
                platform_principal,
                reward_amount.clone(),
            )
            .await {
                ic_cdk::println!("Error during asset transfer: {:?}", e);
            }
            return Err(Error::ErrorMintDTokens);
        }
    }
}
//}
