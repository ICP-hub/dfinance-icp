use crate::api::deposit::asset_transfer_from;
use candid::{Nat, Principal};
use dotenv::dotenv;
use ic_cdk::api::call::{call, CallResult};
use ic_cdk::caller;
use std::arch::is_aarch64_feature_detected;
use std::env;
use crate::api::state_handler::mutate_state;
use crate::declarations::assets::ExecuteSupplyParams;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use ic_cdk_macros;
pub struct SupplyLogic;
use crate::declarations::transfer::*;

impl SupplyLogic {
    pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
        println!("Starting execute_supply with params: {:?}", params);
        dotenv().ok();
        println!(
            "CANISTER_ID_CKBTC_LEDGER: {:?}",
            env::var("CANISTER_ID_CKBTC_LEDGER")
        );
        println!(
            "CANISTER_ID_DFINANCE_BACKEND: {:?}",
            env::var("CANISTER_ID_DFINANCE_BACKEND")
        );
        println!("CANISTER_ID_ATOKEN: {:?}", env::var("CANISTER_ID_ATOKEN"));

        let canister_id_ckbtc_ledger = "bkyz2-fmaaa-aaaaa-qaaaq-cai".to_string();
        let canister_id_dfinance_backend = "be2us-64aaa-aaaaa-qaabq-cai".to_string();
        let dtoken_canister_id = "b77ix-eeaaa-aaaaa-qaada-cai".to_string();

        println!("Canister IDs fetched successfully");

        let ledger_canister_id = Principal::from_text(canister_id_ckbtc_ledger)
            .map_err(|_| "Invalid ledger canister ID".to_string())?;
        let user_principal = caller();
        ic_cdk::println!("user principal {}", user_principal);
        let platform_principal = Principal::from_text("2vxsx-fae")
            .map_err(|_| "Invalid platform principal".to_string())?;
        ic_cdk::println!("platform principal {}", platform_principal);

        let amount_nat = Nat::from(params.amount);

