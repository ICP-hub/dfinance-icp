// // use candid::{Nat, Principal};
// // use ic_cdk::api::call::{call, CallResult};
// // use ic_cdk::caller;
// // use std::env;

// // use crate::api::deposit::asset_transfer_from;
// // use crate::api::state_handler::*;
// // use crate::declarations::assets::ExecuteBorrowParams;
// // use crate::protocol::libraries::logic::{reserve::ReserveLogic, validation::ValidationLogic};
// // use crate::declarations::assets::InterestRateMode;
// //use crate::declarations::assets::ExecuteRepayParams;
// // pub async fn execute_borrow(params: ExecuteBorrowParams) {
// // Fetches the canister ids, user principal and amount from env
// //     let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let dtoken_canister_id =
// //         env::var("CANISTER_ID_DTOKEN").expect("CANISTER_ID_DTOKEN environment variable not set");

// //     let debttoken_canister_id =
// //         env::var("CANISTER_ID_DEBTTOKEN").expect("CANISTER_ID_DEBTTOKEN environment variable not set");

// //     let ledger_canister_id =
// //         Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
// // let debttoken_ledger_canister_id =
// //         Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
// //     let user_principal = caller();
// //     let platform_principal =
// //         Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
// //     let amount_nat = Nat::from(params.amount);

// //     // Reads the reserve_data from the ASSET_INDEX using the asset key
// //     let reserve_data = mutate_state(|state| {
// //         let asset_index = &mut state.asset_index;
// //         asset_index
// //             .get(&params.asset)
// //             .expect("Reserve not found")
// //             .clone()
// //     });

// //     // Fetches the reserve logic cache having the current values
// //     let reserve_cache = ReserveLogic::cache(reserve_data.clone());

// //     // Updates the liquidity and borrow index
// //     ReserveLogic::update_state(&reserve_data, &reserve_cache);

// //     // Validates supply using the reserve_data
// //     ValidationLogic::validate_borrow(&reserve_cache, &reserve_data, params.amount);

// // let currentStableRate : Nat = 0;
// // let isFirstBorrowing = false;

// // if (params.interestRateMode == InterestRateMode::Stable) {
// //     currentStableRate = reserve.currentStableBorrowRate;

// //mints the debt token
// // asset_transfer_from(
// //         debttoken_ledger_canister_id,
// //         platform_principal,
// //         user_principal,
// //         amount_nat.clone(),
// //     )
// //     .await;
// //   } else {
// // asset_transfer_from(
// //     debttoken_ledger_canister_id,
// //     platform_principal,
// //     user_principal,
// //     amount_nat.clone(),
// // )
// // .await;

// //   if (isFirstBorrowing) {
// //     userConfig.setBorrowing(reserve.id, true);
// //   }

// //     // Updates inetrest rates with the assets and the amount
// //     ReserveLogic::update_interest_rates(
// //         &reserve_data,
// //         &reserve_cache,
// //         params.asset,
// //         params.amount,
// //         0,
// //     );

// //     // Transfers the asset from the user to our backend cansiter
// //if (params.release_underlying){

// //     asset_transfer_from(
// //         ledger_canister_id,
// //         user_principal,
// //         platform_principal,
// //         amount_nat.clone(),
// //     )
// //     .await;
// //}
// //     // Inter canister call to execute dtoken transfer

// //     // --------- Isolation mode logic (TODO) ---------
// //     // If first_supply == true : Validate automatic use as collateral
// //     // If first_supply == false : Set using as collateral
// // }

// // fn  executeRepay(params: ExecuteRepayParams)  {

// // Fetches the canister ids, user principal and amount from env
// //     let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let dtoken_canister_id =
// //         env::var("CANISTER_ID_DTOKEN").expect("CANISTER_ID_DTOKEN environment variable not set");

// //     let debttoken_canister_id =
// //         env::var("CANISTER_ID_DEBTTOKEN").expect("CANISTER_ID_DEBTTOKEN environment variable not set");

