use crate::{
    api::{functions::asset_transfer, state_handler::mutate_state},
    declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams},
    protocol::libraries::{
        logic::{
            reserve::{self, mint_scaled, UserState},
            update::UpdateLogic,
            validation::ValidationLogic,
        },
        math::calculate::get_exchange_rates,
    },
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
        ic_cdk::println!("params asset_name and collateral_asset {:?} {:?}",asset_name,collateral_asset);
        let mut usd_amount = amount ;

        let supply_amount_to_usd = get_exchange_rates(asset_name.clone(), None, amount).await;
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

        let reserve_data = match reserve_data_result {
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
                .and_then(|reserve_data| reserve_data.d_token_canister.clone())
                .ok_or_else(|| format!("No d_token_canister found for asset: {}", collateral_asset))
        })?;

        let dtoken_canister_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| "Invalid dtoken canister ID".to_string())?;

        let platform_principal = ic_cdk::api::id();

        let user_principal = Principal::from_text(on_behalf_of)
            .map_err(|_| "Invalid user canister ID".to_string())?;
        ic_cdk::println!("User Principal (Debt User): {}", user_principal);

        let liquidator_principal = api::caller();
        ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

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
                ic_cdk::println!("Error fetching exchange rate: {}", e);
                0 // Or handle the error as appropriate for your logic
            }
        };
        ic_cdk::println!("Collateral amount rate: {}", collateral_amount);
        let bonus =
            collateral_amount * (reserve_data.configuration.liquidation_bonus / 100) / 100000000;
        let reward_amount = Nat::from(collateral_amount as u128) + Nat::from(bonus);
        ic_cdk::println!("bonus: {}", bonus);
        let reward_amount_param = collateral_amount as u128 + bonus as u128;
        ic_cdk::println!("reward_amount_param: {}", reward_amount_param);
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

        // Validates liquidation using the reserve_data
        ValidationLogic::validate_liquidation(
            asset_name,
            amount,
            reward_amount_param,
            liquidator_principal,
            user_principal,
        )
        .await;
        ic_cdk::println!("Liquidation validated successfully");

        // Repaying debt
        let repay_response = repay(asset.clone(), amount, Some(user_principal.to_string())).await;

        match repay_response {
            Ok(_) => ic_cdk::println!("Repayment successful"),
            Err(e) => ic_cdk::trap(&format!("Repayment failed: {}", e)),
        }

        // Fetches the reserve logic cache having the current values
        let reserve_cache = reserve::cache(&reserve_data);
        ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

        // Burning debttoken
        // stuct replica of the userstate.
        // let mut update_user_state = UserState {
        //     adjusted_balance: reserve_cache.curr_liquidity_index as f64
        //         * reserve_data.total_supply as f64,
        //     last_liquidity_index: reserve_cache.curr_liquidity_index as f64,
        // };

    //     fn nat_to_f64(value: Nat) -> f64 {
    //         value
    //             .to_string()
    //             .parse::<f64>()
    //             .expect("Failed to convert Nat to f64")
    //     }

    //     match burn_scaled(
    //     &mut update_user_state,
    //     nat_to_f64(reward_amount.clone()),
    //     reserve_cache.next_liquidity_index as f64,
    //     user_principal,
    //     dtoken_canister_principal,
    //     platform_principal,
    // )
    // .await
        // match asset_transfer(
        //     platform_principal,
        //     dtoken_canister_principal,
        //     user_principal,
        //     reward_amount.clone(),
        // )
        // .await
        // {
        //     Ok(balance) => {
        //         ic_cdk::println!(
        //             "Dtoken Asset transfer from user to backend canister executed successfully"
        //         );
        //         balance
        //     }
        //     Err(err) => {
        //         return Err(format!("Burn failed. Error: {:?}", err));
        //     }
        // };
        let usd_amount = 60812; //change it
                                

    // Minting dtoken                           
    // stuct replica of the userstate.
    // let mut update_user_state = UserState {
    //     adjusted_balance: reserve_cache.curr_liquidity_index as f64
    //         * reserve_data.total_supply as f64,
    //     last_liquidity_index: reserve_cache.curr_liquidity_index as f64,
    // };

    // function to update or mint tokens to keep track of exact numbers of tokens.
//    match mint_scaled(
//         &mut update_user_state,
//         nat_to_f64(reward_amount.clone()),
//         reserve_cache.next_liquidity_index as f64,
//         user_principal,
//         dtoken_canister_principal,
//         platform_principal,
//     )
//     .await
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
                let _ = UpdateLogic::update_user_data_withdraw(
                    user_principal,
                    &reserve_cache,
                    withdraw_param,
                    &reserve_data,
                    0,
                )
                .await;
                let _ = UpdateLogic::update_user_data_supply(
                    liquidator_principal,
                    &reserve_cache,
                    supply_param,
                    &reserve_data,
                    usd_amount,
                )
                .await;
            // need to ask what to return to the user.
                Ok(balance)
            }
            Err(err) => {
                // stuct replica of the userstate.
            // let mut update_user_state = UserState {
            //     adjusted_balance: reserve_cache.curr_liquidity_index as f64
            //         * reserve_data.total_supply as f64,
            //     last_liquidity_index: reserve_cache.curr_liquidity_index as f64,
            // };

            // fn nat_to_f64(value: Nat) -> f64 {
            //     value
            //         .to_string()
            //         .parse::<f64>()
            //         .expect("Failed to convert Nat to f64")
            // }

            // // function to update or mint tokens to keep track of exact numbers of tokens.
            // let mint_scaled_result = mint_scaled(
            //     &mut update_user_state,
            //     nat_to_f64(reward_amount.clone()),
            //     reserve_cache.next_liquidity_index as f64,
            //     user_principal,
            //     dtoken_canister_principal,
            //     platform_principal,
            // )
            // .await;

            // match mint_scaled_result {
            //     Ok(()) => {
            //         println!("minting debttoken successfully");
            //     }
            //     Err(e) => {
            //         panic!("Get error in minting the debttoken {:?}", e);
            //     }
            // };
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
