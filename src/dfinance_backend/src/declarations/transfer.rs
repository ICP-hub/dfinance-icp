use candid::{CandidType, Deserialize};
use candid::{Nat, Principal};
use serde::Serialize;

// TODO: anishka can you look on these comment only onece for the cheking purpose.
/* 
 * @title Transfer From Arguments
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
 * @notice Represents the possible outcomes transaction.
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
 * @notice Enumerates possible errors encountered during transaction.
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
 * @notice Defines the possible outcomes of an approval transaction.
 * @dev The result is either `Ok(Nat)` (successful approval) or an error (`Err(ApproveError)`).
 */
#[derive(CandidType, Deserialize, Serialize, Debug)]
pub enum ApproveResult {
    Ok(Nat),
    Err(ApproveError),
}