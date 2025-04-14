use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;
use icrc_ledger_types::icrc1::account::Account;

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

#[derive(CandidType, Deserialize, Clone, Default,Debug)]
pub struct AssetData{
    pub name:String,
    pub balance:Nat
}

/*
 * @title Accrual Treasury Variables
 * @notice Stores temporary values used during the treasury accrual process.
 * @dev Holds previous debt values and calculated accrual amounts.
 */
pub struct AccrueToTreasuryLocalVars {
    //
    pub prev_total_variable_debt: Nat,
    pub curr_total_variable_debt: Nat,
    pub total_debt_accrued: Nat,
    pub amount_to_mint: Nat,
}


#[derive(CandidType, Deserialize)]
pub struct AddPoolArgs {
    pub token_0: String,
    pub amount_0: Nat,
    pub tx_id_0: Option<String>,
    pub token_1: String,
    pub amount_1: Nat,
    pub tx_id_1: Option<String>,
    pub lp_fee_bps: Option<u32>,
    pub kong_fee_bps: Option<u32>,
    pub on_kong: Option<bool>,
}


#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct TransferIdReply {
    pub transfer_id: u64,
    pub transfer: TransferReply,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum TransferReply {
    IC(ICTransferReply),
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct ICTransferReply {
    pub chain: String,
    pub symbol: String,
    pub is_send: bool, // from user's perspective. so if is_send is true, it means the user is sending the token
    pub amount: Nat,
    pub canister_id: String,
    pub block_index: Nat,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct AddPoolReply {
    pub tx_id: u64,
    pub pool_id: u32,
    pub request_id: u64,
    pub status: String,
    pub name: String,
    pub symbol: String,
    pub chain_0: String,
    pub address_0: String,
    pub symbol_0: String,
    pub amount_0: Nat,
    pub balance_0: Nat,
    pub chain_1: String,
    pub address_1: String,
    pub symbol_1: String,
    pub amount_1: Nat,
    pub balance_1: Nat,
    pub lp_fee_bps: u8,
    pub lp_token_symbol: String,
    pub add_lp_token_amount: Nat,
    pub transfer_ids: Vec<TransferIdReply>,
    pub claim_ids: Vec<u64>,
    pub is_removed: bool,
    pub ts: u64,
}


#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct SwapArgs {
    pub pay_token: String,
    pub pay_amount: Nat,
    pub pay_tx_id: Option<String>,
    pub receive_token: String,
    pub receive_amount: Option<Nat>,
    pub receive_address: Option<String>,
    pub max_slippage: Option<f64>,
    pub referred_by: Option<String>,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct SwapTxReply {
    pub pool_symbol: String,
    pub pay_chain: String,
    pub pay_address: String,
    pub pay_symbol: String,
    pub pay_amount: Nat,
    pub receive_chain: String,
    pub receive_address: String,
    pub receive_symbol: String,
    pub receive_amount: Nat, // including fees
    pub price: f64,
    pub lp_fee: Nat,  // will be in receive_symbol
    pub gas_fee: Nat, // will be in receive_symbol
    pub ts: u64,
}



#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct SwapReply {
    pub tx_id: u64,
    pub request_id: u64,
    pub status: String,
    pub pay_chain: String,
    pub pay_address: String,
    pub pay_symbol: String,
    pub pay_amount: Nat,
    pub receive_chain: String,
    pub receive_address: String,
    pub receive_symbol: String,
    pub receive_amount: Nat,
    pub mid_price: f64,
    pub price: f64,
    pub slippage: f64,
    pub txs: Vec<SwapTxReply>,
    pub transfer_ids: Vec<TransferIdReply>,
    pub claim_ids: Vec<u64>,
    pub ts: u64,
}

