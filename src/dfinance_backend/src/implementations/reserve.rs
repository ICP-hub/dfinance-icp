use crate::{
    api::state_handler::mutate_state,
    constants::asset_data::get_asset_data,
    declarations::storable::Candid,
};
use crate::constants::errors::Error;
use candid::Principal;
use ic_cdk::update;

// #[update]
// pub async fn initialize_reserve()-> Result<(),Error>{

//     let user_principal = ic_cdk::caller();

//     if user_principal == Principal::anonymous()  || !ic_cdk::api::is_controller(&ic_cdk::api::caller()) {
//         ic_cdk::println!("Anonymous principals are not allowed");
//         return Err(Error::InvalidPrincipal);
//     }

//     let asset_data_map = get_asset_data().await;

//     for (asset_name, (principal, reserve_data)) in asset_data_map {
//         let mut data = reserve_data;

//         data.last_update_timestamp = ic_cdk::api::time();

//         mutate_state(|state| {
//             state.reserve_list.insert(asset_name.to_string(), principal);
//             let reserve_data = &mut state.asset_index;

//             reserve_data.insert(asset_name.to_string(), Candid(data));
//             ic_cdk::println!("Reserve for {} initialized successfully", asset_name);
//         });
//     }
//     Ok(())
// }
