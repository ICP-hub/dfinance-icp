use std::collections::HashMap;
use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;
use crate::constants::constant_variables::constants::{FAUCET_LIMIT, ZERO_VALUE};

/* 
 * @title Reserve Data
 * @notice Stores information about a reserve of an asset.
 * @dev This struct contains details about asset reserves, including borrowing and liquidity rates.
 * 
 * @param asset_name The name of the asset (e.g., "ICP", "BTC").
 * @param id Unique identifier for the reserve.
 * @param d_token_canister The principal ID of the dToken canister.
 * @param debt_token_canister The principal ID of the debt token canister.
 * @param borrow_rate The current borrow interest rate.
 * @param current_liquidity_rate The liquidity rate of the asset.
 * @param asset_supply The total supply of the asset in the reserve.
 * @param asset_borrow The total borrowed amount of the asset.
 * @param liquidity_index The latest liquidity index.
 * @param debt_index The latest debt index.
 * @param configuration The configuration settings for the reserve.
 * @param can_be_collateral Indicates if the asset can be used as collateral.
 * @param last_update_timestamp The last recorded update timestamp.
 * @param accure_to_platform The amount accrued to the platform.
 * 
 * @functionality Stores and tracks complete reserve metadata and on-chain accounting values.
 */
#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: Nat, 
    pub current_liquidity_rate: Nat,
    pub asset_supply: Nat,
    pub asset_borrow: Nat,
    pub liquidity_index: Nat,
    pub debt_index: Nat,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
    pub accure_to_platform: Nat,
}

/* 
 * @title Reserve Cache
 * @notice Stores cached data related to a reserve of an asset.
 * @dev This struct caches important reserve data for faster access and calculations.
 * @functionality Provides temporary in-memory values used for computation and optimization.
 *
 * @param reserve_configuration The configuration details of the reserve.
 * @param curr_liquidity_index The current liquidity index.
 * @param next_liquidity_index The projected next liquidity index.
 * @param curr_liquidity_rate The current liquidity rate.
 * @param reserve_last_update_timestamp The last recorded update timestamp for the reserve.
 * @param curr_debt_index The current debt index.
 * @param next_debt_index The projected next debt index.
 * @param curr_debt_rate The current debt rate.
 * @param next_debt_rate The projected next debt rate.
 * @param debt_last_update_timestamp The last recorded update timestamp for the debt.
 * @param reserve_factor The reserve factor.
 * @param curr_debt The current total debt.
 * @param next_debt The projected next debt amount.
 * @param curr_supply The current total supply.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ReserveCache {
    pub reserve_configuration: ReserveConfiguration,
    pub curr_liquidity_index: Nat,
    pub next_liquidity_index: Nat,
    pub curr_liquidity_rate: Nat,
    pub reserve_last_update_timestamp: u64,
    pub curr_debt_index: Nat,
    pub next_debt_index: Nat,
    pub curr_debt_rate: Nat,
    pub next_debt_rate: Nat,
    pub debt_last_update_timestamp: u64,
    pub reserve_factor: Nat,
    pub curr_debt: Nat,
    pub next_debt: Nat,
    pub curr_supply: Nat,
   
}

/* 
 * @title Reserve Configuration
 * @notice Defines the configuration settings for a reserve of an asset.
 * @dev This struct includes parameters affecting borrowing, liquidation, and supply behavior.
 * @functionality Defines protocol-level rules and parameters for reserve behavior and risk control.
 * 
 * @param ltv The loan-to-value ratio.
 * @param liquidation_threshold The threshold for liquidation.
 * @param liquidation_bonus The penalty for liquidation.
 * @param borrowing_enabled Indicates if borrowing is enabled.
 * @param borrow_cap The maximum borrowable amount.
 * @param supply_cap The maximum supply limit.
 * @param liquidation_protocol_fee The fee charged on liquidation.
 * @param active Indicates if the reserve is currently active.
 * @param frozen Indicates if the reserve is frozen.
 * @param paused Indicates if transactions are paused.
 * @param reserve_factor The portion of interest that accrues to the protocol.
 */
#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub liquidation_bonus: Nat,  
    pub borrowing_enabled: bool, 
    pub borrow_cap: Nat,   //TODO set it according to borrow
    pub supply_cap: Nat,   //set it according to supply     
    pub liquidation_protocol_fee: Nat, 
    pub reserve_factor: Nat,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
 pub struct AssetInfo {
     pub asset_name: String,
     pub principal_id: Principal,
     pub symbol: String,
     pub image:String, // Storing image as binary blob
 }

/* 
 * @title Initialize Arguments
 * @notice Defines the arguments required to initialize the protocol.
 * @functionality Specifies initialization parameters when deploying the protocol canister.
 * 
 * @param controller_id The principal ID of the controller.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct InitArgs { 
    pub controller_id: Principal   // for the test-token and dtoken cannisters which are going to be created dynamically
}

/* 
 * @title Transaction Data Structure
 * @dev Represents a blockchain transaction with relevant details.
 * @functionality Tracks and stores details of blockchain transactions including hash, block, method, age, participants, value and fees.
 */
// #[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
// pub struct Transaction {
//     pub transaction_hash: String,
//     pub block: u64,
//     pub method: String,
//     pub age: u32,
//     pub from: String,
//     pub to: String,
//     pub value: f64,
//     pub transaction_fee: f64,
// }

/* 
 * @title Wrapper for Candid-compatible types
 * @functionality Provides a simple wrapper around any type to enable Candid compatibility for serialization and deserialization.
 */
// #[derive(Debug)]
// pub struct Candid<T>(pub T);

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
            total_collateral: Some(Nat::from(ZERO_VALUE)),
            total_debt: Some(Nat::from(ZERO_VALUE)),
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
            variable_borrow_index: Default::default(),
            is_using_as_collateral_or_borrow: Default::default(),
            is_collateral: true,
            is_borrowed: Default::default(),
            faucet_usage: Default::default(),
            faucet_limit: Nat::from(FAUCET_LIMIT),
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
// #[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
// pub struct UserState {
//     pub adjusted_balance: Nat, 
//     pub index: Nat, 
// }

// impl Default for UserState {
//     fn default() -> Self {
//         Self {
//             adjusted_balance: Default::default(),
//             index: Default::default(),
//         }
//     }
// }

//TODO: as now we are not using these so need to remove these later (as we have changed our api limiter).
/* 
 * @title Request Tracker
 * @functionality Monitors and limits API usage by tracking request count and timestamps to prevent abuse and rate limit violations.
 */
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct RequestTracker {
    pub count: u32,
    pub last_request_time: u64,
}

//TODO: as now we are not using these so need to remove these later (as we have changed our api limiter).
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