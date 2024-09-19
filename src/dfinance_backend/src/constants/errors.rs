#[derive(Debug)]
pub enum Error {
    InvalidAmount,
    MaxAmount,
    ReserveInactive,
    ReservePaused,
    ReserveFrozen,
    SupplyCapExceeded,
    NotEnoughAvailableUserBalance,
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
            Error::NotEnoughAvailableUserBalance => {
                "User cannot withdraw more than the available balance"
            }
        }
    }
}
