// variable_debt_token.rs
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::debt_token_base::DebtTokenBase;
use crate::eip712_base::EIP712Base;
use crate::errors::*;
use crate::iaave_incentives_controller::IAaveIncentivesController;
use crate::ipool::IPool;
use crate::scaled_balance_token_base::*;
use crate::versioned_initializable::VersionedInitializable;
use crate::wad_ray_math::*;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct VariableDebtToken {
    pool: Principal,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: RefCell<u128>,
    user_state: RefCell<HashMap<Principal, UserState>>,
    incentives_controller: RefCell<Option<Principal>>,
    underlying_asset: Principal,
}

impl VariableDebtToken {
    pub fn new(pool: Principal, underlying_asset: Principal) -> Self {
        Self {
            pool,
            name: "VARIABLE_DEBT_TOKEN_IMPL".to_string(),
            symbol: "VARIABLE_DEBT_TOKEN_IMPL".to_string(),
            decimals: 0,
            total_supply: RefCell::new(0),
            user_state: RefCell::new(HashMap::new()),
            incentives_controller: RefCell::new(None),
            underlying_asset,
        }
    }

    pub fn initialize(
        &self,
        initializing_pool: Principal,
        underlying_asset: Principal,
        incentives_controller: Principal,
        debt_token_decimals: u8,
        debt_token_name: String,
        debt_token_symbol: String,
        params: Vec<u8>,
    ) {
        assert!(
            initializing_pool == self.pool,
            "{}",
            Errors::POOL_ADDRESSES_DO_NOT_MATCH
        );

        self.set_name(debt_token_name);
        self.set_symbol(debt_token_symbol);
        self.set_decimals(debt_token_decimals);

        self.underlying_asset = underlying_asset;
        *self.incentives_controller.borrow_mut() = Some(incentives_controller);

        // Emit Initialized event (log it in Rust)
        ic_cdk::println!("Initialized");
    }

    pub fn balance_of(&self, user: Principal) -> u128 {
        let scaled_balance = self.scaled_balance_of(user);

        if scaled_balance == 0 {
            return 0;
        }

        scaled_balance.ray_mul(self.get_reserve_normalized_variable_debt(self.underlying_asset))
    }

    pub fn mint(
        &self,
        user: Principal,
        on_behalf_of: Principal,
        amount: u128,
        index: u128,
    ) -> (bool, u128) {
        if user != on_behalf_of {
            self.decrease_borrow_allowance(on_behalf_of, user, amount);
        }
        (
            self.mint_scaled(user, on_behalf_of, amount, index),
            self.scaled_total_supply(),
        )
    }

    pub fn burn(&self, from: Principal, amount: u128, index: u128) -> u128 {
        self.burn_scaled(from, Principal::anonymous(), amount, index);
        self.scaled_total_supply()
    }

    pub fn total_supply(&self) -> u128 {
        self.super_total_supply()
            .ray_mul(self.get_reserve_normalized_variable_debt(self.underlying_asset))
    }

    pub fn underlying_asset_address(&self) -> Principal {
        self.underlying_asset
    }

    fn set_name(&self, name: String) {
        self.name = name;
    }

    fn set_symbol(&self, symbol: String) {
        self.symbol = symbol;
    }

    fn set_decimals(&self, decimals: u8) {
        self.decimals = decimals;
    }

    fn get_reserve_normalized_variable_debt(&self, asset: Principal) -> u128 {
        // This function should interact with the pool to get the reserve normalized variable debt.
        // Placeholder implementation
        1
    }

    fn decrease_borrow_allowance(&self, on_behalf_of: Principal, user: Principal, amount: u128) {
        // Implement decrease borrow allowance logic
    }

    fn mint_scaled(
        &self,
        user: Principal,
        on_behalf_of: Principal,
        amount: u128,
        index: u128,
    ) -> bool {
        // Implement mint scaled logic
        true
    }

    fn burn_scaled(&self, from: Principal, target: Principal, amount: u128, index: u128) {
        // Implement burn scaled logic
    }

    fn scaled_balance_of(&self, user: Principal) -> u128 {
        // Implement scaled balance of logic
        0
    }

    fn scaled_total_supply(&self) -> u128 {
        // Implement scaled total supply logic
        0
    }

    fn super_total_supply(&self) -> u128 {
        // Implement total supply retrieval logic from the super class
        0
    }
}
