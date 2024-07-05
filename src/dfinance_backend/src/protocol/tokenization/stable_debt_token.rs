// stable_debt_token.rs
use crate::errors::*;
use crate::iaave_incentives_controller::IAaveIncentivesController;
use crate::ipool::IPool;
use crate::math_utils::*;
use crate::mintable_incentivized_erc20::*;
use crate::wad_ray_math::*;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UserState {
    balance: u128,
    additional_data: u128,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct StableDebtToken {
    pool: Principal,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: RefCell<u128>,
    user_state: RefCell<HashMap<Principal, UserState>>,
    incentives_controller: RefCell<Option<Principal>>,
    avg_stable_rate: RefCell<u128>,
    timestamps: RefCell<HashMap<Principal, u40>>,
    total_supply_timestamp: RefCell<u40>,
    underlying_asset: Principal,
}

impl StableDebtToken {
    pub fn new(
        pool: Principal,
        name: String,
        symbol: String,
        decimals: u8,
        underlying_asset: Principal,
    ) -> Self {
        Self {
            pool,
            name,
            symbol,
            decimals,
            total_supply: RefCell::new(0),
            user_state: RefCell::new(HashMap::new()),
            incentives_controller: RefCell::new(None),
            avg_stable_rate: RefCell::new(0),
            timestamps: RefCell::new(HashMap::new()),
            total_supply_timestamp: RefCell::new(0),
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

        *self.underlying_asset.borrow_mut() = underlying_asset;
        *self.incentives_controller.borrow_mut() = Some(incentives_controller);

        self.domain_separator = self.calculate_domain_separator();

        // Emit Initialized event (log it in Rust)
        ic_cdk::println!("Initialized");
    }

    pub fn get_average_stable_rate(&self) -> u128 {
        *self.avg_stable_rate.borrow()
    }

    pub fn get_user_last_updated(&self, user: Principal) -> u40 {
        *self.timestamps.borrow().get(&user).unwrap_or(&0)
    }

    pub fn get_user_stable_rate(&self, user: Principal) -> u128 {
        self.user_state
            .borrow()
            .get(&user)
            .map_or(0, |state| state.additional_data)
    }

    pub fn balance_of(&self, account: Principal) -> u128 {
        let account_balance = self.super_balance_of(account);
        let stable_rate = self
            .user_state
            .borrow()
            .get(&account)
            .map_or(0, |state| state.additional_data);
        if account_balance == 0 {
            return 0;
        }
        let cumulated_interest = MathUtils::calculate_compounded_interest(
            avg_rate,
            *self.total_supply_timestamp.borrow(),
            current_timestamp,
        )
        .unwrap_or(0);
        account_balance.ray_mul(cumulated_interest)
    }

    pub fn mint(
        &self,
        user: Principal,
        on_behalf_of: Principal,
        amount: u128,
        rate: u128,
    ) -> (bool, u128, u128) {
        let mut vars = MintLocalVars {
            previous_supply: self.total_supply(),
            next_supply: 0,
            amount_in_ray: amount.wad_to_ray(),
            current_stable_rate: 0,
            next_stable_rate: 0,
            current_avg_stable_rate: *self.avg_stable_rate.borrow(),
        };

        if user != on_behalf_of {
            self.decrease_borrow_allowance(on_behalf_of, user, amount);
        }

        let (_, current_balance, balance_increase) = self.calculate_balance_increase(on_behalf_of);

        vars.next_supply = vars.previous_supply + amount;

        vars.current_stable_rate = self
            .user_state
            .borrow()
            .get(&on_behalf_of)
            .map_or(0, |state| state.additional_data);
        vars.next_stable_rate = (vars
            .current_stable_rate
            .ray_mul(current_balance.wad_to_ray())
            + vars.amount_in_ray.ray_mul(rate))
        .ray_div((current_balance + amount).wad_to_ray());

        self.user_state
            .borrow_mut()
            .get_mut(&on_behalf_of)
            .unwrap()
            .additional_data = vars.next_stable_rate;

        self.timestamps
            .borrow_mut()
            .insert(on_behalf_of, ic_cdk::api::time() as u40);

        vars.current_avg_stable_rate = (vars
            .current_avg_stable_rate
            .ray_mul(vars.previous_supply.wad_to_ray())
            + rate.ray_mul(vars.amount_in_ray))
        .ray_div(vars.next_supply.wad_to_ray());

        self.avg_stable_rate.replace(vars.current_avg_stable_rate);

        let amount_to_mint = amount + balance_increase;
        self.mint_tokens(on_behalf_of, amount_to_mint, vars.previous_supply);

        // Emit Transfer and Mint events (log them in Rust)
        ic_cdk::println!(
            "Transfer event: {} -> {}: {}",
            Principal::anonymous(),
            on_behalf_of,
            amount_to_mint
        );
        ic_cdk::println!(
            "Mint event: {} -> {}: {}",
            user,
            on_behalf_of,
            amount_to_mint
        );

        (
            current_balance == 0,
            vars.next_supply,
            vars.current_avg_stable_rate,
        )
    }

    pub fn burn(&self, from: Principal, amount: u128) -> (u128, u128) {
        let (_, current_balance, balance_increase) = self.calculate_balance_increase(from);

        let previous_supply = self.total_supply();
        let next_avg_stable_rate;
        let next_supply;
        let user_stable_rate = self
            .user_state
            .borrow()
            .get(&from)
            .map_or(0, |state| state.additional_data);

        if previous_supply <= amount {
            self.avg_stable_rate.replace(0);
            self.total_supply.replace(0);
        } else {
            next_supply = previous_supply - amount;
            let first_term = self
                .avg_stable_rate
                .borrow()
                .ray_mul(previous_supply.wad_to_ray());
            let second_term = user_stable_rate.ray_mul(amount.wad_to_ray());

            if second_term >= first_term {
                next_avg_stable_rate = 0;
                self.total_supply.replace(0);
                self.avg_stable_rate.replace(0);
            } else {
                next_avg_stable_rate = (first_term - second_term).ray_div(next_supply.wad_to_ray());
                self.avg_stable_rate.replace(next_avg_stable_rate);
                self.total_supply.replace(next_supply);
            }
        }

        if amount == current_balance {
            self.user_state
                .borrow_mut()
                .get_mut(&from)
                .unwrap()
                .additional_data = 0;
            self.timestamps.borrow_mut().remove(&from);
        } else {
            self.timestamps
                .borrow_mut()
                .insert(from, ic_cdk::api::time() as u40);
        }
        self.total_supply_timestamp
            .replace(ic_cdk::api::time() as u40);

        if balance_increase > amount {
            let amount_to_mint = balance_increase - amount;
            self.mint_tokens(from, amount_to_mint, previous_supply);
            // Emit Transfer and Mint events (log them in Rust)
            ic_cdk::println!(
                "Transfer event: {} -> {}: {}",
                Principal::anonymous(),
                from,
                amount_to_mint
            );
            ic_cdk::println!("Mint event: {} -> {}: {}", from, from, amount_to_mint);
        } else {
            let amount_to_burn = amount - balance_increase;
            self.burn_tokens(from, amount_to_burn, previous_supply);
            // Emit Transfer and Burn events (log them in Rust)
            ic_cdk::println!(
                "Transfer event: {} -> {}: {}",
                from,
                Principal::anonymous(),
                amount_to_burn
            );
            ic_cdk::println!("Burn event: {} -> {}: {}", from, amount_to_burn);
        }

        (next_supply, next_avg_stable_rate)
    }

    fn calculate_balance_increase(&self, user: Principal) -> (u128, u128, u128) {
        let previous_principal_balance = self.super_balance_of(user);

        if previous_principal_balance == 0 {
            return (0, 0, 0);
        }

        let new_principal_balance = self.balance_of(user);

        (
            previous_principal_balance,
            new_principal_balance,
            new_principal_balance - previous_principal_balance,
        )
    }

    pub fn get_supply_data(&self) -> (u128, u128, u128, u40) {
        let avg_rate = *self.avg_stable_rate.borrow();
        (
            self.super_total_supply(),
            self.calc_total_supply(avg_rate),
            avg_rate,
            *self.total_supply_timestamp.borrow(),
        )
    }

    pub fn get_total_supply_and_avg_rate(&self) -> (u128, u128) {
        let avg_rate = *self.avg_stable_rate.borrow();
        (self.calc_total_supply(avg_rate), avg_rate)
    }

    pub fn total_supply(&self) -> u128 {
        self.calc_total_supply(*self.avg_stable_rate.borrow())
    }

    pub fn get_total_supply_last_updated(&self) -> u40 {
        *self.total_supply_timestamp.borrow()
    }

    pub fn principal_balance_of(&self, user: Principal) -> u128 {
        self.super_balance_of(user)
    }

    pub fn underlying_asset_address(&self) -> Principal {
        self.underlying_asset
    }

    fn calc_total_supply(&self, avg_rate: u128) -> u128 {
        let principal_supply = self.super_total_supply();

        if principal_supply == 0 {
            return 0;
        }

        let cumulated_interest = MathUtils::calculate_compounded_interest_current(
            avg_rate,
            *self.total_supply_timestamp.borrow(),
        )
        .unwrap_or(0);

        principal_supply.ray_mul(cumulated_interest)
    }

    fn mint_tokens(&self, account: Principal, amount: u128, old_total_supply: u128) {
        let cast_amount = amount.to_u128();
        let old_account_balance = self
            .user_state
            .borrow()
            .get(&account)
            .map_or(0, |state| state.balance);
        self.user_state
            .borrow_mut()
            .get_mut(&account)
            .unwrap()
            .balance = old_account_balance + cast_amount;

        if let Some(incentives_controller) = &*self.incentives_controller.borrow() {
            IAaveIncentivesController::handle_action(
                incentives_controller.clone(),
                account,
                old_total_supply,
                old_account_balance,
            );
        }
    }

    fn burn_tokens(&self, account: Principal, amount: u128, old_total_supply: u128) {
        let cast_amount = amount.to_u128();
        let old_account_balance = self
            .user_state
            .borrow()
            .get(&account)
            .map_or(0, |state| state.balance);
        self.user_state
            .borrow_mut()
            .get_mut(&account)
            .unwrap()
            .balance = old_account_balance - cast_amount;

        if let Some(incentives_controller) = &*self.incentives_controller.borrow() {
            IAaveIncentivesController::handle_action(
                incentives_controller.clone(),
                account,
                old_total_supply,
                old_account_balance,
            );
        }
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

    fn decrease_borrow_allowance(&self, on_behalf_of: Principal, user: Principal, amount: u128) {
        // Implement decrease borrow allowance logic
    }

    fn super_balance_of(&self, account: Principal) -> u128 {
        // Implement balance retrieval logic from the super class
    }

    fn super_total_supply(&self) -> u128 {
        // Implement total supply retrieval logic from the super class
    }
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
struct MintLocalVars {
    previous_supply: u128,
    next_supply: u128,
    amount_in_ray: u128,
    current_stable_rate: u128,
    next_stable_rate: u128,
    current_avg_stable_rate: u128,
}
