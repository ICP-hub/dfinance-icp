// Define ICRC1 trait for the ledger interface
pub trait ICRC1 {
    fn total_supply(&self) -> u64;
    fn balance_of(&self, account: &str) -> u64;
    fn transfer(&mut self, from: &str, to: &str, amount: u64) -> bool;
    fn allowance(&self, owner: &str, spender: &str) -> u64;
    fn approve(&mut self, owner: &str, spender: &str, amount: u64) -> bool;
    fn transfer_from(&mut self, sender: &str, recipient: &str, amount: u64) -> bool;
}

// Simple implementation of the ICRC1 interface
pub struct Token {
    total_supply: u64,
    balances: HashMap<String, u64>,
    allowances: HashMap<(String, String), u64>,
}

impl Token {
    pub fn new(total_supply: u64) -> Self {
        let mut balances = HashMap::new();
        balances.insert("owner".to_string(), total_supply); // Initial balance to the owner
        Self {
            total_supply,
            balances,
            allowances: HashMap::new(),
        }
    }
}

impl ICRC1 for Token {
    fn total_supply(&self) -> u64 {
        self.total_supply
    }

    fn balance_of(&self, account: &str) -> u64 {
        *self.balances.get(account).unwrap_or(&0)
    }

    fn transfer(&mut self, from: &str, to: &str, amount: u64) -> bool {
        let from_balance = self.balances.entry(from.to_string()).or_insert(0);
        if *from_balance < amount {
            return false;
        }
        *from_balance -= amount;
        let to_balance = self.balances.entry(to.to_string()).or_insert(0);
        *to_balance += amount;
        true
    }

    fn allowance(&self, owner: &str, spender: &str) -> u64 {
        *self.allowances.get(&(owner.to_string(), spender.to_string())).unwrap_or(&0)
    }

    fn approve(&mut self, owner: &str, spender: &str, amount: u64) -> bool {
        self.allowances.insert((owner.to_string(), spender.to_string()), amount);
        true
    }

    fn transfer_from(&mut self, sender: &str, recipient: &str, amount: u64) -> bool {
        let allowance = self.allowance(sender, recipient);
        if allowance < amount {
            return false;
        }
        let sender_balance = self.balances.entry(sender.to_string()).or_insert(0);
        if *sender_balance < amount {
            return false;
        }
        *sender_balance -= amount;
        let recipient_balance = self.balances.entry(recipient.to_string()).or_insert(0);
        *recipient_balance += amount;
        self.allowances.insert((sender.to_string(), recipient.to_string()), allowance - amount);
        true
    }
}

fn main() {
    let mut token = Token::new(1_000_000);

    // Example usage
    println!("Total supply: {}", token.total_supply());
    println!("Balance of owner: {}", token.balance_of("owner"));

    token.transfer("owner", "user1", 500);
    println!("Balance of user1 after transfer: {}", token.balance_of("user1"));

    token.approve("user1", "user2", 200);
    println!("Allowance of user2 to spend from user1: {}", token.allowance("user1", "user2"));

    token.transfer_from("user1", "user2", 100);
    println!("Balance of user2 after transfer_from: {}", token.balance_of("user2"));
}
