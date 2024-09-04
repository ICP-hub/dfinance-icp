

pub const PERCENTAGE_FACTOR: u64 = 1e4 as u64;
pub const HALF_PERCENTAGE_FACTOR: u64 = 0.5e4 as u64;

/// Executes a percentage multiplication
/// `value`: The value of which the percentage needs to be calculated
/// `percentage`: The percentage of the value to be calculated
/// Returns the result of value * percentage / 100.00, rounded.
// pub fn percent_mul(value: u64, percentage: u64) -> u64 {
//     // to avoid overflow, value <= (u64::MAX - HALF_PERCENTAGE_FACTOR) / percentage
//     if percentage == 0 || value > (u64::MAX - HALF_PERCENTAGE_FACTOR) / percentage {
//         panic!("Overflow in percentage multiplication");
//     }

//     (value * percentage + HALF_PERCENTAGE_FACTOR) / PERCENTAGE_FACTOR
// }
pub fn percent_mul(value: u128, percentage: u128) -> u128 {
    const PERCENTAGE_FACTOR: u128 = 10_000; // 100.00 with 2 decimal precision
    const HALF_PERCENTAGE_FACTOR: u128 = 5_000; // 50.00 with 2 decimal precision

    // To avoid overflow, value must be less than or equal to (u128::MAX - HALF_PERCENTAGE_FACTOR) / percentage
    if percentage == 0 || value > (u128::MAX - HALF_PERCENTAGE_FACTOR) / percentage {
        panic!("Overflow in percentage multiplication");
    }

    (value * percentage + HALF_PERCENTAGE_FACTOR) / PERCENTAGE_FACTOR
}



/// Executes a percentage division
/// `value`: The value of which the percentage needs to be calculated
/// `percentage`: The percentage of the value to be calculated
/// Returns the result of value / (percentage / 100.00), rounded.
pub fn percent_div(value: u64, percentage: u64) -> u64 {
    // to avoid overflow, value <= (u64::MAX - percentage / 2) / PERCENTAGE_FACTOR
    if percentage == 0 || value > (u64::MAX - percentage / 2) / PERCENTAGE_FACTOR {
        panic!("Overflow in percentage division");
    }

    (value * PERCENTAGE_FACTOR + percentage / 2) / percentage
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn test_percent_mul() {
//         assert_eq!(percent_mul(10000, 5000), 5000);
//         assert_eq!(percent_mul(12345, 6789), 8380);
//         assert_eq!(percent_mul(987654321, 10000), 98765432);
//     }

//     #[test]
//     fn test_percent_div() {
//         assert_eq!(percent_div(10000, 5000), 20000);
//         assert_eq!(percent_div(12345, 6789), 18182);
//         assert_eq!(percent_div(987654321, 10000), 9876543210);
//     }

//     #[test]
//     #[should_panic]
//     fn test_percent_mul_overflow() {
//         percent_mul(u64::MAX, 2);
//     }

//     #[test]
//     #[should_panic]
//     fn test_percent_div_overflow() {
//         percent_div(u64::MAX, 1);
//     }
// }
