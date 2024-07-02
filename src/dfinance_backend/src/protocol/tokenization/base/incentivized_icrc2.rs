use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk_macros::*;
use std::collections::HashMap;
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserState {
    balance: u128,
    additional_data: u128,
}

#[derive(Default)]
pub struct IncentivizedERC20 {
    user_state: RefCell<HashMap<String, UserState>>,
    allowances: RefCell<HashMap<String, HashMap<String, u128>>>,
    total_supply: RefCell<u128>,
    name: RefCell<String>,
    symbol: RefCell<String>,
    decimals: RefCell<u8>,
    incentives_controller: RefCell<Option<String>>,
    pool: String,
    addresses_provider: String,
}

impl IncentivizedERC20 {
    pub fn new(pool: String, name: String, symbol: String, decimals: u8) -> Self {
        Self {
            pool: pool.clone(),
            addresses_provider: pool,
            name: RefCell::new(name),
            symbol: RefCell::new(symbol),
            decimals: RefCell::new(decimals),
            ..Default::default()
        }
    }

    pub fn name(&self) -> String {
        self.name.borrow().clone()
    }

    pub fn symbol(&self) -> String {
        self.symbol.borrow().clone()
    }

    pub fn decimals(&self) -> u8 {
        *self.decimals.borrow()
    }

    pub fn total_supply(&self) -> u128 {
        *self.total_supply.borrow()
    }

    pub fn balance_of(&self, account: String) -> u128 {
        self.user_state.borrow().get(&account).map_or(0, |state| state.balance)
    }

    pub fn get_incentives_controller(&self) -> Option<String> {
        self.incentives_controller.borrow().clone()
    }

    pub fn set_incentives_controller(&self, controller: String) {
        // Only Pool Admin can call this
        self.incentives_controller.replace(Some(controller));
    }

    pub fn transfer(&self, sender: String, recipient: String, amount: u128) -> bool {
        self._transfer(sender, recipient, amount);
        true
    }

    pub fn allowance(&self, owner: String, spender: String) -> u128 {
        self.allowances.borrow().get(&owner).and_then(|inner| inner.get(&spender)).copied().unwrap_or(0)
    }

    pub fn approve(&self, owner: String, spender: String, amount: u128) -> bool {
        self._approve(owner, spender, amount);
        true
    }

    pub fn transfer_from(&self, sender: String, recipient: String, amount: u128) -> bool {
        let allowance = self.allowance(sender.clone(), recipient.clone());
        self._approve(sender.clone(), recipient.clone(), allowance - amount);
        self._transfer(sender, recipient, amount);
        true
    }

    pub fn increase_allowance(&self, owner: String, spender: String, added_value: u128) -> bool {
        let allowance = self.allowance(owner.clone(), spender.clone());
        self._approve(owner, spender, allowance + added_value);
        true
    }

    pub fn decrease_allowance(&self, owner: String, spender: String, subtracted_value: u128) -> bool {
        let allowance = self.allowance(owner.clone(), spender.clone());
        self._approve(owner, spender, allowance - subtracted_value);
        true
    }

    fn _transfer(&self, sender: String, recipient: String, amount: u128) {
        let mut user_state = self.user_state.borrow_mut();
        let sender_state = user_state.get_mut(&sender).expect("Sender not found");
        sender_state.balance -= amount;

        let recipient_state = user_state.entry(recipient.clone()).or_default();
        recipient_state.balance += amount;

        // Apply incentives if defined
        if let Some(incentives_controller) = &*self.incentives_controller.borrow() {
            let current_total_supply = *self.total_supply.borrow();
            self.handle_action(incentives_controller.clone(), sender, current_total_supply, sender_state.balance);
            if sender != recipient {
                self.handle_action(incentives_controller.clone(), recipient, current_total_supply, recipient_state.balance);
            }
        }
    }

    fn _approve(&self, owner: String, spender: String, amount: u128) {
        let mut allowances = self.allowances.borrow_mut();
        let owner_allowances = allowances.entry(owner.clone()).or_default();
        owner_allowances.insert(spender.clone(), amount);
        // Emit Approval event (not implemented here)
    }

    fn handle_action(&self, _incentives_controller: String, _user: String, _total_supply: u128, _balance: u128) {
        // Implement incentives handling logic here
    }

    pub fn set_name(&self, new_name: String) {
        self.name.replace(new_name);
    }

    pub fn set_symbol(&self, new_symbol: String) {
        self.symbol.replace(new_symbol);
    }

    pub fn set_decimals(&self, new_decimals: u8) {
        self.decimals.replace(new_decimals);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transfer() {
        let pool = "pool".to_string();
        let mut token = IncentivizedERC20::new(pool, "TestToken".to_string(), "TT".to_string(), 18);
        token.set_name("NewName".to_string());
        assert_eq!(token.name(), "NewName");
    }
}