        ic_cdk::println!(
            "Principals and amount_nat prepared successfully {}",
            amount_nat
        );

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.asset.to_string())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        });
        // Unwrap the Result to get ReserveData
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
        let reserve_cache = ReserveLogic::cache(reserve_data.clone());

        // Updates the liquidity and borrow index
        ReserveLogic::update_state(&reserve_data, &reserve_cache);

        // Validates supply using the reserve_data
        ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);

        // Updates inetrest rates with the assets and the amount
        ReserveLogic::update_interest_rates(
            &reserve_data,
            &reserve_cache,
            params.asset,
            params.amount,
            0,
        )
        .await;
        ic_cdk::println!("Interest rates updated successfully");

        // Transfers the asset from the user to our backend cansiter
        let args = TransferFromArgs {
            to: TransferAccount {
                owner: platform_principal,
                subaccount: None,
            },
            fee: None,
            spender_subaccount: None,
            from: TransferAccount {
                owner: user_principal,
                subaccount: None,
            },
            memo: None,
            created_at_time: None,
            amount: amount_nat.clone(),
        };
        let (result,): (TransferFromResult,) =
            call(ledger_canister_id, "icrc2_transfer_from", (args,))
                .await
                .map_err(|e| e.1)?;

        match result {
            TransferFromResult::Ok(balance) => Ok(balance),
            TransferFromResult::Err(err) => Err(format!("{:?}", err)),
        };

        ic_cdk::println!("Asset transfer from user to backend canister executed successfully");

        // Dtoken transfer
        let dtoken_args = TransferFromArgs {
            to: TransferAccount {
                owner: user_principal,
                subaccount: None,
            },
            fee: None,
            spender_subaccount: None,
            from: TransferAccount {
                owner: platform_principal,
                subaccount: None,
            },
            memo: None,
            created_at_time: None,
            amount: amount_nat.clone(),
        };
        let (new_result,): (TransferFromResult,) =
            call(ledger_canister_id, "icrc2_transfer_from", (dtoken_args,))
                .await
                .map_err(|e| e.1)?;

        match new_result {
            TransferFromResult::Ok(balance) => Ok(balance),
            TransferFromResult::Err(err) => Err(format!("{:?}", err)),
        }

        // ic_cdk::println!("{}",result);

        // ic_cdk::println!("Asset transfer from user to backend canister executed successfully");

        // Inter canister call to execute dtoken transfer
        // let mint: CallResult<()> = call::<
        //     (
        //         Principal,
        //         Principal,
        //         Option<Vec<u8>>,
        //         Option<Vec<u8>>,
        //         Nat,
        //         Option<Vec<u8>>,
        //     ),
        //     (),
        // >(
        //     Principal::from_text(dtoken_canister_id).expect("Invalid principal"),
        //     "execute_transfer",
        //     (
        //         platform_principal,
        //         user_principal,
        //         None,
        //         None,
        //         amount_nat,
        //         None,
        //     ),
        // )
        // .await;

        // print!("Mint function {:?}", mint);
        // match mint {
        //     Ok(_) => {
        //         println!("Mint function executed successfully");

        //         // Optionally, you can wrap `reserve_data` back into `Candid` if needed
        //         let updated_reserve_data = Candid(reserve_data);
        //         // let asset_key = params.asset.clone();
        //         // Save the updated reserve data back to the state if needed
        //         mutate_state(|state| {
        //             let asset_index = &mut state.asset_index;
        //             asset_index.insert("ckbtc".to_string(), updated_reserve_data);
        //         });

        //         println!("Reserve data updated in state successfully");
        //         Ok(())
        //     }
        //     Err(e) => {
        //         eprintln!("Mint function failed: {:?}", e);
        //         Err(format!("Mint function failed: {:?}", e))
        //     }
        // }

        // --------- Isolation mode logic (TODO) ---------
        // If first_supply == true : Validate automatic use as collateral
        // If first_supply == false : Set using as collateral

        // println!("Starting execute_supply with params: {:?}", params);
        // dotenv().ok();
        // println!(
        //     "CANISTER_ID_CKBTC_LEDGER: {:?}",
        //     env::var("CANISTER_ID_CKBTC_LEDGER")
        // );
        // println!(
        //     "CANISTER_ID_DFINANCE_BACKEND: {:?}",
        //     env::var("CANISTER_ID_DFINANCE_BACKEND")
        // );
        // println!("CANISTER_ID_ATOKEN: {:?}", env::var("CANISTER_ID_ATOKEN"));
        // // let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
        // //     .map_err(|_| "CANISTER_ID_CKBTC_LEDGER environment variable not set".to_string())?;
        // // let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
        // //     .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
        // // let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
        // //     .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
        // // let dtoken_canister_id = env::var("CANISTER_ID_ATOKEN")
        // //     .expect("CANISTER_ID_ATOKEN environment variable not set");
        // // let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
        // // .map_err(|_| "CANISTER_ID_CKBTC_LEDGER environment variable not set".to_string())?;
        // let canister_id_ckbtc_ledger = "by6od-j4aaa-aaaaa-qaadq-cai".to_string();
        // // let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
        // //     .map_err(|_| "CANISTER_ID_Dfinance_backend environment variable not set".to_string())?;
        // let canister_id_dfinance_backend = "a3shf-5eaaa-aaaaa-qaafa-cai".to_string();
        // let dtoken_canister_id = "asrmz-lmaaa-aaaaa-qaaeq-cai".to_string();
        // // let dtoken_canister_id = env::var("CANISTER_ID_ATOKEN")
        // //     .map_err(|_| "CANISTER_ID_ATOKEN environment variable not set".to_string())?;
        // println!("Canister IDs fetched successfully");
        // // let ledger_canister_id =
        // //     Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
        // // let user_principal = caller();
        // // let platform_principal =
        // //     Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
        // let ledger_canister_id = Principal::from_text(canister_id_ckbtc_ledger)
        //     .map_err(|_| "Invalid ledger canister ID".to_string())?;
        // let user_principal = caller();
        // // let user_principal = Principal::from_text(params.on_behalf_of).map_err(|_| "Invalid user principal ID".to_string())?;
        // ic_cdk::println!("user principal {}", user_principal);
        // let platform_principal = Principal::from_text(canister_id_dfinance_backend)
        //     .map_err(|_| "Invalid platform principal".to_string())?;
        // ic_cdk::println!("platform principal {}", platform_principal);
        // let amount_nat = Nat::from(params.amount);
        // ic_cdk::println!(
        //     "Principals and amount_nat prepared successfully {}",
        //     amount_nat
        // );
        // // Reads the reserve_data from the ASSET_INDEX using the asset key
        // // let reserve_data = mutate_state(|state| {
        // //     let asset_index = &mut state.asset_index;
        // //     asset_index
        // //         .get(&params.asset.to_string())
        // //         // .unwrap()
        // //         // .0;
        // //         // .expect("Reserve not found")
        // //         .clone()
        // // });
        // // let reserve_data_result = mutate_state(|state| {
        // //     let asset_index = &mut state.asset_index;
        // //     asset_index
        // //         .get(&params.asset.to_string())
        // //         .map(|reserve| reserve.clone())
        // //         .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        // // });
        // let reserve_data_result = mutate_state(|state| {
        //     let asset_index = &mut state.asset_index;
        //     asset_index
        //         .get(&params.asset.to_string())
        //         .map(|reserve| reserve.0.clone())
        //         .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        // });
        // // Unwrap the Result to get ReserveData
        // let mut reserve_data = match reserve_data_result {
        //     // Ok(data) => data,
        //     // Err(e) => {
        //     //     eprintln!("Error: {}", e);
        //     //     return;
        //     // }
        //     Ok(data) => {
        //         ic_cdk::println!("Reserve data found for asset: {:?}", data);
        //         data
        //     }
        //     Err(e) => {
        //         ic_cdk::println!("Error: {}", e);
        //         return Err(e);
        //     }
        // };
        // // Fetches the reserve logic cache having the current values
        // let mut reserve_cache = reserve::cache(&reserve_data);
        // ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);
        // // Updates the liquidity and borrow index
        // reserve::update_state(&mut reserve_data, &mut reserve_cache);
        // ic_cdk::println!("Reserve state updated successfully");
        // // Validates supply using the reserve_data
        // ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);
        // ic_cdk::println!("Supply validated successfully");
        // // Updates inetrest rates with the assets and the amount
        // reserve::update_interest_rates(
        //     &mut reserve_data,
        //     &reserve_cache,
        //     params.asset,
        //     params.amount,
        //     0,
        // )
        // .await;
        // ic_cdk::println!("Interest rates updated successfully");
        // // Transfers the asset from the user to our backend cansiter
        // asset_transfer_from(
        //     ledger_canister_id,
        //     user_principal,
        //     platform_principal,
        //     amount_nat.clone(),
        // )
        // .await
        // .map_err(|e| format!("Asset transfer failed: {:?}", e))?;
        // ic_cdk::println!("Asset transfer from user to backend canister executed successfully");
        // // Inter canister call to execute dtoken transfer
        // let mint: CallResult<()> = call::<
        //     (
        //         Principal,
        //         Principal,
        //         Option<Vec<u8>>,
        //         Option<Vec<u8>>,
        //         Nat,
        //         Option<Vec<u8>>,
        //     ),
        //     (),
        // >(
        //     Principal::from_text(dtoken_canister_id).expect("Invalid principal"),
        //     "execute_transfer",
        //     (
        //         platform_principal,
        //         user_principal,
        //         None,
        //         None,
        //         amount_nat,
        //         None,
        //     ),
        // )
        // .await;
        // // print!("Mint function {:?}", mint);
        // match mint {
        //     Ok(_) => {
        //         println!("Mint function executed successfully");
        //         // Optionally, you can wrap `reserve_data` back into `Candid` if needed
        //         let updated_reserve_data = Candid(reserve_data);
        //         // let asset_key = params.asset.clone();
        //         // Save the updated reserve data back to the state if needed
        //         mutate_state(|state| {
        //             let asset_index = &mut state.asset_index;
        //             asset_index.insert("ckbtc".to_string(), updated_reserve_data);
        //         });
        //         println!("Reserve data updated in state successfully");
        //         Ok(())
        //     }
        //     Err(e) => {
        //         eprintln!("Mint function failed: {:?}", e);
        //         Err(format!("Mint function failed: {:?}", e))
        //     }
        // }
        // // --------- Isolation mode logic (TODO) ---------
        // // If first_supply == true : Validate automatic use as collateral
        // // If first_supply == false : Set using as collateral
    }
}

#[ic_cdk_macros::update]
async fn supply(params: ExecuteSupplyParams) -> Result<Nat, String> {
    SupplyLogic::execute_supply(params).await
}
