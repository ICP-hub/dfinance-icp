use crate::{
    api::state_handler::mutate_state,
    declarations::{assets::ReserveData, storable::Candid},
};

use candid::Principal;
pub fn initialize_reserve() {
    let data = ReserveData {
        last_update_timestamp: Some(ic_cdk::api::time()),
        current_liquidity_rate: Some(10000000),
        current_stable_borrow_rate: Some(8),
        current_variable_borrow_rate: Some(4),
        interest_rate_strategy_address: None,
        d_token_canister: Some(Principal::from_text("hbrpn-74aaa-aaaaa-qaaxq-cai").unwrap()),
        stable_debt_token_canister: Some(
            Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        ),
        variable_debt_token_canister: Some(
            Principal::from_text("fsomn-xeaaa-aaaaa-qaaza-cai").unwrap(),
        ),
        liquidity_index: Some(10000000000),
        id: 1,
        variable_borrow_index: Some(5000000000),
    };

    mutate_state(|state| {
        let reserve_data = &mut state.asset_index;
        reserve_data.insert("ckbtc".to_string(), Candid(data));
        ic_cdk::println!("Reserve initialized successfully");
    });
}
