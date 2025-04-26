use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;
use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::transfer_from::TransferFromError;
use icrc_ledger_types::icrc2::approve::ApproveError;


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
    pub prev_total_variable_debt: Nat,
    pub curr_total_variable_debt: Nat,
    pub total_debt_accrued: Nat,
    pub amount_to_mint: Nat,
}

/* 
 * @title Interest Rate Calculation Parameters
 * @dev Parameters required for calculating interest rates.
 * @functionality Provides the necessary data points to calculate dynamic interest rates based on liquidity utilization, total debt, and current borrowing rates.
//  */
// #[derive(Debug, CandidType, Deserialize, Serialize)]
// pub struct CalculateInterestRatesParams {
//     pub liquidity_added: Nat,
//     pub liquidity_taken: Nat,
//     pub total_stable_debt: Nat,
//     pub total_variable_debt: Nat,
//     pub average_stable_borrow_rate: Nat,
//     pub reserve: String,
//     pub d_token: Option<String>,
// }

/* 
 * @title Interest Rate Parameters
 * @notice Defines parameters for interest rate calculations.
 * @dev This struct contains the necessary parameters to compute interest rates based on utilization ratios.
 * 
 * @functionality Used in the calculation of variable interest rates based on market conditions and reserve utilization.
 */
#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct InterestRateParams {
    pub optimal_usage_ratio: Nat,
    pub max_excess_usage_ratio: Nat,
    pub base_variable_borrow_rate: Nat,
    pub variable_rate_slope1: Nat,
    pub variable_rate_slope2: Nat,
}



/*
 * @title Initialization Arguments for Token Canister
 * @dev Structure containing necessary parameters for initializing a token canister.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct DynamicCanisterInitArgs {
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub transfer_fee: Nat,
    pub decimals: Option<u8>,
    pub token_name: String,
    pub token_symbol: String,
    pub metadata: Vec<(String, Value)>,
    pub archive_options: ArchiveOptions,
    pub max_memo_length: Option<u16>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
}

/*
 * @title Archive Options
 * @dev Configuration parameters for transaction archival.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct ArchiveOptions {
    pub trigger_threshold: usize,
    pub num_blocks_to_archive: usize,
    pub node_max_memory_size_bytes: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub controller_id: Principal,
    #[serde(default)]
    pub more_controller_ids: Option<Vec<Principal>>,
    #[serde(default)]
    pub cycles_for_archive_creation: Option<u64>,
    #[serde(default)]
    pub max_transactions_per_response: Option<u64>,
}

#[derive(Debug, Deserialize, CandidType)]

pub struct UpgradeArgs {}

/*
 * @title Ledger Arguments
 * @dev Enum defining initialization and upgrade options for the ledger canister.
 */
#[derive(Debug, Deserialize, CandidType)]
pub enum LedgerArg {
    Init(DynamicCanisterInitArgs),
    Upgrade(Option<UpgradeArgs>),
}

/*
 * @title Feature Flags
 * @dev Enables or disables token features like ICRC2.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct FeatureFlags {
    pub icrc2: bool,
}


/* 
 * @title Approve Result
 * @functionality Represents the result of a spender approval operation, either success or failure.
 * @notice Defines the possible outcomes of an approval transaction.
 * @dev The result is either `Ok(Nat)` (successful approval) or an error (`Err(ApproveError)`).
 */
#[derive(CandidType, Deserialize, Serialize, Debug)]
pub enum ApproveResult {
    Ok(Nat),
    Err(ApproveError),
}
/*
 * @title TransferFromResult Enum
 * @functionality Captures the success or failure of a delegated transfer operation.
 * @notice Represents the possible outcomes of a transaction.
 * @dev This enum encapsulates the result. 
 *      A successful transaction returns `Ok(Nat)`, where `Nat` represents the transferred amount.
 *      If the transaction fails, it returns `Err(TransferFromError)`, specifying the error type.
 */
#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(TransferFromError),
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