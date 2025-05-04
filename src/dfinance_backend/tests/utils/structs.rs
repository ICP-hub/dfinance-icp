use candid::Principal;
use candid::{CandidType, Deserialize, Nat};
use serde::Serialize;

#[derive(Debug, CandidType, Deserialize, Clone)]
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

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Certificate {
    pub certificate: Vec<u8>,
    pub witness: Vec<u8>,
}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub liquidation_bonus: Nat,
    pub borrowing_enabled: bool,
    pub borrow_cap: Nat, //TODO set it according to borrow
    pub supply_cap: Nat, //set it according to supply
    pub liquidation_protocol_fee: Nat,
    pub reserve_factor: Nat,
}
#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: TransferAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    InsufficientAllowance { allowance: Nat },
    BadBurn { min_burn_amount: Nat },
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    CreatedInFuture { ledger_time: u64 },
    TooOld,
    InsufficientFunds { balance: Nat },
}

// #[derive(CandidType)]
// pub enum LedgerArgument {
//     Init(InitArgs),
// }

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: u64,
    pub max_transactions_per_response: Option<u64>,
    pub trigger_threshold: u64,
    pub more_controller_ids: Option<Vec<Principal>>,
    pub max_message_size_bytes: Option<u64>,
    pub cycles_for_archive_creation: Option<u64>,
    pub node_max_memory_size_bytes: Option<u64>,
    pub controller_id: Principal,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct InitArgs {
    token_symbol: String,
    token_name: String,
    transfer_fee: Nat,
    metadata: Vec<(String, String)>,
    minting_account: Account,
    initial_balances: Vec<(Account, Nat)>,
    archive_options: ArchiveOptions,
    feature_flags: Option<FeatureFlags>,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct ApproveArgs {
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub from_subaccount: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
    pub expected_allowance: Option<Nat>,
    pub expires_at: Option<u64>,
    pub spender: Account,
}

#[derive(CandidType, Deserialize, Serialize, Debug)]
pub enum ApproveError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    AllowanceChanged { current_allowance: Nat },
    CreatedInFuture { ledger_time: Nat },
    TooOld,
    Expired { ledger_time: Nat },
    InsufficientFunds { balance: Nat },
}

#[derive(CandidType, Deserialize, Serialize)]
pub enum ApproveResult {
    Ok(Nat),
    Err(ApproveError),
}

#[derive(CandidType)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: Nat,
    pub is_collateral: bool,
}

#[derive(CandidType)]
pub struct ExecuteBorrowParams {
    pub asset: String,
    pub amount: Nat,
}

#[derive(CandidType)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: Nat,
    pub on_behalf_of: Option<Principal>,
}

#[derive(CandidType)]
pub struct ExecuteLiquidationParams {
    pub debt_asset: String,
    pub collateral_asset: String,
    pub amount: Nat,
    pub on_behalf_of: Principal,
    pub reward_amount: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteWithdrawParams {
    pub asset: String,
    pub amount: Nat,
    pub is_collateral: bool,
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub last_update_timestamp: u64,
    pub liquidity_index: Nat,
    pub variable_borrow_index: Nat,
    pub is_using_as_collateral_or_borrow: bool,
    pub is_collateral: bool,
    pub is_borrowed: bool,
    pub d_token_balance: Nat,
    pub debt_token_blance: Nat,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    // pub total_collateral: Option<Nat>,
    // pub total_debt: Option<Nat>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: Nat,
    pub max_excess_usage_ratio: Nat,
    pub base_variable_borrow_rate: Nat,
    pub variable_rate_slope1: Nat,
    pub variable_rate_slope2: Nat,
}

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

#[allow(dead_code)]
pub struct AccrueToTreasuryLocalVars {
    pub prev_total_variable_debt: Nat,
    pub curr_total_variable_debt: Nat,
    pub total_debt_accrued: Nat,
    pub amount_to_mint: Nat,
}
