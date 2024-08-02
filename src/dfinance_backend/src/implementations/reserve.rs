use crate::{
    api::state_handler::mutate_state,
    declarations::{assets::ReserveData, storable::Candid},
    protocol::configuration::reserve_configuration::ReserveConfiguration,
};

use candid::Principal;
use ic_cdk::update;

#[update]
pub fn initialize_reserve() {
    let config = ReserveConfiguration::initialize(
        5000,    // ltv
        7500,    // liquidation_threshold
        500,     // liquidation_bonus
        18,      // decimals
        true,    // active
        false,   // frozen
        true,    // borrowing_enabled
        true,    // stable_borrowing_enabled
        false,   // paused
        true,    // borrowable_in_isolation
        false,   // siloed_borrowing
        true,    // flashloan_enabled
        2000,    // reserve_factor
        100000,  // borrow_cap
        100000,  // supply_cap
        100,     // liquidation_protocol_fee
        1,       // emode_category
        50000,   // unbacked_mint_cap
        1000000  // debt_ceiling
    );
    let data = ReserveData {
        last_update_timestamp: ic_cdk::api::time(),
        current_liquidity_rate: 10000000,
        current_stable_borrow_rate: 8,
        current_variable_borrow_rate: 4,
        interest_rate_strategy_address: Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap(),
        a_token_address: Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap(),
        stable_debt_token_address: 
            Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        variable_debt_token_address: 
            Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        accrued_to_treasury: 0,
        unbacked: 0,
        isolation_mode_total_debt: 0,
        liquidity_index: 10000000000,
        id: 1,
        variable_borrow_index: 5000000000,
        configuration: config,
    };

    mutate_state(|state| {
        let reserve_data = &mut state.asset_index;
        reserve_data.insert("ckbtc".to_string(), Candid(data));
        ic_cdk::println!("Reserve initialized successfully");
    });
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
    

        

        
    