// //     let ledger_canister_id =
// //         Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
// // let debttoken_ledger_canister_id =
// //         Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
// //     let user_principal = caller();
// //     let platform_principal =
// //         Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
// // let dtoken_ledger_canister_id =
// //         Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
// //     let amount_nat = Nat::from(params.amount);

// //     let reserve_data = mutate_state(|state| {
// //         let asset_index = &mut state.asset_index;
// //         asset_index
// //             .get(&params.asset)
// //             .expect("Reserve not found")
// //             .clone()
// //     });

// //     // Fetches the reserve logic cache having the current values
// //     let reserve_cache = ReserveLogic::cache(reserve_data.clone());

// //     // Updates the liquidity and borrow index
// //     ReserveLogic::update_state(&reserve_data, &reserve_cache);

// //     // Validates supply using the reserve_data
// //     ValidationLogic::validate_repay(&reserve_cache, &reserve_data, params.amount);

// // if let paybackAmount :Nat = params.interestRateMode == InterestRateMode::Stable{
// //     reserve.currentStableDebt;
// // }else{
// //     reserve.currentVariableDebt;

// // }
// // let args = Account {
// //     owner: ic_cdk::caller(),
// //     subaccount: None, // Or Some(subaccount_bytes) if you have a subaccount
// // };

// // let (result,): (TransferFromResult,) = call(dtoken, "icrc1_balanceOf", (args,))
// //     .await
// //     .map_err(|e| e.1)?;

// // params.amount = result.amount;

// //   if (params.amount < paybackAmount) {
// //     paybackAmount = params.amount;
// //   }

// //burn the tokens

// // if (params.interestRateMode == InterestRateMode::Stable) {
// //     currentStableRate = reserve.currentStableBorrowRate;

// // asset_transfer_from(
// //         debttoken_ledger_canister_id,
// //         user_principal,
// //         platform_principal,
// //
// //         amount_nat.clone(),
// //     )
// //     .await;
// //   } else {
// // asset_transfer_from(
// //     debttoken_ledger_canister_id,
// //     user_principal,
// //     platform_principal,
// //     amount_nat.clone(),
// // )
// // .await;

// //burn the token
// //if(params.use_dtokens){

// // asset_transfer_from(
// //     dtoken_ledger_canister_id,
// //     user_principal,
// //     platform_principal,
// //     amount_nat.clone(),
// // )
// // .await;

// // }else{

// //     asset_transfer_from(
// //         ledger_canister_id,
// //         user_principal,
// //         platform_principal,
// //         amount_nat.clone(),
// //     )
// //     .await;
// //}

// // }

// //   }




// // use crate::api::state_handler::read_state;
// // use crate::declarations::assets::ReserveData;

// // use ic_cdk_macros::query;

// // #[query]
// // pub fn get_asset_data() -> ReserveData {
// //     read_state(|state| {
// //         let asset_index = &state.asset_index;
// //         asset_index
// //             .get(&"ckbtc".to_string())
// //             .expect("Reserve not found")
// //             .0
// //     })
// // }




// use candid::{Nat, Principal};
// use ic_cdk::api::call::{call, CallResult};
// use ic_cdk::caller;
// use std::env;
// use dotenv::dotenv;
// use crate::api::deposit::asset_transfer_from;
// use crate::api::state_handler::*;
// use crate::declarations::assets::ExecuteBorrowParams;
// use crate::protocol::libraries::logic::validation::ValidationLogic;
// use crate::protocol::libraries::logic::reserve;
// use crate::declarations::assets::InterestRateMode;
// use crate::declarations::assets::ExecuteRepayParams;



// pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<(), String> {
//     dotenv().ok();
    
