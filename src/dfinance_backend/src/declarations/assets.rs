use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

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
    pub active: bool,
    pub frozen: bool,
    pub paused: bool,
    pub reserve_factor: Nat,
}

/* 
 * @title Execute Supply Parameters
 * @notice Defines parameters required to execute a supply transaction.
 * @functionality Carries the required information to perform asset supply transactions.
 * 
 * @param asset The asset to supply.
 * @param amount The amount of the asset to be supplied.
 * @param is_collateral Indicates if the supplied asset should be used as collateral.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: Nat,
    pub is_collateral: bool,

}

/* 
 * @title Execute Borrow Parameters
 * @notice Defines the parameters required to execute a borrow transaction.
 * @functionality Holds the inputs necessary to initiate a borrowing operation.
 * 
 * @param asset The asset being borrowed.
 * @param amount The amount of the asset to borrow.
 */
#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct ExecuteBorrowParams {
    pub asset: String,
    pub amount: Nat,
}

/* 
 * @title Execute Repay Parameters
 * @notice Defines the parameters required to execute a repayment transaction.
 * @functionality Encapsulates information used to repay a loan, optionally on another user's behalf.
 * 
 * @param asset The asset being repaid.
 * @param amount The amount of the asset being repaid.
 * @param on_behalf_of Optional: The principal ID of the user on whose behalf the repayment is made.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: Nat,
    pub on_behalf_of: Option<Principal>,
}

/* 
 * @title Execute Withdraw Parameters
 * @notice Defines parameters required to execute a withdrawal transaction.
 * @functionality Manages the withdrawal of supplied or collateral assets from the protocol.
 * 
 * @param asset The asset being withdrawn.
 * @param amount The amount to withdraw.
 * @param on_behalf_of Optional: The principal of the user on whose behalf the withdrawal is made.
 * @param is_collateral Indicates if the asset being withdrawn was used as collateral.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteWithdrawParams {
    pub asset: String,
    pub amount: Nat,
    pub on_behalf_of: Option<Principal>,
    pub is_collateral: bool,
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
    pub controller_id: Principal
}

/* 
 * @title Execute Liquidation Parameters
 * @notice Defines parameters required to execute a liquidation transaction.
 * @functionality Facilitates partial liquidation of under-collateralized accounts.
 * 
 * @param debt_asset The asset being liquidated.
 * @param collateral_asset The collateral asset.
 * @param amount The amount being liquidated.
 * @param on_behalf_of The principal on whose behalf liquidation is performed.
 * @param reward_amount The reward amount for the liquidator.
 */
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteLiquidationParams {
    pub debt_asset: String,
    pub collateral_asset: String,
    pub amount: Nat,
    pub on_behalf_of: Principal,
    pub reward_amount: Nat,
}
/* 
 * @title Asset Data
 * @notice Represents basic asset-related information.
 * 
 * @functionality Used for simple asset tracking such as balances and asset names.
 */
#[derive(CandidType, Deserialize, Clone, Default,Debug)]
pub struct AssetData{
    pub name:String,
    pub balance:Nat
}

/* 
 * @title Accrual Treasury Variables
 * @notice Stores temporary values used during the treasury accrual process.
 * @dev Holds previous debt values and calculated accrual amounts.
 * 
 * @functionality Used for calculating and storing intermediate values in treasury accrual logic.
 */
pub struct AccrueToTreasuryLocalVars {
    //
    pub prev_total_variable_debt: Nat,
    pub curr_total_variable_debt: Nat,
    pub total_debt_accrued: Nat,
    pub amount_to_mint: Nat,
}