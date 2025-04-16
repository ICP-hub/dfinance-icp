use std::collections::HashMap;
use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

/* 
 * @title Transaction Data Structure
 * @dev Represents a blockchain transaction with relevant details.
 * @functionality Tracks and stores details of blockchain transactions including hash, block, method, age, participants, value and fees.
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
 * @functionality Provides a simple wrapper around any type to enable Candid compatibility for serialization and deserialization.
 */
#[derive(Debug)]
pub struct Candid<T>(pub T);

/* 
 * @title User Data
 * @dev Stores user-specific financial information.
 * @notice This structure holds the user's reserves, collateral, and debt data.
 * @functionality Aggregates all financial information for a user including collateral, debt, and associated reserve data.
 */
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
 * @functionality Maintains detailed information about a user's interaction with a specific reserve, including supply, borrow amounts, collateral status, and asset indices.
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
 * @functionality Tracks a user's current financial state with adjusted balance calculations and relevant index for interest accrual.
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
 * @functionality Contains all necessary configuration parameters to initialize a new reserve in the lending protocol, including token implementations and naming.
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
 * @functionality Provides the necessary data points to calculate dynamic interest rates based on liquidity utilization, total debt, and current borrowing rates.
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


/*
 * @title User Account Data Structure
 * @notice Stores financial data such as collateral, debt, and risk factors.
 * @dev Tracks users' financial health and determines potential liquidation status.
 * @functionality Provides comprehensive financial health metrics for a user account, including collateral-to-debt ratios, liquidation thresholds, and available borrowing capacity.
 */
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UserAccountData {
    pub collateral: Nat,
    pub debt: Nat,
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub health_factor: Nat,
    pub available_borrow: Nat,
    pub has_zero_ltv_collateral: bool,
}

/* 
 * @title Request Tracker
 * @functionality Monitors and limits API usage by tracking request count and timestamps to prevent abuse and rate limit violations.
 */
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct RequestTracker {
    pub count: u32,
    pub last_request_time: u64,
}

/* 
 * @title Blocked User Details
 * @functionality Stores information about users who have been blocked from the system, including when the block was applied.
 */
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct BlockedUserDetails {
    pub blocked_time: u64,
}

/* 
 * @title Session Storage Data
 * @functionality Maintains user session information including connected wallet address and session start time for authentication purposes.
 */
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct SessionStorageData {
    pub connected_wallet: String,
    pub session_start: Nat,
}

/* 
 * @title Cached Price
 * @functionality Stores asset price data temporarily to reduce external oracle calls and improve performance.
 */
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct CachedPrice {
    pub price: Nat,
}

/* 
 * @title Price Cache
 * @functionality Maintains a collection of recent asset prices to optimize performance and reduce external API calls for price data.
 */
#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct PriceCache {
    pub cache: HashMap<String, CachedPrice>,
}