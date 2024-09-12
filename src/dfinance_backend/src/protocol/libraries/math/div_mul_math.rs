// pub mod div_mul_math {
//     pub const WAD: u128 = 1e18 as u128;
//     pub const HALF_WAD: u128 = 0.5e18 as u128;

//     pub const RAY: u128 = 1e27 as u128;
//     pub const HALF_RAY: u128 = 0.5e27 as u128;

//     pub const WAD_RAY_RATIO: u128 = 1e9 as u128;

//     /// Multiplies two wad, rounding half up to the nearest wad
//     pub fn wad_mul(a: u128, b: u128) -> u128 {
//         (a * b + HALF_WAD) / WAD
//     }

//     /// Divides two wad, rounding half up to the nearest wad
//     pub fn wad_div(a: u128, b: u128) -> u128 {
//         (a * WAD + b / 2) / b
//     }

//     /// Multiplies two ray, rounding half up to the nearest ray
//     pub fn ray_mul(a: u128, b: u128) -> u128 {
//         (a * b + HALF_RAY) / RAY
//     }

//     /// Divides two ray, rounding half up to the nearest ray
//     pub fn ray_div(a: u128, b: u128) -> u128 {
//         (a * RAY + b / 2) / b
//     }

//     /// Casts ray down to wad
//     pub fn ray_to_wad(a: u128) -> u128 {
//         let remainder = a % WAD_RAY_RATIO;
//         let result = a / WAD_RAY_RATIO;
//         if remainder >= WAD_RAY_RATIO / 2 {
//             result + 1
//         } else {
//             result
//         }
//     }

//     /// Converts wad up to ray
//     pub fn wad_to_ray(a: u128) -> u128 {
//         a * WAD_RAY_RATIO
//     }
// }

// #[cfg(test)]
// mod tests {
//     use super::wad_ray_math::*;

//     #[test]
//     fn test_wad_mul() {
//         let a = 2 * WAD;
//         let b = 3 * WAD;
//         let result = wad_mul(a, b);
//         assert_eq!(result, 6 * WAD);
//     }

//     #[test]
//     fn test_wad_div() {
//         let a = 6 * WAD;
//         let b = 3 * WAD;
//         let result = wad_div(a, b);
//         assert_eq!(result, 2 * WAD);
//     }

//     #[test]
//     fn test_ray_mul() {
//         let a = 2 * RAY;
//         let b = 3 * RAY;
//         let result = ray_mul(a, b);
//         assert_eq!(result, 6 * RAY);
//     }

//     #[test]
//     fn test_ray_div() {
//         let a = 6 * RAY;
//         let b = 3 * RAY;
//         let result = ray_div(a, b);
//         assert_eq!(result, 2 * RAY);
//     }

//     #[test]
//     fn test_ray_to_wad() {
//         let a = 1 * RAY;
//         let result = ray_to_wad(a);
//         assert_eq!(result, 1 * WAD);
//     }

//     #[test]
//     fn test_wad_to_ray() {
//         let a = 1 * WAD;
//         let result = wad_to_ray(a);
//         assert_eq!(result, 1 * RAY);
//     }
// }
