pub struct PercentageMath;

impl PercentageMath {
    const PERCENTAGE_FACTOR: u128 = 1e4 as u128;
    const HALF_PERCENTAGE_FACTOR: u128 = 0.5e4 as u128;

    pub fn percent_mul(value: u128, percentage: u128) -> Result<u128, &'static str> {
        if percentage == 0 || value <= (u128::MAX - Self::HALF_PERCENTAGE_FACTOR) / percentage {
            let result = (value * percentage + Self::HALF_PERCENTAGE_FACTOR) / Self::PERCENTAGE_FACTOR;
            Ok(result)
        } else {
            Err("Overflow in percentMul")
        }
    }

    pub fn percent_div(value: u128, percentage: u128) -> Result<u128, &'static str> {
        if percentage == 0 {
            return Err("Division by zero in percentDiv");
        }
        if value <= (u128::MAX - percentage / 2) / Self::PERCENTAGE_FACTOR {
            let result = (value * Self::PERCENTAGE_FACTOR + percentage / 2) / percentage;
            Ok(result)
        } else {
            Err("Overflow in percentDiv")
        }
    }
}

fn main() {
    // Example usage
    match PercentageMath::percent_mul(10000, 2500) {
        Ok(result) => println!("percentMul result: {}", result), // Should output 2500
        Err(e) => println!("Error: {}", e),
    }

    match PercentageMath::percent_div(10000, 2500) {
        Ok(result) => println!("percentDiv result: {}", result), // Should output 40000
        Err(e) => println!("Error: {}", e),
    }
}
