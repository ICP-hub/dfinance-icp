// use crate::protocol::libraries::types::datatypes::ReserveData;
// pub struct ValidationLogic;

// impl ValidationLogic {
//     pub fn validate_supply(reserve_cache: &ReserveCache, reserve: &ReserveData, amount: u128) {
//         if amount == 0 {
//             panic!("INVALID_AMOUNT");
//         }

//         let (is_active, is_frozen, _, _, is_paused) =
//             reserve_cache.reserve_configuration.get_flags();
//         if !is_active {
//             panic!("RESERVE_INACTIVE");
//         }
//         if is_paused {
//             panic!("RESERVE_PAUSED");
//         }
//         if is_frozen {
//             panic!("RESERVE_FROZEN");
//         }

//         let supply_cap = reserve_cache.reserve_configuration.get_supply_cap();
//         if supply_cap != 0 {
//             let total_supply = dToken::scaled_total_supply(&reserve_cache.a_token_address)
//                 + reserve.accrued_to_treasury as u128;
//             if total_supply.ray_mul(reserve_cache.next_liquidity_index) + amount
//                 > supply_cap * 10u128.pow(reserve_cache.reserve_configuration.get_decimals() as u32)
//             {
//                 panic!("SUPPLY_CAP_EXCEEDED");
//             }
//         }
//     }
// }
