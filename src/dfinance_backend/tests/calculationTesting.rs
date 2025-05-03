mod calculation_testing;
mod utils;
use crate::calculation_testing::linear_interest::test_calculate_linear_interest;
use crate::calculation_testing::compound_interest::test_calculate_compounded_interest;
use crate::calculation_testing::accrue_to_treasury::test_accrue_to_treasury;
use crate::calculation_testing::interest_rates::test_calculate_interest_rates;


#[test]
fn call_test_function() {
    test_calculate_linear_interest();
    test_calculate_compounded_interest();
    futures::executor::block_on(test_calculate_interest_rates());
    futures::executor::block_on(test_accrue_to_treasury());
}