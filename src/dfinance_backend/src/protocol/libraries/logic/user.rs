// use std::collections::HashMap;

// struct CalculateUserAccountDataVars {
//     asset_price: u128,
//     asset_unit: u128,
//     user_balance_in_base_currency: u128,
//     decimals: u8,
//     ltv: u128,
//     liquidation_threshold: u128,
//     i: usize,
//     health_factor: u128,
//     total_collateral_in_base_currency: u128,
//     total_debt_in_base_currency: u128,
//     avg_ltv: u128,
//     avg_liquidation_threshold: u128,
//     e_mode_asset_price: u128,
//     e_mode_ltv: u128,
//     e_mode_liq_threshold: u128,
//     e_mode_asset_category: u8,
//     current_reserve_address: String,
//     has_zero_ltv_collateral: bool,
//     is_in_e_mode_category: bool,
// }

// struct UserConfig;
// struct ReserveData;
// struct PriceOracle;

// //make them as variable , not function
// impl UserConfig {
//     fn is_empty(&self) -> bool {
//         // Implementation to check if the user's config is empty
//         false
//     }

//     fn is_using_as_collateral_or_borrowing(&self, i: usize) -> bool {
//         // Implementation to check if the user is using this asset as collateral or borrowing
//         true
//     }

//     fn is_borrowing(&self, i: usize) -> bool {
//         // Implementation to check if the user is borrowing
//         true
//     }

//     fn is_using_as_collateral(&self, i: usize) -> bool {
//         // Implementation to check if the user is using as collateral
//         true
//     }
// }

// fn calculate_user_account_data(
//     reserves_data: &HashMap<String, ReserveData>, //asset_index
//     reserves_list: &HashMap<usize, String>, //reserve_list
//     user_config: &UserConfig,
//     price_cache: &price_cache, //price_cache
//     reserves_count: usize, // size of reserve_list
// ) -> (u128, u128, u128, u128, u128, bool) {
//     if user_config.is_empty() {
//         return (0, 0, 0, 0, u128::MAX, false);
//     }

//     let mut vars = CalculateUserAccountDataVars {
//         asset_price: 0,
//         asset_unit: 0,
//         user_balance_in_base_currency: 0,
//         decimals: 0,
//         ltv: 0,
//         liquidation_threshold: 0,
//         i: 0, //id
//         health_factor: u128::MAX,
//         total_collateral_in_base_currency: 0,
//         total_debt_in_base_currency: 0,
//         avg_ltv: 0,
//         avg_liquidation_threshold: 0,
//         asset_principal: String::new(),
//         has_zero_ltv_collateral: false,
//     };

//     while vars.i < reserves_count {
//         if !user_config.is_using_as_collateral_or_borrowing(vars.i) {
//             vars.i += 1;
//             continue;
//         }

//         let current_reserve_address = reserves_list.get(&vars.i).unwrap_or(&String::new()).clone();
//         if current_reserve_address.is_empty() {
//             vars.i += 1;
//             continue;
//         }

//         let current_reserve = reserves_data.get(&current_reserve_address).unwrap();

//         // Fetch LTV, liquidation threshold, etc.
//         let (ltv, liquidation_threshold, decimals, e_mode_asset_category) = (80, 50, 18, 0); // example values

//         vars.asset_unit = 10_u128.pow(decimals as u32);
//         vars.asset_price = 30000; // Example price in base currency for ckBTC or other assets

//         // Add to collateral if using as collateral
//         if liquidation_threshold != 0 && user_config.is_using_as_collateral(vars.i) {
//             let user_balance_in_base_currency = 50000; // Example user balance
//             vars.total_collateral_in_base_currency += user_balance_in_base_currency;

//             if ltv != 0 {
//                 vars.avg_ltv += user_balance_in_base_currency * ltv;
//             } else {
//                 vars.has_zero_ltv_collateral = true;
//             }

//             vars.avg_liquidation_threshold += user_balance_in_base_currency * liquidation_threshold;
//         }

//         // Add to debt if borrowing
//         if user_config.is_borrowing(vars.i) {
//             vars.total_debt_in_base_currency += 20000; // Example user debt
//         }

//         vars.i += 1;
//     }