//     // Fetches the canister ids, user principal, and amount from env
//     let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
//         .map_err(|_| "CANISTER_ID_CKBTC_LEDGER environment variable not set".to_string())?;
//     let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
//         .map_err(|_| "CANISTER_ID_DFINANCE_BACKEND environment variable not set".to_string())?;
//     let dtoken_canister_id = env::var("CANISTER_ID_DTOKEN")
//         .map_err(|_| "CANISTER_ID_DTOKEN environment variable not set".to_string())?;
//     let debttoken_canister_id = env::var("CANISTER_ID_DEBTTOKEN")
//         .map_err(|_| "CANISTER_ID_DEBTTOKEN environment variable not set".to_string())?;

//     let ledger_canister_id = Principal::from_text(canister_id_ckbtc_ledger)
//         .map_err(|_| "Invalid ledger canister ID".to_string())?;
//     let debttoken_ledger_canister_id = Principal::from_text(dtoken_canister_id)
//         .map_err(|_| "Invalid ledger canister ID".to_string())?;
//     let user_principal = caller();
//     let platform_principal = Principal::from_text(canister_id_dfinance_backend)
//         .map_err(|_| "Invalid platform principal".to_string())?;
//     let amount_nat = Nat::from(params.amount);

//     // Reads the reserve_data from the ASSET_INDEX using the asset key
//     let reserve_data_result = mutate_state(|state| {
//         let asset_index = &mut state.asset_index;
//         asset_index
//             .get(&params.asset.to_string())
//             .map(|reserve| reserve.0.clone())
//             .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
//     });

//     // Unwrap the Result to get ReserveData
//     let mut reserve_data = match reserve_data_result {
//         Ok(data) => {
//             ic_cdk::println!("Reserve data found for asset: {:?}", data);
//             data
//         }
//         Err(e) => {
//             ic_cdk::println!("Error: {}", e);
//             return Err(e);
//         }
//     };

//     // Fetches the reserve logic cache having the current values
//     let mut reserve_cache = reserve::cache(&reserve_data);
//     ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);
    
//     // Updates the liquidity and borrow index
//     reserve::update_state(&mut reserve_data, &mut reserve_cache);
//     ic_cdk::println!("Reserve state updated successfully");
    
//     // Validates supply using the reserve_data
//     // ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);
    
//     ic_cdk::println!("Supply validated successfully");

//     let mut current_stable_rate: u128 = 0;
//     let is_first_borrowing = false;

//     if params.interestRateMode == InterestRateMode::Stable {
//         current_stable_rate = reserve_cache.curr_avg_stable_borrow_rate;

//         // Mints the debt token
//         asset_transfer_from(
//             debttoken_ledger_canister_id,
//             platform_principal,
//             user_principal,
//             amount_nat.clone(),
//         ).await.map_err(|e| e.to_string())?;
//     } else {
//         asset_transfer_from(
//             debttoken_ledger_canister_id,
//             platform_principal,
//             user_principal,
//             amount_nat.clone(),
//         ).await.map_err(|e| e.to_string())?;

//         // if is_first_borrowing {
//         //     userConfig.setBorrowing(reserve_data.id, true);
//         // }

        
//         reserve::update_state(&mut reserve_data, &mut reserve_cache);
//     ic_cdk::println!("Reserve state updated successfully");

//         // Transfers the asset from the user to our backend canister
//         if params.release_underlying {
//             asset_transfer_from(
//                 ledger_canister_id,
//                 user_principal,
//                 platform_principal,
//                 amount_nat.clone(),
//             ).await.map_err(|e| e.to_string())?;
//         }
//     }

//     // If the function completes successfully, return Ok(())
//     Ok(())
// }




// // fn  executeRepay(params: ExecuteRepayParams)  {

// // // // Fetches the canister ids, user principal and amount from env
// //     let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
// //         .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
// //     let dtoken_canister_id =
// //         env::var("CANISTER_ID_DTOKEN").expect("CANISTER_ID_DTOKEN environment variable not set");

// //     let debttoken_canister_id =
// //         env::var("CANISTER_ID_DEBTTOKEN").expect("CANISTER_ID_DEBTTOKEN environment variable not set");

