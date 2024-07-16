// use crate::constants::errors::Error;
// use crate::declarations::assets::{ReserveCache, ReserveData};

// pub struct ValidationLogic;

// impl ValidationLogic {
//     pub fn validate_supply(reserve_cache: &ReserveCache, reserve: &ReserveData, amount: u128) {
//         if amount == 0 {
//             panic!("{:?}", Error::InvalidAmount);
//         }
//         let (is_active, is_frozen, _, _, is_paused) =
//             reserve_cache.reserve_configuration.get_flags(); // TODO

//         if !is_active {
//             panic!("{:?}", Error::ReserveInactive);
//         }
//         if is_paused {
//             panic!("{:?}", Error::ReservePaused);
//         }
//         if is_frozen {
//             panic!("{:?}", Error::ReserveFrozen);
//         }

//         let supply_cap = reserve_cache.reserve_configuration.get_supply_cap(); // TODO

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
