use std::collections::HashMap;

pub trait ICRC2 {
    fn transfer(&self, to: &str, value: u64) -> Result<(), String>;
    fn transfer_from(&self, from: &str, to: &str, value: u64) -> Result<(), String>;
    fn balance_of(&self, account: &str) -> u64;
    fn allowance(&self, owner: &str, spender: &str) -> u64;
    fn approve(&mut self, owner: &str, spender: &str, value: u64) -> bool;
}

pub struct Token {
    balances: HashMap<String, u64>,
    allowances: HashMap<(String, String), u64>,
}

impl Token {
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
            allowances: HashMap::new(),
        }
    }
}

impl ICRC2 for Token {
    fn transfer(&self, to: &str, value: u64) -> Result<(), String> {
        let sender_balance = self.balances.get("sender").unwrap_or(&0);
        if *sender_balance < value {
            return Err("GPv2: failed transfer".to_string());
        }
        Ok(())
    }

    fn transfer_from(&self, from: &str, to: &str, value: u64) -> Result<(), String> {
        let allowance = self.allowance(from, "sender");
        let from_balance = self.balances.get(from).unwrap_or(&0);

        if allowance < value || *from_balance < value {
            return Err("GPv2: failed transferFrom".to_string());
        }
        Ok(())
    }

    fn balance_of(&self, account: &str) -> u64 {
        *self.balances.get(account).unwrap_or(&0)
    }

    fn allowance(&self, owner: &str, spender: &str) -> u64 {
        *self.allowances.get(&(owner.to_string(), spender.to_string())).unwrap_or(&0)
    }

    fn approve(&mut self, owner: &str, spender: &str, value: u64) -> bool {
        self.allowances.insert((owner.to_string(), spender.to_string()), value);
        true
    }
}

pub mod gpv2_safe_icrc2 {
    use super::ICRC2;
    use super::Token;

    pub fn safe_transfer(token: &Token, to: &str, value: u64) -> Result<(), String> {
        match token.transfer(to, value) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("GPv2: {}", err)),
        }
    }

    pub fn safe_transfer_from(token: &Token, from: &str, to: &str, value: u64) -> Result<(), String> {
        match token.transfer_from(from, to, value) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("GPv2: {}", err)),
        }
    }
}

fn main() {
    let mut token = Token::new();
    token.approve("owner", "spender", 1000);

    match gpv2_safe_icrc2::safe_transfer(&token, "recipient", 500) {
        Ok(_) => println!("Transfer successful"),
        Err(err) => println!("{}", err),
    }

    match gpv2_safe_icrc2::safe_transfer_from(&token, "owner", "recipient", 500) {
        Ok(_) => println!("TransferFrom successful"),
        Err(err) => println!("{}", err),
    }
}
