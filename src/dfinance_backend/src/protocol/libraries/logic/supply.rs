// use candid::{Nat, Principal};
// use ic_cdk::api::call::{call, CallResult};
// use ic_cdk::caller;
// use std::env;

// use crate::api::deposit::asset_transfer_from;
// use crate::api::state_handler::*;
// use crate::declarations::assets::ExecuteSupplyParams;
// use crate::protocol::libraries::logic::{reserve::ReserveLogic, validation::ValidationLogic};

// struct SupplyLogic;

// impl SupplyLogic {
//     pub async fn execute_supply(params: ExecuteSupplyParams) {
//         // Fetches the canister ids, user principal and amount from env
//         let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
//             .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
//         let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
//             .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
//         let dtoken_canister_id = env::var("CANISTER_ID_ATOKEN")
//             .expect("CANISTER_ID_ATOKEN environment variable not set");

//         let ledger_canister_id =
//             Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
//         let user_principal = caller();
//         let platform_principal =
//             Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
//         let amount_nat = Nat::from(params.amount);

//         // Reads the reserve_data from the ASSET_INDEX using the asset key
//         let reserve_data = mutate_state(|state| {
//             let asset_index = &mut state.asset_index;
//             asset_index
//                 .get(&params.asset)
//                 .expect("Reserve not found")
//                 .clone()
//         });

//         // Fetches the reserve logic cache having the current values
//         let reserve_cache = ReserveLogic::cache(reserve_data.clone());

//         // Updates the liquidity and borrow index
//         ReserveLogic::update_state(&reserve_data, &reserve_cache);

//         // Validates supply using the reserve_data
//         ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);

//         // Updates inetrest rates with the assets and the amount
//         ReserveLogic::update_interest_rates(
//             &reserve_data,
//             &reserve_cache,
//             params.asset,
//             params.amount,
//             0,
//         );

//         // Transfers the asset from the user to our backend cansiter
//         asset_transfer_from(
//             ledger_canister_id,
//             user_principal,
//             platform_principal,
//             amount_nat.clone(),
//         )
//         .await;

//         // Inter canister call to execute dtoken transfer
//         let mint: CallResult<()> = call::<
//             (
//                 Principal,
//                 Principal,
//                 Option<Vec<u8>>,
//                 Option<Vec<u8>>,
//                 Nat,
//                 Option<Vec<u8>>,
//             ),
//             (),
//         >(
//             Principal::from_text(dtoken_canister_id).expect("Invalid principal"),
//             "execute_transfer",
//             (
//                 platform_principal,
//                 user_principal,
//                 None,
//                 None,
//                 amount_nat,
//                 None,
//             ),
//         )
//         .await;

//         print!("Mint function {:?}", mint);

//         // --------- Isolation mode logic (TODO) ---------
//         // If first_supply == true : Validate automatic use as collateral
//         // If first_supply == false : Set using as collateral
//     }
// }
