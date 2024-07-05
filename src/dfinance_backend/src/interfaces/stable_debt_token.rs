use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct MintEvent {
    pub user: Principal,
    pub on_behalf_of: Principal,
    pub amount: u64,
    pub current_balance: u64,
    pub balance_increase: u64,
    pub new_rate: u64,
    pub avg_stable_rate: u64,
    pub new_total_supply: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct BurnEvent {
    pub from: Principal,
    pub amount: u64,
    pub current_balance: u64,
    pub balance_increase: u64,
    pub avg_stable_rate: u64,
    pub new_total_supply: u64,
}

pub trait IStableDebtToken {
    fn mint(
        &self,
        user: Principal,
        on_behalf_of: Principal,
        amount: u64,
        rate: u64,
    ) -> (bool, u64, u64);
    fn burn(&self, from: Principal, amount: u64) -> (u64, u64);
    fn get_average_stable_rate(&self) -> u64;
    fn get_user_stable_rate(&self, user: Principal) -> u64;
    fn get_user_last_updated(&self, user: Principal) -> u64;
    fn get_supply_data(&self) -> (u64, u64, u64, u64);
    fn get_total_supply_last_updated(&self) -> u64;
    fn get_total_supply_and_avg_rate(&self) -> (u64, u64);
    fn principal_balance_of(&self, user: Principal) -> u64;
    fn underlying_asset_address(&self) -> Principal;
}

pub struct StableDebtToken {
    pub underlying_asset_address: Principal,
    pub average_stable_rate: RefCell<u64>,
    pub total_supply: RefCell<u64>,
    pub supply_data: RefCell<(u64, u64, u64, u64)>,
    pub user_data: RefCell<std::collections::HashMap<Principal, (u64, u64, u64)>>,
}

impl StableDebtToken {
    pub fn new(underlying_asset_address: Principal) -> Self {
        Self {
            underlying_asset_address,
            average_stable_rate: RefCell::new(0),
            total_supply: RefCell::new(0),
            supply_data: RefCell::new((0, 0, 0, 0)),
            user_data: RefCell::new(std::collections::HashMap::new()),
        }
    }
}

impl IStableDebtToken for StableDebtToken {
    fn mint(
        &self,
        user: Principal,
        on_behalf_of: Principal,
        amount: u64,
        rate: u64,
    ) -> (bool, u64, u64) {
        // Update the user data and state accordingly
        let mut is_first_borrow = false;
        let mut user_entry = self.user_data.borrow_mut();
        let user_data = user_entry.entry(on_behalf_of).or_insert((0, 0, 0));
        if user_data.0 == 0 {
            is_first_borrow = true;
        }
        user_data.0 += amount;
        user_data.1 = rate;
        user_data.2 = ic_cdk::api::time();
        let total_stable_debt = *self.total_supply.borrow() + amount;
        let avg_stable_rate = (*self.average_stable_rate.borrow() * *self.total_supply.borrow()
            + rate * amount)
            / total_stable_debt;
        *self.total_supply.borrow_mut() = total_stable_debt;
        *self.average_stable_rate.borrow_mut() = avg_stable_rate;

        // Emit the Mint event
        let event = MintEvent {
            user,
            on_behalf_of,
            amount,
            current_balance: user_data.0,
            balance_increase: amount,
            new_rate: rate,
            avg_stable_rate,
            new_total_supply: total_stable_debt,
        };
        ic_cdk::println!("{:?}", event);

        (is_first_borrow, total_stable_debt, avg_stable_rate)
    }

    fn burn(&self, from: Principal, amount: u64) -> (u64, u64) {
        let mut user_entry = self.user_data.borrow_mut();
        let user_data = user_entry.entry(from).or_insert((0, 0, 0));
        user_data.0 -= amount;
        let total_stable_debt = *self.total_supply.borrow() - amount;
        let avg_stable_rate = *self.average_stable_rate.borrow();

        // Emit the Burn event
        let event = BurnEvent {
            from,
            amount,
            current_balance: user_data.0,
            balance_increase: amount,
            avg_stable_rate,
            new_total_supply: total_stable_debt,
        };
        ic_cdk::println!("{:?}", event);

        *self.total_supply.borrow_mut() = total_stable_debt;

        (total_stable_debt, avg_stable_rate)
    }

    fn get_average_stable_rate(&self) -> u64 {
        *self.average_stable_rate.borrow()
    }

    fn get_user_stable_rate(&self, user: Principal) -> u64 {
        self.user_data.borrow().get(&user).unwrap_or(&(0, 0, 0)).1
    }

    fn get_user_last_updated(&self, user: Principal) -> u64 {
        self.user_data.borrow().get(&user).unwrap_or(&(0, 0, 0)).2
    }

    fn get_supply_data(&self) -> (u64, u64, u64, u64) {
        *self.supply_data.borrow()
    }

    fn get_total_supply_last_updated(&self) -> u64 {
        self.get_supply_data().3
    }

    fn get_total_supply_and_avg_rate(&self) -> (u64, u64) {
        (
            *self.total_supply.borrow(),
            *self.average_stable_rate.borrow(),
        )
    }

    fn principal_balance_of(&self, user: Principal) -> u64 {
        self.user_data.borrow().get(&user).unwrap_or(&(0, 0, 0)).0
    }

    fn underlying_asset_address(&self) -> Principal {
        self.underlying_asset_address
    }
}
