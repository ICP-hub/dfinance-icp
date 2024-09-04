struct UserPosition {
    total_collateral_value: f64,
    total_borrowed_value: f64,
    liquidation_threshold: f64, // e.g., 0.8 for 80%
}
fn calculate_health_factor(position: &UserPosition) -> f64 {
    if position.total_borrowed_value == 0.0 {
        return f64::INFINITY; // No debt, hence infinitely safe
    }

    (position.total_collateral_value * position.liquidation_threshold) / position.total_borrowed_value
}