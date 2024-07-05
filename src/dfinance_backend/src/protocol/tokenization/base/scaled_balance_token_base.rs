// scaled_balance_token_base.rs
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::errors::*;
use crate::iaave_incentives_controller::IAaveIncentivesController;
use crate::ipool::IPool;
use crate::iscaled_balance_token::IScaledBalanceToken;
use crate::mintable_incentivized_erc20::*;
use crate::wad_ray_math::*;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UserState {
    balance: u128,
    additional_data: u128,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ScaledBalanceTokenBase {
    pool: Principal,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: RefCell<u128>,
    user_state: RefCell<HashMap<Principal, UserState>>,
    incentives_controller: RefCell<Option<Principal>>,
}

impl ScaledBalanceTokenBase {
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

    pub fn scaled_balance_of(&self, user: Principal) -> u128 {
        self.user_state
            .borrow()
            .get(&user)
            .map_or(0, |state| state.balance)
    }

    pub fn get_scaled_user_balance_and_supply(&self, user: Principal) -> (u128, u128) {
        (self.scaled_balance_of(user), *self.total_supply.borrow())
    }

    pub fn scaled_total_supply(&self) -> u128 {
        *self.total_supply.borrow()
    }

    pub fn get_previous_index(&self, user: Principal) -> u128 {
        self.user_state
            .borrow()
            .get(&user)
            .map_or(0, |state| state.additional_data)
    }

    pub fn mint_scaled(
        &self,
        caller: Principal,
        on_behalf_of: Principal,
        amount: u128,
        index: u128,
    ) -> bool {
        let amount_scaled = amount.ray_div(index);
        if amount_scaled == 0 {
            panic!("{}", Errors::INVALID_MINT_AMOUNT);
        }

        let scaled_balance = self.scaled_balance_of(on_behalf_of);
        let balance_increase = scaled_balance.ray_mul(index)
            - scaled_balance.ray_mul(self.get_previous_index(on_behalf_of));

        self.user_state
            .borrow_mut()
            .entry(on_behalf_of)
            .or_default()
            .additional_data = index;

        self.mint(on_behalf_of, amount_scaled);

        let amount_to_mint = amount + balance_increase;
        self.emit_transfer(None, Some(on_behalf_of), amount_to_mint);
        self.emit_mint(
            caller,
            on_behalf_of,
            amount_to_mint,
            balance_increase,
            index,
        );

        scaled_balance == 0
    }

    pub fn burn_scaled(&self, user: Principal, target: Principal, amount: u128, index: u128) {
        let amount_scaled = amount.ray_div(index);
        if amount_scaled == 0 {
            panic!("{}", Errors::INVALID_BURN_AMOUNT);
        }

        let scaled_balance = self.scaled_balance_of(user);
        let balance_increase =
            scaled_balance.ray_mul(index) - scaled_balance.ray_mul(self.get_previous_index(user));

        self.user_state
            .borrow_mut()
            .entry(user)
            .or_default()
            .additional_data = index;

        self.burn(user, amount_scaled);

        if balance_increase > amount {
            let amount_to_mint = balance_increase - amount;
            self.emit_transfer(None, Some(user), amount_to_mint);
            self.emit_mint(user, user, amount_to_mint, balance_increase, index);
        } else {
            let amount_to_burn = amount - balance_increase;
            self.emit_transfer(Some(user), None, amount_to_burn);
            self.emit_burn(user, target, amount_to_burn, balance_increase, index);
        }
    }

    pub fn transfer(&self, sender: Principal, recipient: Principal, amount: u128, index: u128) {
        let sender_scaled_balance = self.scaled_balance_of(sender);
        let sender_balance_increase = sender_scaled_balance.ray_mul(index)
            - sender_scaled_balance.ray_mul(self.get_previous_index(sender));

        let recipient_scaled_balance = self.scaled_balance_of(recipient);
        let recipient_balance_increase = recipient_scaled_balance.ray_mul(index)
            - recipient_scaled_balance.ray_mul(self.get_previous_index(recipient));

        self.user_state
            .borrow_mut()
            .entry(sender)
            .or_default()
            .additional_data = index;
        self.user_state
            .borrow_mut()
            .entry(recipient)
            .or_default()
            .additional_data = index;

        self._transfer(sender, recipient, amount.ray_div(index));

        if sender_balance_increase > 0 {
            self.emit_transfer(None, Some(sender), sender_balance_increase);
            self.emit_mint(
                self._msg_sender(),
                sender,
                sender_balance_increase,
                sender_balance_increase,
                index,
            );
        }

        if sender != recipient && recipient_balance_increase > 0 {
            self.emit_transfer(None, Some(recipient), recipient_balance_increase);
            self.emit_mint(
                self._msg_sender(),
                recipient,
                recipient_balance_increase,
                recipient_balance_increase,
                index,
            );
        }

        self.emit_transfer(Some(sender), Some(recipient), amount);
    }

    fn mint(&self, account: Principal, amount: u128) {
        let old_total_supply = *self.total_supply.borrow();
        *self.total_supply.borrow_mut() = old_total_supply + amount;

        let mut user_state = self.user_state.borrow_mut();
        let old_account_balance = user_state
            .entry(account)
            .or_insert(UserState {
                balance: 0,
                additional_data: 0,
            })
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

    fn burn(&self, account: Principal, amount: u128) {
        let old_total_supply = *self.total_supply.borrow();
        *self.total_supply.borrow_mut() = old_total_supply - amount;

        let mut user_state = self.user_state.borrow_mut();
        let old_account_balance = user_state
            .entry(account)
            .or_insert(UserState {
                balance: 0,
                additional_data: 0,
            })
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

    fn _transfer(&self, sender: Principal, recipient: Principal, amount: u128) {
        let mut user_state = self.user_state.borrow_mut();
        let sender_balance = user_state.get_mut(&sender).unwrap().balance;
        let recipient_balance = user_state
            .entry(recipient)
            .or_insert(UserState {
                balance: 0,
                additional_data: 0,
            })
            .balance;

        user_state.get_mut(&sender).unwrap().balance = sender_balance - amount;
        user_state.get_mut(&recipient).unwrap().balance = recipient_balance + amount;
    }

    fn _msg_sender(&self) -> Principal {
        ic_cdk::api::caller()
    }

    fn emit_transfer(&self, from: Option<Principal>, to: Option<Principal>, amount: u128) {
        // Emit transfer event
        // In Rust/ICP, you can log or handle event-like behavior as needed.
    }

    fn emit_mint(
        &self,
        caller: Principal,
        on_behalf_of: Principal,
        amount: u128,
        balance_increase: u128,
        index: u128,
    ) {
        // Emit mint event
        // In Rust/ICP, you can log or handle event-like behavior as needed.
    }
}
