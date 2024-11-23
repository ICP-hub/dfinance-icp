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




use ic_cdk::export::candid::{CandidType, Deserialize};
use std::collections::HashMap;




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
    pub fn calculate_user_account_data(
        reserves_data: &HashMap<String, ReserveData>,//remove
        reserves_list: &HashMap<usize, String>,//remove
        params: UserAccountDataParams,
    ) -> (u128, u128, u128, u128, u128, bool) {
        let user_principal = Principal::from_text(params.user);
        if params.user_config.is_empty() {
            return (0, 0, 0, 0, u128::MAX, false);
        }

        let mut total_collateral = 0u128;
        let mut total_debt = 0u128;
        let mut avg_ltv = 0u128;
        let mut avg_liquidation_threshold = 0u128;
        let mut has_zero_ltv_collateral = false;
        //caller -> fetch userdata
        //while reserves
        for i in 0..params.reserves_count {
            let reserve_principal = reserves_list.get(&i).unwrap_or(&String::new());
            if reserve_principal.is_empty() {
                continue;
            }
            //reserve ->name 
            if let Some(reserve) = reserves_data.get(reserve_principal) {
                if params.user_config.is_using_as_collateral() {
                    let asset_price = Self::get_exchange_rates(
                        reserve_name, amount //1*10^8
                    );
     
                    let user_balance = Self::get_user_balance_in_base_currency(
                        &params.user,
                        reserve,
                        asset_price,
                    );

                    total_collateral += user_balance;
                    if reserve.ltv != 0 {
                        avg_ltv += user_balance * reserve.ltv as u128;
                    } else {
                        has_zero_ltv_collateral = true;
                    }

                    avg_liquidation_threshold += user_balance * reserve.normalized_debt as u128;
                }

                if params.user_config.is_borrowing() {
                    let user_debt = Self::get_user_debt_in_base_currency(
                        &params.user,
                        reserve,
                        reserve.normalized_income,
                    );
                    total_debt += user_debt;
                }
            }
        }

        avg_ltv = if total_collateral != 0 {
            avg_ltv / total_collateral
        } else {
            0
        };

        avg_liquidation_threshold = if total_collateral != 0 {
            avg_liquidation_threshold / total_collateral
        } else {
            0
        };

        let health_factor = if total_debt == 0 {
            u128::MAX
        } else {
            total_collateral
                .saturating_mul(avg_liquidation_threshold)
                / total_debt
        };

        (
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral,
        )
    }



    fn get_user_balance_in_base_currency(
        user: &String,
        reserve: &ReserveData,
        asset_price: u128,
    ) -> u128 {
        // Simulate fetching user balance (scaled balance multiplied by normalized income)
        let user_scaled_balance = 1_000_000; // fetch from d token balance of user
        user_scaled_balance.scaled_mul(reserve.get_normalize_income()).scaled_mul(asset_price)
    }

    fn get_user_debt_in_base_currency(
        user: &String,
        reserve: &ReserveData,
        asset_price: u128,
    ) -> u128 {
       // let user_variable_debt = //balance of user dtoken;
        //  if (user_variable_debt != 0) {
        //     user_variable_debt = user_variable_debt.scaled_mul(reserve.get_normalized_debt());
        //   }
      
        
        user_variable_debt.scaled_mul(asset_price)
    }
}
