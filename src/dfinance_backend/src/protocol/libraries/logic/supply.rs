// use std::collections::HashMap;
// use crate::declarations::assets::ExecuteSupplyParams;

// use crate::protocol::libraries::{
//     logic::validation::*,
//     types::datatypes::{ExecuteSupplyParams, ReserveData, UserConfigurationMap},
// };

// struct SupplyLogic;

// impl SupplyLogic {
//     pub fn execute_supply(
//         reserves_data: &mut HashMap<String, ReserveData>,
//         reserves_list: &mut HashMap<u64, String>,
//         user_config: &mut UserConfigurationMap,
//         params: ExecuteSupplyParams,
//     ) {
//         let reserve = reserves_data.get_mut(&params.asset).unwrap();
//         let reserve_cache = reserve.cache();

//         reserve.update_state(&reserve_cache);

//         ValidationLogic::validate_supply(&reserve_cache, reserve, params.amount);

//         reserve.update_interest_rates(&reserve_cache, &params.asset, params.amount, 0);

//         safe_icrc2::gpv2_safe_icrc2::safe_transfer_from(
//             &params.asset,
//             &reserve_cache.a_token_address,
//             params.amount,
//         );

//         let is_first_supply = d_token::mint(
//             &reserve_cache.a_token_address,
//             &params.user,
//             &params.on_behalf_of,
//             params.amount,
//             reserve_cache.next_liquidity_index,
//         );

//         if is_first_supply {
//             if ValidationLogic::validate_automatic_use_as_collateral(
//                 reserves_data,
//                 reserves_list,
//                 user_config,
//                 &reserve_cache.reserve_configuration,
//                 &reserve_cache.a_token_address,
//             ) {
//                 user_config.set_using_as_collateral(reserve.id, true);
//                 println!(
//                     "{:?}",
//                     ReserveUsedAsCollateralEnabled {
//                         reserve: params.asset.clone(),
//                         user: params.on_behalf_of.clone(),
//                     }
//                 );
//             }
//         }

//         println!(
//             "{:?}",
//             Supply {
//                 reserve: params.asset.clone(),
//                 user: params.user.clone(),
//                 on_behalf_of: params.on_behalf_of.clone(),
//                 amount: params.amount,
//                 referral_code: params.referral_code,
//             }
//         );
//     }
// }