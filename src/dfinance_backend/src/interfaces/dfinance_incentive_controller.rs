pub trait IAaveIncentivesController {
    fn handle_action(&self, user: &str, total_supply: u64, user_balance: u64);
}

pub struct MockAaveIncentivesController;

impl IAaveIncentivesController for MockAaveIncentivesController {
    fn handle_action(&self, user: &str, total_supply: u64, user_balance: u64) {
        println!(
            "HandleAction: user={}, total_supply={}, user_balance={}",
            user, total_supply, user_balance
        );
    }
}

fn main() {
    let incentives_controller = MockAaveIncentivesController;

    // Example usage
    incentives_controller.handle_action("user1", 1_000_000, 500);
}
