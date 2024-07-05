// mintable_incentivized_erc20.rs
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::iaave_incentives_controller::IAaveIncentivesController;
use crate::incentivized_erc20::*;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct MintableIncentivizedERC20 {
    pool: Principal,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: RefCell<u128>,
    user_state: RefCell<HashMap<Principal, UserState>>,
    incentives_controller: RefCell<Option<Principal>>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UserState {
    balance: u128,
}

impl MintableIncentivizedERC20 {
    pub fn new(pool: Principal, name: String, symbol: String, decimals: u8) -> Self {
        Self {
            pool,
            name,
            symbol,
            decimals,
            total_supply: RefCell::new(0),
            user_state: RefCell::new(HashMap::new()),
            incentives_controller: RefCell::new(None),
        }
    }

    pub fn mint(&self, account: Principal, amount: u128) {
        let old_total_supply = *self.total_supply.borrow();
        *self.total_supply.borrow_mut() = old_total_supply + amount;

        let mut user_state = self.user_state.borrow_mut();
        let old_account_balance = user_state
            .entry(account)
            .or_insert(UserState { balance: 0 })
            .balance;
        user_state.get_mut(&account).unwrap().balance = old_account_balance + amount;

        if let Some(incentives_controller) = &*self.incentives_controller.borrow() {
            IAaveIncentivesController::handle_action(
                incentives_controller.clone(),
                account,
                old_total_supply,
                old_account_balance,
            );
        }
    }

    pub fn burn(&self, account: Principal, amount: u128) {
        let old_total_supply = *self.total_supply.borrow();
        *self.total_supply.borrow_mut() = old_total_supply - amount;

        let mut user_state = self.user_state.borrow_mut();
        let old_account_balance = user_state
            .entry(account)
            .or_insert(UserState { balance: 0 })
            .balance;
        user_state.get_mut(&account).unwrap().balance = old_account_balance - amount;

        if let Some(incentives_controller) = &*self.incentives_controller.borrow() {
            IAaveIncentivesController::handle_action(
                incentives_controller.clone(),
                account,
                old_total_supply,
                old_account_balance,
            );
        }
    }
}
