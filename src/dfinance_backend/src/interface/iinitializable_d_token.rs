use ic_cdk_macros::{query, update};
use ic_cdk::export::{candid::{CandidType, Deserialize, Principal}};
use serde::Serialize;
use ipool::IPool;
use idefiincentivescontroller::IDefiIncentivesController;

// #[derive(CandidType, Serialize, Deserialize)]
// pub struct InitializedEvent {
//     underlying_asset: Principal,
//     pool: Principal,
//     treasury: Principal,
//     incentives_controller: Principal,
//     a_token_decimals: u8,
//     a_token_name: String,
//     a_token_symbol: String,
//     params: Vec<u8>,
// }

#[update]
async fn initialize(
    pool: Principal,
    treasury: Principal,
    underlying_asset: Principal,
    incentives_controller: Principal,
    a_token_decimals: u8,
    a_token_name: String,
    a_token_symbol: String,
    params: Vec<u8>,
) {
    // Emit Initialized event
    let event = InitializedEvent {
        underlying_asset,
        pool,
        treasury,
        incentives_controller,
        a_token_decimals,
        a_token_name,
        a_token_symbol,
        params,
    };
    ic_cdk::api::print(format!("Initialized event: {:?}", event));

    // Implement the rest of the initialization logic here
}
