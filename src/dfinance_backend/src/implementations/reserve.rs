use crate::{
    api::state_handler::mutate_state,
    declarations::{assets::ReserveData, storable::Candid},
    protocol::configuration::reserve_configuration::ReserveConfiguration,
};
use candid::{Nat, Principal};
// use candid::Principal;
use ic_cdk::{update, query};
use crate::declarations::transfer::*;
use ic_cdk::call;
use crate::get_all_assets;
#[update]
pub fn initialize_reserve(){
    let asset_names = get_all_assets();
    for asset_name in asset_names {
    let config = ReserveConfiguration::initialize(
        75,    // ltv
        80,    // liquidation_threshold
        5,     // liquidation_bonus
        // 18,      // decimals
        true,    // active
        false,   // frozen
        true,    // borrowing_enabled
        // true,    // stable_borrowing_enabled
        false,   // paused
        // true,    // borrowable_in_isolation
        // false,   // siloed_borrowing
        // true,    // flashloan_enabled
        // 5,    // reserve_factor
        100000,  // borrow_cap
        100000,  // supply_cap
        100,     // liquidation_protocol_fee
        // 1,       // emode_category
        // 50000,   // unbacked_mint_cap
        // 1000000  // debt_ceiling
    );
    // let backend_canister_principal = Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai")
    //     .map_err(|_| "Invalid backend canister ID".to_string())?;

    // let total_supply = get_ckbtc_balance(backend_canister_principal).await?;

    let data = ReserveData {
        asset_name: Some(asset_name.clone()),
        last_update_timestamp: ic_cdk::api::time(),
        current_liquidity_rate: 0,
        borrow_rate: Some(8.25),
        supply_rate_apr: Some(8.25),
        d_token_canister: Some("by6od-j4aaa-aaaaa-qaadq-cai".to_string()),
        debt_token_canister: Some("b77ix-eeaaa-aaaaa-qaada-cai".to_string()),
        // total_supply: Some(total_supply),
        // current_stable_borrow_rate: 8,
        // current_variable_borrow_rate: 4,
        // interest_rate_strategy_address: Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap(),
        // a_token_address: Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap(),
        // stable_debt_token_address: 
            // Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        // variable_debt_token_address: 
            // Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        accrued_to_treasury: 0,
        // unbacked: 0,
        // isolation_mode_total_debt: 0,
        liquidity_index: 1,
        id: 1,
        // variable_borrow_index: 5000000000,
        configuration: config,
    };
    // let ckbtc_principal = Principal::from_text("c2lt4-zmaaa-aaaaa-qaaiq-cai".to_string())
    //     .expect("Invalid ckbtc ledger principal");
    mutate_state(|state| {
        let reserve_data = &mut state.asset_index;
        // state.reserve_list.insert("ckbtc".to_string(), ckbtc_principal);
        reserve_data.insert(asset_name.clone(), Candid(data));
        ic_cdk::println!("Reserve for {} initialized successfully", asset_name);
    });
}
}
// pub fn initialize_reserve(reserve_key: String) -> Result<(), String> {
//     mutate_state(|state| {
//         let asset_index = &mut state.asset_index;
//         let reserve_data = asset_index.get(&reserve_key);

//         if let Some(reserve) = reserve_data {
//             if reserve.a_token_address != Principal::anonymous() {
//                 return Err("Reserve already initialized".to_string());
//             }
//         }

//         let mut data = &mut ReserveData;
//         data.last_update_timestamp = ic_cdk::api::time();
//         data.current_liquidity_rate = 10000000;
//         data.current_stable_borrow_rate = 8;
//         data.current_variable_borrow_rate = 4;
//         data.interest_rate_strategy_address = Some("strategy_address_example".to_string());
//         data.a_token_address = Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap();
//         data.stable_debt_token_address = Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap();
//         data.variable_debt_token_address = Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap();
//         data.accrued_to_treasury = 0;
//         data.unbacked = 0;
//         data.isolation_mode_total_debt = 0;
//         data.liquidity_index = 10000000000;
//         data.id = 1;
//         data.variable_borrow_index = 5000000000;

//         asset_index.insert(reserve_key.clone(), Candid(data));
//         ic_cdk::println!("Reserve initialized successfully");
        
//         Ok(())
//     })



// fn init_reserve(
//     reserve_key: String,
//     a_token_address: Principal,
//     stable_debt_token_address: Principal,
//     variable_debt_token_address: Principal,
//     interest_rate_strategy_address: Option<String>,
// ) -> Result<(), String> {
//     mutate_state(|state| {
//         let reserve_data = &mut state.asset_index;
//         let data = reserve_data.get(&reserve_key);
//         if let Some(reserve) = data {
//             if reserve.a_token_address != Principal::anonymous() {
//                 return Err("Reserve already initialized".to_string());
//             }
//         }
//         let mut reserve = ReserveData::default();
//         reserve.liquidity_index = WadRayMath::RAY;
//         reserve.variable_borrow_index = WadRayMath::RAY;
//         reserve.a_token_address = a_token_address;
//         reserve.stable_debt_token_address = stable_debt_token_address;
//         reserve.variable_debt_token_address = variable_debt_token_address;
//         reserve.interest_rate_strategy_address = interest_rate_strategy_address;
//         reserve_data.insert("ckbtc".to_string(), Candid(data));
//         // ic_cdk::println!("Reserve initialized successfully");
//         Ok(())
//     });
    

        

        
    
// #[query]
// pub async fn get_ckbtc_balance(backend_canister_principal: Principal) -> Result<Nat, String> {
//     // Set up the principal for the ckbtc ledger canister
//     let ckbtc_ledger_canister_principal = Principal::from_text("br5f7-7uaaa-aaaaa-qaaca-cai")
//         .map_err(|_| "Invalid ckbtc ledger canister ID".to_string())?;

//     // Create the account structure for the backend canister
//     let backend_account = TransferAccount {
//         owner: backend_canister_principal,
//         subaccount: None,
//     };

//     // Call the ckbtc ledger canister to get the balance of the backend canister
//     let (backend_balance,): (Nat,) = call(
//         ckbtc_ledger_canister_principal,
//         "icrc1_balance_of",
//         (backend_account,)
//     ).await
//     .map_err(|e| e.1)?;

//     ic_cdk::println!("Backend canister balance for ckbtc: {}", backend_balance);

//     Ok(backend_balance)
// }