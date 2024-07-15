#[derive(Debug)]
pub enum Error {
    InvalidAmount,
    ReserveInactive,
    ReservePaused,
    ReserveFrozen,
}

impl Error {
    pub fn message(&self) -> &str {
        match self {
            Error::InvalidAmount => "Amount must be greater than 0",
            Error::ReserveInactive => "Action requires an active reserve",
            Error::ReservePaused => "Action cannot be performed because the reserve is paused",
            Error::ReserveFrozen => "Action cannot be performed because the reserve is frozen",
        }
    }
}
