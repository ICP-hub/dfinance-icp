use std::collections::HashMap;

pub trait IAToken {
    fn balance_transfer(&self, from: &str, to: &str, value: u64, index: u64);
    fn mint(&mut self, caller: &str, on_behalf_of: &str, amount: u64, index: u64) -> bool;
    fn burn(&mut self, from: &str, receiver_of_underlying: &str, amount: u64, index: u64);
    fn mint_to_treasury(&mut self, amount: u64, index: u64);
    fn transfer_on_liquidation(&mut self, from: &str, to: &str, value: u64);
    fn transfer_underlying_to(&mut self, target: &str, amount: u64);
    fn handle_repayment(&mut self, user: &str, on_behalf_of: &str, amount: u64);
    fn permit(&mut self, owner: &str, spender: &str, value: u64, deadline: u64, v: u8, s: &[u8; 32], r: &[u8; 32]);
    fn underlying_asset_address(&self) -> &str;
    fn reserve_treasury_address(&self) -> &str;
    fn domain_separator(&self) -> [u8; 32];
    fn nonces(&self, owner: &str) -> u64;
    fn rescue_tokens(&mut self, token: &str, to: &str, amount: u64);
}

pub struct MockAToken {
    balances: HashMap<String, u64>,
    allowances: HashMap<(String, String), u64>,
    nonces: HashMap<String, u64>,
    underlying_asset: String,
    reserve_treasury: String,
    domain_separator: [u8; 32],
}

impl MockAToken {
    pub fn new(underlying_asset: &str, reserve_treasury: &str) -> Self {
        Self {
            balances: HashMap::new(),
            allowances: HashMap::new(),
            nonces: HashMap::new(),
            underlying_asset: underlying_asset.to_string(),
            reserve_treasury: reserve_treasury.to_string(),
            domain_separator: [0u8; 32],
        }
    }
}

impl IAToken for MockAToken {
    fn balance_transfer(&self, from: &str, to: &str, value: u64, index: u64) {
        // Logic for balance transfer
        println!("BalanceTransfer: from={}, to={}, value={}, index={}", from, to, value, index);
    }

    fn mint(&mut self, caller: &str, on_behalf_of: &str, amount: u64, index: u64) -> bool {
        let previous_balance = self.balances.get(on_behalf_of).unwrap_or(&0);
        let is_first_supply = *previous_balance == 0;
        *self.balances.entry(on_behalf_of.to_string()).or_insert(0) += amount;
        println!("Mint: caller={}, on_behalf_of={}, amount={}, index={}", caller, on_behalf_of, amount, index);
        is_first_supply
    }

    fn burn(&mut self, from: &str, receiver_of_underlying: &str, amount: u64, index: u64) {
        if let Some(balance) = self.balances.get_mut(from) {
            if *balance >= amount {
                *balance -= amount;
                println!("Burn: from={}, receiver_of_underlying={}, amount={}, index={}", from, receiver_of_underlying, amount, index);
            }
        }
    }

    fn mint_to_treasury(&mut self, amount: u64, index: u64) {
        println!("MintToTreasury: amount={}, index={}", amount, index);
    }

    fn transfer_on_liquidation(&mut self, from: &str, to: &str, value: u64) {
        println!("TransferOnLiquidation: from={}, to={}, value={}", from, to, value);
    }

    fn transfer_underlying_to(&mut self, target: &str, amount: u64) {
        println!("TransferUnderlyingTo: target={}, amount={}", target, amount);
    }

    fn handle_repayment(&mut self, user: &str, on_behalf_of: &str, amount: u64) {
        println!("HandleRepayment: user={}, on_behalf_of={}, amount={}", user, on_behalf_of, amount);
    }

    fn permit(&mut self, owner: &str, spender: &str, value: u64, deadline: u64, v: u8, s: &[u8; 32], r: &[u8; 32]) {
        println!("Permit: owner={}, spender={}, value={}, deadline={}, v={}, s={:?}, r={:?}", owner, spender, value, deadline, v, s, r);
        let nonce = self.nonces.entry(owner.to_string()).or_insert(0);
        *nonce += 1;
    }

    fn underlying_asset_address(&self) -> &str {
        &self.underlying_asset
    }

    fn reserve_treasury_address(&self) -> &str {
        &self.reserve_treasury
    }

    fn domain_separator(&self) -> [u8; 32] {
        self.domain_separator
    }

    fn nonces(&self, owner: &str) -> u64 {
        *self.nonces.get(owner).unwrap_or(&0)
    }

    fn rescue_tokens(&mut self, token: &str, to: &str, amount: u64) {
        println!("RescueTokens: token={}, to={}, amount={}", token, to, amount);
    }
}

fn main() {
    let mut token = MockAToken::new("UnderlyingAssetAddress", "ReserveTreasuryAddress");

    token.mint("caller", "user1", 1000, 1);
    token.burn("user1", "receiver", 500, 1);
    token.mint_to_treasury(200, 1);
    token.transfer_on_liquidation("user2", "user3", 300);
    token.transfer_underlying_to("target", 400);
    token.handle_repayment("user1", "user2", 500);
    token.permit("owner", "spender", 600, 999999, 27, &[0u8; 32], &[0u8; 32]);
    token.rescue_tokens("token", "recipient", 700);

    println!("Underlying Asset Address: {}", token.underlying_asset_address());
    println!("Reserve Treasury Address: {}", token.reserve_treasury_address());
    println!("Domain Separator: {:?}", token.domain_separator());
    println!("Nonces: {}", token.nonces("owner"));
}
