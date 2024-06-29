use std::collections::HashMap;

pub trait IScaledBalanceToken {
    fn scaled_balance_of(&self, user: &str) -> u64;
    fn get_scaled_user_balance_and_supply(&self, user: &str) -> (u64, u64);
    fn scaled_total_supply(&self) -> u64;
    fn get_previous_index(&self, user: &str) -> u64;

    fn mint(&mut self, caller: &str, on_behalf_of: &str, value: u64, balance_increase: u64, index: u64);
    fn burn(&mut self, from: &str, target: &str, value: u64, balance_increase: u64, index: u64);
}

pub struct MockScaledBalanceToken {
    balances: HashMap<String, u64>,
    total_supply: u64,
    indices: HashMap<String, u64>,
}

impl MockScaledBalanceToken {
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
            total_supply: 0,
            indices: HashMap::new(),
        }
    }
}

impl IScaledBalanceToken for MockScaledBalanceToken {
    fn scaled_balance_of(&self, user: &str) -> u64 {
        *self.balances.get(user).unwrap_or(&0)
    }

    fn get_scaled_user_balance_and_supply(&self, user: &str) -> (u64, u64) {
        let balance = self.scaled_balance_of(user);
        (balance, self.total_supply)
    }

    fn scaled_total_supply(&self) -> u64 {
        self.total_supply
    }

    fn get_previous_index(&self, user: &str) -> u64 {
        *self.indices.get(user).unwrap_or(&0)
    }

    fn mint(&mut self, caller: &str, on_behalf_of: &str, value: u64, balance_increase: u64, index: u64) {
        let balance = self.balances.entry(on_behalf_of.to_string()).or_insert(0);
        *balance += value;
        self.total_supply += value;
        self.indices.insert(on_behalf_of.to_string(), index);

        println!(
            "Mint: caller={}, on_behalf_of={}, value={}, balance_increase={}, index={}",
            caller, on_behalf_of, value, balance_increase, index
        );
    }

    fn burn(&mut self, from: &str, target: &str, value: u64, balance_increase: u64, index: u64) {
        if let Some(balance) = self.balances.get_mut(from) {
            if *balance >= value {
                *balance -= value;
                self.total_supply -= value;
                self.indices.insert(from.to_string(), index);

                println!(
                    "Burn: from={}, target={}, value={}, balance_increase={}, index={}",
                    from, target, value, balance_increase, index
                );
            }
        }
    }
}

fn main() {
    let mut token = MockScaledBalanceToken::new();

    token.mint("caller1", "user1", 1000, 50, 1);
    token.mint("caller2", "user2", 500, 25, 1);

    println!("Scaled balance of user1: {}", token.scaled_balance_of("user1"));
    println!("Scaled total supply: {}", token.scaled_total_supply());

    let (balance, supply) = token.get_scaled_user_balance_and_supply("user1");
    println!("User1 balance: {}, Total supply: {}", balance, supply);

    token.burn("user1", "target1", 200, 10, 1);
    println!("Scaled balance of user1 after burn: {}", token.scaled_balance_of("user1"));
}
