use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct Transaction {
    pub transaction_hash: String,
    pub block: u64,
    pub method: String,
    pub age: u32,
    pub from: String,
    pub to: String,
    pub value: f64,
    pub transaction_fee: f64,
}

#[derive(Debug)]
pub struct Candid<T>(pub T);

//TODO remove all the values which we can fetch directly from user_account_data function
#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    pub net_worth: Option<Nat>, //FIXME i think we can remove this
    pub total_collateral: Option<Nat>,
    pub total_debt: Option<Nat>,
    pub available_borrow: Option<Nat>,
    pub net_apy: Option<Nat>,       //FIXME i think we can remove this
    pub health_factor: Option<Nat>, //FIXME can we remove this or just keep this
    pub ltv: Option<Nat>,       
    pub liquidation_threshold: Option<Nat>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
    pub max_ltv: Option<Nat>,
}

impl Default for UserData {
    fn default() -> Self {
        Self {
            user_id: Default::default(),
            net_worth: Some(Nat::from(0u128)),
            total_collateral: Some(Nat::from(0u128)),
            total_debt: Some(Nat::from(0u128)),
            available_borrow: Some(Nat::from(0u128)),
            net_apy: Some(Nat::from(0u128)),
            health_factor: Some(Nat::from(0u128)),
            ltv: Some(Nat::from(0u128)),
            liquidation_threshold: Some(Nat::from(0u128)),
            reserves: Default::default(),
            max_ltv: Some(Nat::from(0u128)),
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub principal_stable_debt: u64, //TODO remove
    pub borrow_rate: Nat, //FIXME i think there is no need for this
    pub supply_rate: Nat,
    pub last_update_timestamp: u64,
    pub liquidity_index: Nat,
    pub asset_supply: Nat,
    pub asset_borrow: Nat,
    pub variable_borrow_index: Nat,  
    pub asset_price_when_supplied: Nat, //TODO remove
    pub asset_price_when_borrowed: Nat,  //TODO remove
    pub is_using_as_collateral_or_borrow: bool,
    pub is_collateral: bool,
    pub is_borrowed: bool,
    pub faucet_usage: Nat,
    pub faucet_limit: Nat, 
    pub d_token_balance: Nat,
    pub debt_token_blance: Nat,
    pub state: UserState, //TODO remove this then
}
impl Default for UserReserveData {
    fn default() -> Self {
        Self {
            reserve: Default::default(),
            principal_stable_debt: Default::default(),
            borrow_rate: Default::default(),
            supply_rate: Default::default(),
            last_update_timestamp: Default::default(),
            liquidity_index: Default::default(),
            asset_supply: Default::default(),
            asset_borrow: Default::default(),
            variable_borrow_index: Default::default(),
            asset_price_when_supplied: Default::default(),
            asset_price_when_borrowed: Default::default(),
            is_using_as_collateral_or_borrow: Default::default(),
            is_collateral: true,
            is_borrowed: Default::default(),
            faucet_usage: Default::default(),
            faucet_limit: Nat::from(50000000000u128),
            state: Default::default(),
            d_token_balance: Default::default(),
            debt_token_blance: Default::default(),
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserState {
    pub adjusted_balance: Nat, 
    pub index: Nat, 
}

impl Default for UserState {
    fn default() -> Self {
        Self {
            adjusted_balance: Default::default(),
            index: Default::default(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InitReserveInput {
    pub d_token_impl: Principal,
    pub stable_debt_token_impl: Principal,
    pub variable_debt_token_impl: Principal,
    pub underlying_asset_decimals: u8,
    pub interest_rate_strategy_address: Principal,
    pub underlying_asset: Principal,
    pub treasury: Principal,
    pub incentives_controller: Principal,
    pub d_token_name: String,
    pub d_token_symbol: String,
    pub variable_debt_token_name: String,
    pub variable_debt_token_symbol: String,
    pub stable_debt_token_name: String,
    pub stable_debt_token_symbol: String,
    pub params: Vec<u8>,
}

#[derive(Debug, CandidType, Deserialize, Serialize)]
pub struct CalculateInterestRatesParams {
    pub liquidity_added: Nat,
    pub liquidity_taken: Nat,
    pub total_stable_debt: Nat,
    pub total_variable_debt: Nat,
    pub average_stable_borrow_rate: Nat,
    pub reserve: String,
    pub d_token: Option<String>,
}
