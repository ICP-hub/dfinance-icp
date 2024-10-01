#[derive(Debug)]
pub enum Error {
    InvalidAmount,
    MaxAmount,
    ReserveInactive,
    ReservePaused,
    ReserveFrozen,
    SupplyCapExceeded,
    LTVGreaterThanThreshold,
    BorrowCapExceeded,
    HealthFactorLess,
    WithdrawMoreThanSupply,
    RepayMoreThanDebt,
}

impl Error {
    pub fn message(&self) -> &str {
        match self {
            Error::InvalidAmount => "Amount must be greater than 0",
            Error::MaxAmount => "Amount must be less than user balance",
            Error::ReserveInactive => "Action requires an active reserve",
            Error::ReservePaused => "Action cannot be performed because the reserve is paused",
            Error::ReserveFrozen => "Action cannot be performed because the reserve is frozen",
            Error::SupplyCapExceeded => "Supply cap is exceeded",
            Error::BorrowCapExceeded => "Borrow cap is exceeded",
            Error::LTVGreaterThanThreshold => "LTV should be less than Liquidation Threshold",
            Error::HealthFactorLess => "Health factor is falling below 1, will lead to liquidation",
            Error::WithdrawMoreThanSupply => "Withdraw cannot be more than supply",
            Error::RepayMoreThanDebt => "Repay cannot be more than debt",
        }
    }
}
