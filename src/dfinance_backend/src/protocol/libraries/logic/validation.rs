// use candid::{Nat, Principal};
// use core::panic;
// use ic_cdk::api::call::{call, CallResult};
// use std::env;

// use crate::constants::errors::Error;
// use crate::declarations::assets::{ReserveCache, ReserveData};

// pub struct ValidationLogic;

// impl ValidationLogic {
//     pub async fn validate_supply(
//         reserve_cache: &ReserveCache,
//         reserve: &ReserveData,
//         amount: u128,
//     ) {
//         if amount == 0 {
//             panic!("{:?}", Error::InvalidAmount);
//         }
//         let (is_active, is_frozen, _, _, is_paused) =
//             reserve_cache.reserve_configuration.get_flags(); // TODO

//         if !is_active {
//             panic!("{:?}", Error::ReserveInactive);
//         }
//         if is_paused {
//             panic!("{:?}", Error::ReservePaused);
//         }
//         if is_frozen {
//             panic!("{:?}", Error::ReserveFrozen);
//         }

//         // Supply cap limit 10 million
//         let supply_cap = Nat::from(10000000);

//         let dtoken_canister_id = env::var("CANISTER_ID_ATOKEN")
//             .expect("CANISTER_ID_ATOKEN environment variable not set");

//         let total_supply: CallResult<()> = call::<(), ()>(
//             Principal::from_text(dtoken_canister_id).expect("Invalid principal"),
//             "icrc1_total_supply",
//             (),
//         )
//         .await;

//         let current_total_supply: Nat;

//         match total_supply {
//             Ok(nat_value) => {
//                 current_total_supply = nat_value;
//                 println!("{:?}", nat_value);
//             }
//             Err(err) => {
//                 println!("{:?}", err);
//             }
//         }

//         if supply_cap == 0 || (current_total_supply >= supply_cap) {
//             panic!("{:?}", Error::SupplyCapExceeded);
//         }
//     }
// }
