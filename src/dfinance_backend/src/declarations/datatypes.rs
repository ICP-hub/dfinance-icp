use crate::constants::constant_variables::constants::FAUCET_LIMIT;
use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;
use std::collections::HashMap;

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
#[derive(Debug, CandidType, Deserialize, Clone, Serialize)]
pub struct ReserveData {
    pub asset_name: String,
    pub id: u16,
    pub d_token_canister: Option<Principal>,
    pub debt_token_canister: Option<Principal>,
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
    pub curr_liquidity_index: Nat,
    pub next_liquidity_index: Nat,
    pub curr_liquidity_rate: Nat,
    pub reserve_last_update_timestamp: u64,
    pub curr_debt_index: Nat,
    pub next_debt_index: Nat,
    pub curr_debt_rate: Nat,
    pub next_debt_rate: Nat,
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
 * @param reserve_factor The portion of interest that accrues to the protocol.
 */
#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub liquidation_bonus: Nat,
    pub borrowing_enabled: bool,
    pub borrow_cap: Nat,
    pub supply_cap: Nat,
    pub liquidation_protocol_fee: Nat,
    pub reserve_factor: Nat,
}

/*
 * @title Asset Information
 * @notice Contains metadata about an asset.
 * @dev This struct includes the asset's name, symbol, and associated principal ID.
 * @functionality Provides a simple representation of asset metadata for easy access and display.
 *
 * @param asset_name The name of the asset (e.g., "ICP", "BTC").
 * @param principal_id The principal ID associated with the asset.
 * @param symbol The symbol representing the asset (e.g., "ICP", "BTC").
 * @param image The URL or path to the asset's image.
 */
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct AssetInfo {
    pub asset_name: String,
    pub principal_id: Principal,
    pub symbol: String,
    pub image: String, // Storing image as binary blob
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
    pub controller_id: Principal, // for the test-token and dtoken cannisters which are going to be created dynamically
}

/*
 * @title Faucet Reserves
 * @dev Represents the reserves available in the faucet.
 * @functionality Provides a structure to manage and track the reserves available for distribution through the faucet.
 *
 * @param reserves A vector of tuples containing asset name and corresponding reserve data.
 */

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct FaucetReserves {
    pub reserves: Option<Vec<(String, FaucetReserve)>>,
}
impl Default for FaucetReserves {
    fn default() -> Self {
        Self {
            reserves: Default::default(),
        }
    }
}

/*
 * @title Faucet Reserve
 * @dev Represents the reserve data for a specific asset in the faucet.
 * @functionality Provides a structure to manage and track the usage and limit of reserves available for distribution through the faucet.
 *
 * @param faucet_limit The maximum limit of the faucet reserve.
 * @param faucet_usage The current usage of the faucet reserve.
 */
#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct FaucetReserve {
    pub faucet_limit: Nat,
    pub faucet_usage: Nat,
}
impl Default for FaucetReserve {
    fn default() -> Self {
        Self {
            faucet_usage: Default::default(),
            faucet_limit: Nat::from(FAUCET_LIMIT),
        }
    }
}

/*
 * @title User Data
 * @dev Stores user-specific financial information.
 * @notice This structure holds the user's reserves, collateral, and debt data.
 * @functionality Aggregates all financial information for a user including collateral, debt, and associated reserve data.
 */
#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
}

impl Default for UserData {
    fn default() -> Self {
        Self {
            user_id: Default::default(),
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
    pub can_be_collateral: bool,
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
            is_using_as_collateral_or_borrow: true,
            is_collateral: true,
            is_borrowed: Default::default(),
            can_be_collateral: true,
            d_token_balance: Default::default(),
            debt_token_blance: Default::default(),
        }
    }
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

/*  Certificate used for query call verification in the Internet Computer (ICP).
*
* # Fields
* - `certificate`: CBOR-encoded certificate proving authenticity of the response.
* - `witness`: Merkle proof showing data inclusion in the IC state tree.
*
* Used to verify that query responses haven't been tampered with using IC's certified variables mechanism.
 */
#[derive(CandidType)]
pub struct Certificate {
    pub certificate: Vec<u8>,
    pub witness: Vec<u8>,
}