// //     let ledger_canister_id =
// //         Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
// // let debttoken_ledger_canister_id =
// //         Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
// //     let user_principal = caller();
// //     let platform_principal =
// //         Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
// // let dtoken_ledger_canister_id =
// //         Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
// //     let amount_nat = Nat::from(params.amount);

// //     let reserve_data = mutate_state(|state| {
// //         let asset_index = &mut state.asset_index;
// //         asset_index
// //             .get(&params.asset)
// //             .expect("Reserve not found")
// //             .clone()
// //     });

// //     // Fetches the reserve logic cache having the current values
// //     let reserve_cache = ReserveLogic::cache(reserve_data.clone());

// //     // Updates the liquidity and borrow index
// //     ReserveLogic::update_state(&reserve_data, &reserve_cache);

// //     // Validates supply using the reserve_data
// //     ValidationLogic::validate_repay(&reserve_cache, &reserve_data, params.amount);

// // if let paybackAmount :Nat = params.interestRateMode == InterestRateMode::Stable{
// //     reserve.currentStableDebt;
// // }else{
// //     reserve.currentVariableDebt;

// // }
// // let args = Account {
// //     owner: ic_cdk::caller(),
// //     subaccount: None, // Or Some(subaccount_bytes) if you have a subaccount
// // };

// // let (result,): (TransferFromResult,) = call(dtoken, "icrc1_balanceOf", (args,))
// //     .await
// //     .map_err(|e| e.1)?;

// // params.amount = result.amount;

// //   if (params.amount < paybackAmount) {
// //     paybackAmount = params.amount;
// //   }

// // // burn the tokens

// // if (params.interestRateMode == InterestRateMode::Stable) {
// //     currentStableRate = reserve.currentStableBorrowRate;

// // asset_transfer_from(
// //         debttoken_ledger_canister_id,
// //         user_principal,
// //         platform_principal,

// //         amount_nat.clone(),
// //     )
// //     .await;
// //   } else {
// // asset_transfer_from(
// //     debttoken_ledger_canister_id,
// //     user_principal,
// //     platform_principal,
// //     amount_nat.clone(),
// // )
// // .await;

// // // burn the token
// // if(params.use_dtokens){

// // asset_transfer_from(
// //     dtoken_ledger_canister_id,
// //     user_principal,
// //     platform_principal,
// //     amount_nat.clone(),
// // )
// // .await;

// // }else{

// //     asset_transfer_from(
// //         ledger_canister_id,
// //         user_principal,
// //         platform_principal,
// //         amount_nat.clone(),
// //     )
// //     .await;
// // }

// // }

// //   }

// // use crate::api::state_handler::read_state;
// // use crate::declarations::assets::ReserveData;

// // use ic_cdk_macros::query;

// // #[query]
// // pub fn get_asset_data() -> ReserveData {
// //     read_state(|state| {
// //         let asset_index = &state.asset_index;
// //         asset_index
// //             .get(&"ckbtc".to_string())
// //             .expect("Reserve not found")
// //             .0
// //     })
// // }



