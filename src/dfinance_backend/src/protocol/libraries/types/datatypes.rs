use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

/* 
 * @title Transaction Data Structure
 * @dev Represents a blockchain transaction with relevant details.
 */
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

/* 
 * @title Wrapper for Candid-compatible types
 */
#[derive(Debug)]
pub struct Candid<T>(pub T);

/* 
 * @title User Data
 * @dev Stores user-specific financial information.
 * @notice This structure holds the user's reserves, collateral, and debt data.
 */
//FIXME remove this user data , can store reserves list directly to user profile
#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    pub total_collateral: Option<Nat>,
    pub total_debt: Option<Nat>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
}

impl Default for UserData {
    fn default() -> Self {
        Self {
            user_id: Default::default(),
            total_collateral: Some(Nat::from(0u128)),
            total_debt: Some(Nat::from(0u128)),
            reserves: Default::default(),
            
           
        }
    }
}

/* 
 * @title User Reserve Data
 * @dev Stores the user's balance and reserve-related details.
 */
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub last_update_timestamp: u64,
    pub liquidity_index: Nat,
    pub variable_borrow_index: Nat, 
    pub asset_supply: Nat,
    pub asset_borrow: Nat, 
    pub is_using_as_collateral_or_borrow: bool,
    pub is_collateral: bool,
    pub is_borrowed: bool,
    pub faucet_usage: Nat,
    pub faucet_limit: Nat, 
    pub d_token_balance: Nat,
    pub debt_token_blance: Nat,
}
impl Default for UserReserveData {
    fn default() -> Self {
        Self {
            reserve: Default::default(),
            last_update_timestamp: Default::default(),
            liquidity_index: Default::default(),
            asset_supply: Default::default(),
            asset_borrow: Default::default(),
            variable_borrow_index: Default::default(),
            is_using_as_collateral_or_borrow: Default::default(),
            is_collateral: true,
            is_borrowed: Default::default(),
            faucet_usage: Default::default(),
            faucet_limit: Nat::from(50000000000u128),
            d_token_balance: Default::default(),
            debt_token_blance: Default::default(),
        }
    }
}

/* 
 * @title User State
 * @dev Stores the user's adjusted balance and index.
 */
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

/* 
 * @title Reserve Initialization Parameters
 * @dev Parameters required for initializing a reserve.
 */
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

/* 
 * @title Interest Rate Calculation Parameters
 * @dev Parameters required for calculating interest rates.
 */
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
