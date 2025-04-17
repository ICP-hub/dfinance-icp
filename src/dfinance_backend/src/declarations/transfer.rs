use candid::{CandidType, Deserialize};
use candid::{Nat, Principal};
use serde::Serialize;

/* 
 * @title Transfer From Arguments
 * @functionality Encapsulates all necessary parameters to perform a delegated asset transfer.
 * @notice Defines the arguments for transferring assets.
 * @dev This struct includes the sender, recipient, transfer amount, and optional metadata.
 */
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

/* 
 * @title Transfer Arguments
 * @functionality Defines the standard parameters for initiating an asset transfer.
 * @notice Defines the structure for an asset transfer.
 * @dev This struct stores necessary data for a direct asset transfer.
 */
#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

/* 
 * @title Transfer Account
 * @functionality Represents an account holder and their optional subaccount for transfers.
 * @notice Represents an account involved in a transfer.
 * @dev This struct defines an account using a `Principal` owner and an optional subaccount identifier.
 */
#[derive(CandidType, Deserialize)]
pub struct TransferAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
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
 * @title Transfer From Error
 * @functionality Enumerates specific reasons a delegated transfer may fail.
 * @notice Enumerates possible errors encountered during a transaction.
 * @dev Errors include insufficient funds, incorrect fees, or duplicate transactions.
 */
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

/* 
 * @title Approve Arguments
 * @functionality Defines the parameters for approving a spender to use funds.
 * @notice Defines the structure for an approval request.
 * @dev Used when approving a spender to use funds on behalf of the owner.
 */
#[derive(CandidType, Deserialize)]
pub struct ApproveArgs {
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub from_subaccount: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
    pub expected_allowance: Option<Nat>,
    pub expires_at: Option<u64>,
    pub spender: TransferAccount,
}

/* 
 * @title Approve Error
 * @functionality Details the reasons an approval attempt might fail.
 * @notice Lists possible errors encountered during an approval operation.
 * @dev Errors include duplicate transactions, insufficient funds, and expiration issues.
 */
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