//     if vars.total_collateral_in_base_currency != 0 {
//         vars.avg_ltv /= vars.total_collateral_in_base_currency;
//         vars.avg_liquidation_threshold /= vars.total_collateral_in_base_currency;
//     }

//     if vars.total_debt_in_base_currency != 0 {
//         vars.health_factor = vars
//             .total_collateral_in_base_currency
//             .saturating_mul(vars.avg_liquidation_threshold)
//             .checked_div(vars.total_debt_in_base_currency)
//             .unwrap_or(u128::MAX);
//     }

//     (
//         vars.total_collateral_in_base_currency,
//         vars.total_debt_in_base_currency,
//         vars.avg_ltv,
//         vars.avg_liquidation_threshold,
//         vars.health_factor,
//         vars.has_zero_ltv_collateral,
//     )
// }

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::query;
use num_traits::cast::ToPrimitive;

use crate::{
    api::{
        functions::get_balance,
        state_handler::{mutate_state, read_state},
    },
    declarations::assets::ReserveData,
    protocol::libraries::{
        math::{calculate::get_exchange_rates, math_utils::ScalingMath},
        types::datatypes::UserReserveData,
    },
};

use super::{
    reserve::{user_normalized_debt, user_normalized_supply},
    update::user_data,
};

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserConfig {
    pub collateral: bool,
    pub borrowing: bool,
}

impl UserConfig {
    pub fn is_empty(&self) -> bool {
        !self.collateral && !self.borrowing
    }
    pub fn is_using_as_collateral(&self) -> bool {
        self.collateral
    }
    pub fn is_borrowing(&self) -> bool {
        self.borrowing
    }
}

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserAccountDataParams {
    pub user: String,
    pub user_config: UserConfig,
    pub reserves_count: usize,
}

pub struct GenericLogic;

