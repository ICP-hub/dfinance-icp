use candid::{CandidType, Deserialize, Principal};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub total_collateral_value: f64,
    pub total_borrowed_value: f64,
    pub liquidation_threshold: f64, 
}
pub fn calculate_health_factor(position: &UserPosition) -> f64 {
    if position.total_borrowed_value == 0.0 {
        return f64::INFINITY; // No debt, hence infinitely safe
    }

    (position.total_collateral_value * position.liquidation_threshold) / position.total_borrowed_value
}

pub fn calculate_ltv(position: &UserPosition) -> f64 {
    if position.total_collateral_value == 0.0 {
        return 0.0;  // No collateral, LTV is 0
    }

    position.total_borrowed_value / position.total_collateral_value
}