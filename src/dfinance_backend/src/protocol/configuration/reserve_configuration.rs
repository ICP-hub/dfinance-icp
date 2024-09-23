
// use candid::CandidType;
// use ic_stable_structures::storable::{Bound, Storable};
// use serde::{Deserialize as SerdeDeserialize, Serialize};

// #[derive(Default, CandidType, SerdeDeserialize, Serialize, Clone, Debug)]
// pub struct ReserveConfiguration {
//     ltv: u16,
//     liquidation_threshold: u16,
//     liquidation_bonus: u16,  //5%
//     borrowing_enabled: bool, //true
//     borrow_cap: u64,
//     supply_cap: u64,               //10M
//     liquidation_protocol_fee: u16, //0
//     active: bool,
//     frozen: bool,
//     paused: bool,
// }

// impl ReserveConfiguration {
//     pub const MAX_VALID_LTV: u16 = 65535;
//     pub const MAX_VALID_LIQUIDATION_THRESHOLD: u16 = 65535;
//     pub const MAX_VALID_LIQUIDATION_BONUS: u16 = 65535;
//     pub const MAX_VALID_BORROW_CAP: u64 = 68719476735;
//     pub const MAX_VALID_SUPPLY_CAP: u64 = 68719476735;
//     pub const MAX_VALID_LIQUIDATION_PROTOCOL_FEE: u16 = 65535;


//     pub fn set_ltv(&mut self, ltv: u16) {
//         if ltv <= Self::MAX_VALID_LTV {
//             self.ltv = ltv;
//         } else {
//             panic!("Invalid LTV value");
//         }
//     }

//     pub fn get_ltv(&self) -> u16 {
//         self.ltv
//     }

//     pub fn set_liquidation_threshold(&mut self, threshold: u16) {
//         if threshold <= Self::MAX_VALID_LIQUIDATION_THRESHOLD {
//             self.liquidation_threshold = threshold;
//         } else {
//             panic!("Invalid liquidation threshold value");
//         }
//     }

//     pub fn get_liquidation_threshold(&self) -> u16 {
//         self.liquidation_threshold
//     }

//     pub fn set_liquidation_bonus(&mut self, bonus: u16) {
//         if bonus <= Self::MAX_VALID_LIQUIDATION_BONUS {
//             self.liquidation_bonus = bonus;
//         } else {
//             panic!("Invalid liquidation bonus value");
//         }
//     }

//     pub fn get_liquidation_bonus(&self) -> u16 {
//         self.liquidation_bonus
//     }

//     pub fn set_active(&mut self, active: bool) {
//         self.active = active;
//     }

//     pub fn get_active(&self) -> bool {
//         self.active
//     }

//     pub fn set_frozen(&mut self, frozen: bool) {
//         self.frozen = frozen;
//     }

//     pub fn get_frozen(&self) -> bool {
//         self.frozen
//     }

//     pub fn set_borrowing_enabled(&mut self, enabled: bool) {
//         self.borrowing_enabled = enabled;
//     }

//     pub fn get_borrowing_enabled(&self) -> bool {
//         self.borrowing_enabled
//     }

//     pub fn set_paused(&mut self, paused: bool) {
//         self.paused = paused;
//     }

//     pub fn get_paused(&self) -> bool {
//         self.paused
//     }

    
//     pub fn set_borrow_cap(&mut self, cap: u64) {
//         if cap <= Self::MAX_VALID_BORROW_CAP {
//             self.borrow_cap = cap;
//         } else {
//             panic!("Invalid borrow cap value");
//         }
//     }

//     pub fn get_borrow_cap(&self) -> u64 {
//         self.borrow_cap
//     }

//     pub fn set_supply_cap(&mut self, cap: u64) {
//         if cap <= Self::MAX_VALID_SUPPLY_CAP {
//             self.supply_cap = cap;
//         } else {
//             panic!("Invalid supply cap value");
//         }
//     }

//     pub fn get_supply_cap(&self) -> u64 {
//         self.supply_cap
//     }

//     pub fn set_liquidation_protocol_fee(&mut self, fee: u16) {
//         if fee <= Self::MAX_VALID_LIQUIDATION_PROTOCOL_FEE {
//             self.liquidation_protocol_fee = fee;
//         } else {
//             panic!("Invalid liquidation protocol fee value");
//         }
//     }

//     pub fn get_liquidation_protocol_fee(&self) -> u16 {
//         self.liquidation_protocol_fee
//     }


//     pub fn get_flags(&self) -> (bool, bool, bool, bool) {
//         (
//             self.active,
//             self.frozen,
//             self.borrowing_enabled,
//             self.paused,
//         )
//     }

 
//     pub fn get_params(&self) -> (u16, u16, u16) {
//         (
//             self.ltv,
//             self.liquidation_threshold,
//             self.liquidation_bonus,
//         )
//     }

//     pub fn get_caps(&self) -> (u64, u64) {
//         (self.borrow_cap, self.supply_cap)
//     }

//     pub fn initialize(
//         ltv: u16,
//         liquidation_threshold: u16,
//         liquidation_bonus: u16,
//         active: bool,
//         frozen: bool,
//         borrowing_enabled: bool,
//         paused: bool,
//         borrow_cap: u64,
//         supply_cap: u64,
//         liquidation_protocol_fee: u16,
//     ) -> Self {
//         if ltv > Self::MAX_VALID_LTV {
//             panic!("Invalid LTV value");
//         }
//         if liquidation_threshold > Self::MAX_VALID_LIQUIDATION_THRESHOLD {
//             panic!("Invalid liquidation threshold value");
//         }
//         if liquidation_bonus > Self::MAX_VALID_LIQUIDATION_BONUS {
//             panic!("Invalid liquidation bonus value");
//         }
//         if borrow_cap > Self::MAX_VALID_BORROW_CAP {
//             panic!("Invalid borrow cap value");
//         }
//         if supply_cap > Self::MAX_VALID_SUPPLY_CAP {
//             panic!("Invalid supply cap value");
//         }
//         if liquidation_protocol_fee > Self::MAX_VALID_LIQUIDATION_PROTOCOL_FEE {
//             panic!("Invalid liquidation protocol fee value");
//         }
        

//         Self {
//             ltv,
//             liquidation_threshold,
//             liquidation_bonus,
//             active,
//             frozen,
//             borrowing_enabled,
//             paused,
//             borrow_cap,
//             supply_cap,
//             liquidation_protocol_fee,
//         }
//     }
// }