impl GenericLogic {
    pub async fn calculate_user_account_data(
        params: UserAccountDataParams,
    ) -> Result<(u128, u128, u128, u128, u128, bool), String> {
        ic_cdk::println!("Starting calculation for user: {}", params.user);
    
        let user_principal = Principal::from_text(&params.user).unwrap();
        ic_cdk::println!("Principal of the user: {:?}", user_principal);
    
        let user_data_result = user_data(user_principal);
        ic_cdk::println!("Fetching user data...");
    
        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error fetching user data: {}", e);
                return Err(e);
            }
        };
    
        if user_data.reserves.is_none() {
            ic_cdk::println!("No reserves found for the user.");
            return Ok((0, 0, 0, 0, u128::MAX, false));
        }
    
        // Ensure reserves exist for the user
        let user_data_reserves = user_data
            .reserves
            .as_ref()
            .ok_or_else(|| format!("Reserves not found for user"))?;
        ic_cdk::println!("User reserves found: {:?}", user_data_reserves);
    
        let mut total_collateral = 0u128;
        let mut total_debt = 0u128;
        let mut avg_ltv = 0u128;
        let mut avg_liquidation_threshold = 0u128;
        let mut has_zero_ltv_collateral = false;
    
        for (_reserve_name, user_reserve_data) in user_data_reserves.iter() {
            ic_cdk::println!("Processing reserve: {:?}", user_reserve_data);
    
            let asset_price_result =
                get_exchange_rates(user_reserve_data.reserve.clone(), None, 100000000).await;
    
            let asset_price = match asset_price_result {
                Ok((amount, _)) => amount,
                Err(err) => {
                    ic_cdk::println!("Error fetching asset price for {}: {}", user_reserve_data.reserve, err);
                    return Err(err);
                }
            };
            ic_cdk::println!(
                "Asset price for reserve '{}': {}",
                user_reserve_data.reserve,
                asset_price
            );
    
            if user_reserve_data.is_collateral {
                ic_cdk::println!("Reserve '{}' is collateral.", user_reserve_data.reserve);
                
                let user_balance = Self::get_user_balance_in_base_currency(
                    user_principal,
                    &user_reserve_data,
                    asset_price,
                )
                .await;
    
                ic_cdk::println!("User balance for collateral reserve '{}': {}", user_reserve_data.reserve, user_balance);
    
                total_collateral += user_balance;
                ic_cdk::println!("Total collateral so far: {}", total_collateral);
    
                if user_data.ltv.unwrap() != 0 {
                    avg_ltv += user_balance.scaled_mul(user_data.ltv.unwrap() as u128);
                    ic_cdk::println!("Average LTV updated to: {}", avg_ltv);
                } else {
                    has_zero_ltv_collateral = true;
                    ic_cdk::println!("Reserve '{}' has zero LTV collateral.", user_reserve_data.reserve);
                }
    
                avg_liquidation_threshold +=
                    user_balance.scaled_mul(user_normalized_debt(user_reserve_data.clone()).unwrap());
                ic_cdk::println!("Average liquidation threshold updated to: {}", avg_liquidation_threshold);
            }
    
            if user_reserve_data.is_borrowed {
                ic_cdk::println!("Reserve '{}' is borrowed.", user_reserve_data.reserve);
                
                let user_debt = Self::get_user_debt_in_base_currency(
                    user_principal,
                    &user_reserve_data,
                    asset_price,
                )
                .await;
                total_debt += user_debt;
                ic_cdk::println!("Total debt for borrowed reserve '{}': {}", user_reserve_data.reserve, total_debt);
            }
        }
    
        ic_cdk::println!(
            "Total collateral: {}, Total debt: {}, Avg LTV: {}, Avg Liquidation Threshold: {}",
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold
        );
    
        avg_ltv = if total_collateral != 0 {
            avg_ltv / total_collateral
        } else {
            0
        };
        ic_cdk::println!("Final Avg LTV: {}", avg_ltv);
    
        avg_liquidation_threshold = if total_collateral != 0 {
            avg_liquidation_threshold / total_collateral
        } else {
            0
        };
        ic_cdk::println!("Final Avg Liquidation Threshold: {}", avg_liquidation_threshold);
    
        let health_factor = if total_debt == 0 {
            ic_cdk::println!("Health factor: No debt, setting to MAX.");
            u128::MAX
        } else {
            (total_collateral * avg_liquidation_threshold) / total_debt
        };
        ic_cdk::println!("Calculated Health Factor: {}", health_factor);
    
        ic_cdk::println!(
            "Final calculated values: total_collateral = {}, total_debt = {}, avg_ltv = {}, avg_liquidation_threshold = {}, health_factor = {}, has_zero_ltv_collateral = {}",
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral
        );
    
        Ok((
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral,
        ))
    }
    

    pub async fn get_user_balance_in_base_currency(
        user_principal: Principal,
        reserve: &UserReserveData,
        asset_price: u128,
    ) -> u128 {
        // Simulate fetching user bto_i128(scaled balance multiplied by normalized income)
        let d_token_canister_principal =
            Principal::from_text(reserve.d_token_canister.clone()).unwrap();
        let get_balance_value: Nat = get_balance(d_token_canister_principal, user_principal).await; // fetch from d token balance of user

        let nat_convert_value: Result<u128, String> = nat_to_u128(get_balance_value);

        let user_scaled_balance = match nat_convert_value {
            Ok(amount) => amount,
            Err(_) => {
                return 0;
            }
        };
        // Ask : get normailse incone function does not exist.
        user_scaled_balance
            .scaled_mul(user_normalized_supply(reserve.clone()).unwrap())
            .scaled_mul(asset_price)
    }

   pub async fn get_user_debt_in_base_currency(
        user_principal: Principal,
        reserve: &UserReserveData,
        asset_price: u128,
    ) -> u128 {
        let debt_token_canister_principal =
            Principal::from_text(reserve.debt_token_canister.clone()).unwrap();
        let get_balance_value = get_balance(debt_token_canister_principal, user_principal).await; // fetch from d token balance of user

        let nat_convert_value: Result<u128, String> = nat_to_u128(get_balance_value);

        let mut user_variable_debt = match nat_convert_value {
            Ok(amount) => amount,
            Err(_) => {
                return 0;
            }
        };
        //let mut user_variable_debt: u128 = 1_000_000;
        if user_variable_debt != 0 {
            user_variable_debt =
                user_variable_debt.scaled_mul(user_normalized_debt(reserve.clone()).unwrap());
        }

        user_variable_debt.scaled_mul(asset_price)
    }
}

pub fn nat_to_u128(n: Nat) -> Result<u128, String> {
    n.0.to_u128()
        .ok_or_else(|| "Conversion failed: Nat is too large for u128.".to_string())
}
