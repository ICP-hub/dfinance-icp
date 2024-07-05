/// Defines the basic interface for an Aave Incentives Controller.
trait IDefiIncentivesController {
    /// Called by the corresponding asset on transfer hook in order to update the rewards distribution.
    /// The units of `total_supply` and `user_balance` should be the same.
    ///
    /// Arguments:
    /// - `user`: The address of the user whose asset balance has changed.
    /// - `total_supply`: The total supply of the asset prior to user balance change.
    /// - `user_balance`: The previous user balance prior to balance change.
    fn handle_action(&self, user: Principal, total_supply: u64, user_balance: u64) -> ();
}
