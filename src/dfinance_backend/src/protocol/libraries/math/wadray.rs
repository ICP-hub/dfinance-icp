extern crate num_bigint;
extern crate num_traits;

use num_bigint::BigUint;
use num_traits::{FromPrimitive, ToPrimitive, Zero, One};

pub struct WadRayMath;

impl WadRayMath {
    const WAD: u128 = 1e18 as u128;
    const HALF_WAD: u128 = 0.5e18 as u128;
    const RAY: u128 = 1e27 as u128;
    const HALF_RAY: u128 = 0.5e27 as u128;
    const WAD_RAY_RATIO: u128 = 1e9 as u128;

    pub fn wad_mul(a: u128, b: u128) -> Result<u128, &'static str> {
        if b == 0 || a <= (u128::MAX - Self::HALF_WAD) / b {
            let result = (a as u128 * b + Self::HALF_WAD) / Self::WAD;
            Ok(result)
        } else {
            Err("Overflow in wadMul")
        }
    }

    pub fn wad_div(a: u128, b: u128) -> Result<u128, &'static str> {
        if b == 0 {
            return Err("Division by zero in wadDiv");
        }
        if a <= (u128::MAX - b / 2) / Self::WAD {
            let result = (a as u128 * Self::WAD + b / 2) / b;
            Ok(result)
        } else {
            Err("Overflow in wadDiv")
        }
    }

    pub fn ray_mul(a: u128, b: u128) -> Result<u128, &'static str> {
        if b == 0 || a <= (u128::MAX - Self::HALF_RAY) / b {
            let result = (a as u128 * b + Self::HALF_RAY) / Self::RAY;
            Ok(result)
        } else {
            Err("Overflow in rayMul")
        }
    }

    pub fn ray_div(a: u128, b: u128) -> Result<u128, &'static str> {
        if b == 0 {
            return Err("Division by zero in rayDiv");
        }
        if a <= (u128::MAX - b / 2) / Self::RAY {
            let result = (a as u128 * Self::RAY + b / 2) / b;
            Ok(result)
        } else {
            Err("Overflow in rayDiv")
        }
    }

    pub fn ray_to_wad(a: u128) -> u128 {
        let result = a / Self::WAD_RAY_RATIO;
        let remainder = a % Self::WAD_RAY_RATIO;
        if remainder >= Self::WAD_RAY_RATIO / 2 {
            result + 1
        } else {
            result
        }
    }

    pub fn wad_to_ray(a: u128) -> Result<u128, &'static str> {
        let result = a as u128 * Self::WAD_RAY_RATIO;
        if result / Self::WAD_RAY_RATIO == a {
            Ok(result)
        } else {
            Err("Overflow in wadToRay")
        }
    }
}

fn main() {
    // Example usage
    match WadRayMath::wad_mul(1e18 as u128, 2e18 as u128) {
        Ok(result) => println!("wadMul result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    match WadRayMath::wad_div(1e18 as u128, 2e18 as u128) {
        Ok(result) => println!("wadDiv result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    match WadRayMath::ray_mul(1e27 as u128, 2e27 as u128) {
        Ok(result) => println!("rayMul result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    match WadRayMath::ray_div(1e27 as u128, 2e27 as u128) {
        Ok(result) => println!("rayDiv result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("rayToWad result: {}", WadRayMath::ray_to_wad(1e27 as u128));
    match WadRayMath::wad_to_ray(1e18 as u128) {
        Ok(result) => println!("wadToRay result: {}", result),
        Err(e) => println!("Error: {}", e),
    }
}