use candid::{Nat, Principal};
use ic_cdk::api::call::{call, CallResult};
use ic_cdk::caller;
use std::env;
use dotenv::dotenv;
use crate::api::deposit::asset_transfer_from;
use crate::api::state_handler::*;
use crate::constants::asset_address::CKBTC_LEDGER_ADDRESS;
use crate::declarations::assets::ExecuteBorrowParams;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::logic::reserve;
use crate::declarations::assets::InterestRateMode;
use crate::protocol::libraries::types::datatypes::UserData;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<(), String> {
    dotenv().ok();
    ic_cdk::println!("Starting execute_supply with params: {:?}", params);

    let canister_id_ckbtc_ledger = "c2lt4-zmaaa-aaaaa-qaaiq-cai".to_string();
    let dtoken_canister_id = "c5kvi-uuaaa-aaaaa-qaaia-cai".to_string();
    let debttoken_canister_id = "by6od-j4aaa-aaaaa-qaadq-cai".to_string();
    ic_cdk::println!("Canister IDs fetched successfully");

    let ledger_canister_id = Principal::from_text(canister_id_ckbtc_ledger)
        .map_err(|_| "Invalid ledger canister ID".to_string())?;
    // let user_principal = caller();
    let user_principal = Principal::from_text(
        "i5hok-bgbg2-vmnlz-qa4ur-wm6z3-ha5xl-c3tut-i7oxy-6ayyw-2zvma-lqe".to_string(),
    )
    .map_err(|_| "Invalid user canister ID".to_string())?;

    let platform_principal = Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai".to_string())
        .map_err(|_| "Invalid platform canister ID".to_string())?;

    let amount_nat = Nat::from(params.amount);

    ic_cdk::println!("Principals and amount_nat prepared successfully");

    // Reads the reserve_data from the ASSET_INDEX using the asset key
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
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);
    
    // // Updates the liquidity and borrow index
    // reserve::update_state(&mut reserve_data, &mut reserve_cache);
    // ic_cdk::println!("Reserve state updated successfully");
    
    // // Validates supply using the reserve_data
    // ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);
    
    // ic_cdk::println!("Supply validated successfully");

    // let mut current_stable_rate: u128 = 0;
    // let is_first_borrowing = false;

    // if params.interestRateMode == InterestRateMode::Stable {
    //     current_stable_rate = reserve_cache.curr_avg_stable_borrow_rate;

    //     // Mints the debt token
    //     asset_transfer_from(
    //         debttoken_ledger_canister_id,
    //         platform_principal,
    //         user_principal,
    //         amount_nat.clone(),
    //     ).await.map_err(|e| e.to_string())?;
    // } else {
    //     asset_transfer_from(
    //         debttoken_ledger_canister_id,
    //         platform_principal,
    //         user_principal,
    //         amount_nat.clone(),
    //     ).await.map_err(|e| e.to_string())?;

        // if is_first_borrowing {
        //     userConfig.setBorrowing(reserve_data.id, true);
        // }

        
    //     reserve::update_state(&mut reserve_data, &mut reserve_cache);
    // ic_cdk::println!("Reserve state updated successfully");

    //     // Transfers the asset from the user to our backend canister
    //     if params.release_underlying {
    //         asset_transfer_from(
    //             ledger_canister_id,
    //             user_principal,
    //             platform_principal,
    //             amount_nat.clone(),
    //         ).await.map_err(|e| e.to_string())?;
    //     }
    // }

    // asset_transfer_from(
    //     ledger_canister_id,
    //     platform_principal,
    //     user_principal,
    //     amount_nat.clone(),
    // ).await.map_err(|e| e.to_string())?;
    let args = TransferFromArgs {
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
        amount: amount_nat,
    };
    let (result,): (TransferFromResult,) = call(ledger_canister_id, "icrc2_transfer_from", (args,))
        .await
        .map_err(|e| e.1)?;
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
        ini_user.insert(user_principal, Candid(initial_user_data));
        ic_cdk::println!("User added successfully");
    });

    let user_data = mutate_state(|state| {
        let data = &mut state.user_profile;
        data.get(&user_principal)
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

    user_prof.net_worth = Some(params.amount);
    user_prof.net_apy = Some(8.25);
    user_prof.supply = None;
    user_prof.borrow = Some(vec![("ckbtc".to_string(), params.amount)]);

    mutate_state(|state| {
        let user_dt = &mut state.user_profile;
        user_dt.insert(user_principal, Candid(user_prof.clone()));
    });

    ic_cdk::println!("User data: {:?}", user_prof);


    match result {
        TransferFromResult::Ok(balance) => Ok(()),
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    }

   
    // If the function completes successfully, return Ok(())
    // Ok(())
}