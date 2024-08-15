// use ethnum::U256;
// use serde::{Deserialize, Serialize};
use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::storable::{Bound, Storable};
use serde::{Serialize, Deserialize as SerdeDeserialize};



#[derive(Default, CandidType, SerdeDeserialize, Serialize, Clone, Debug)]
// #[derive(Default, Serialize, Deserialize, Clone, Debug)]
pub struct ReserveConfiguration {
    ltv: u16,
    liquidation_threshold: u16,
    liquidation_bonus: u16, //5%
    borrowing_enabled: bool, //true
    borrow_cap: u64,
    supply_cap: u64, //10M
    liquidation_protocol_fee: u16, //0
    active: bool,
    frozen: bool,
    paused: bool,
}

// pub struct ReserveConfiguration {
//     ltv: u16,
//     liquidation_threshold: u16,
//     liquidation_bonus: u16,
//     decimals: u8,
//     active: bool,
//     frozen: bool,
//     borrowing_enabled: bool,
//     stable_borrowing_enabled: bool,
//     paused: bool,
//     borrowable_in_isolation: bool,
//     siloed_borrowing: bool,
//     flashloan_enabled: bool,
//     reserve_factor: u128,
//     borrow_cap: u64,
//     supply_cap: u64,
//     liquidation_protocol_fee: u16,
//     emode_category: u8,
//     unbacked_mint_cap: u64,
//     debt_ceiling: u64,
// }

impl ReserveConfiguration {
    pub const MAX_VALID_LTV: u16 = 65535;
    pub const MAX_VALID_LIQUIDATION_THRESHOLD: u16 = 65535;
    pub const MAX_VALID_LIQUIDATION_BONUS: u16 = 65535;
    pub const MAX_VALID_DECIMALS: u8 = 255;
    pub const MAX_VALID_RESERVE_FACTOR: u128 = 65535;
    pub const MAX_VALID_BORROW_CAP: u64 = 68719476735;
    pub const MAX_VALID_SUPPLY_CAP: u64 = 68719476735;
    pub const MAX_VALID_LIQUIDATION_PROTOCOL_FEE: u16 = 65535;
    pub const MAX_VALID_EMODE_CATEGORY: u8 = 255;
    pub const MAX_VALID_UNBACKED_MINT_CAP: u64 = 68719476735;
    pub const MAX_VALID_DEBT_CEILING: u64 = 1099511627775;

    pub fn set_ltv(&mut self, ltv: u16) {
        if ltv <= Self::MAX_VALID_LTV {
            self.ltv = ltv;
        } else {
            panic!("Invalid LTV value");
        }
    }

    pub fn get_ltv(&self) -> u16 {
        self.ltv
    }

    pub fn set_liquidation_threshold(&mut self, threshold: u16) {
        if threshold <= Self::MAX_VALID_LIQUIDATION_THRESHOLD {
            self.liquidation_threshold = threshold;
        } else {
            panic!("Invalid liquidation threshold value");
        }
    }

    pub fn get_liquidation_threshold(&self) -> u16 {
        self.liquidation_threshold
    }

    pub fn set_liquidation_bonus(&mut self, bonus: u16) {
        if bonus <= Self::MAX_VALID_LIQUIDATION_BONUS {
            self.liquidation_bonus = bonus;
        } else {
            panic!("Invalid liquidation bonus value");
        }
    }

    pub fn get_liquidation_bonus(&self) -> u16 {
        self.liquidation_bonus
    }

    // pub fn set_decimals(&mut self, decimals: u8) {
    //     if decimals <= Self::MAX_VALID_DECIMALS {
    //         self.decimals = decimals;
    //     } else {
    //         panic!("Invalid decimals value");
    //     }
    // }

    // pub fn get_decimals(&self) -> u8 {
    //     self.decimals
    // }

    pub fn set_active(&mut self, active: bool) {
        self.active = active;
    }

    pub fn get_active(&self) -> bool {
        self.active
    }

    pub fn set_frozen(&mut self, frozen: bool) {
        self.frozen = frozen;
    }

    pub fn get_frozen(&self) -> bool {
        self.frozen
    }

    pub fn set_borrowing_enabled(&mut self, enabled: bool) {
        self.borrowing_enabled = enabled;
    }

    pub fn get_borrowing_enabled(&self) -> bool {
        self.borrowing_enabled
    }

    // pub fn set_stable_borrowing_enabled(&mut self, enabled: bool) {
    //     self.stable_borrowing_enabled = enabled;
    // }

    // pub fn get_stable_borrowing_enabled(&self) -> bool {
    //     self.stable_borrowing_enabled
    // }

    pub fn set_paused(&mut self, paused: bool) {
        self.paused = paused;
    }

    pub fn get_paused(&self) -> bool {
        self.paused
    }

    // pub fn set_borrowable_in_isolation(&mut self, borrowable: bool) {
    //     self.borrowable_in_isolation = borrowable;
    // }

    // pub fn get_borrowable_in_isolation(&self) -> bool {
    //     self.borrowable_in_isolation
    // }

    // pub fn set_siloed_borrowing(&mut self, siloed: bool) {
    //     self.siloed_borrowing = siloed;
    // }

    // pub fn get_siloed_borrowing(&self) -> bool {
    //     self.siloed_borrowing
    // }

    // pub fn set_flashloan_enabled(&mut self, enabled: bool) {
    //     self.flashloan_enabled = enabled;
    // }

    // pub fn get_flashloan_enabled(&self) -> bool {
    //     self.flashloan_enabled
    // }

    // pub fn set_reserve_factor(&mut self, factor: u128) {
    //     if factor <= Self::MAX_VALID_RESERVE_FACTOR {
    //         self.reserve_factor = factor;
    //     } else {
    //         panic!("Invalid reserve factor value");
    //     }
    // }

    // pub fn get_reserve_factor(&self) -> u128 {
    //     self.reserve_factor
    // }

    pub fn set_borrow_cap(&mut self, cap: u64) {
        if cap <= Self::MAX_VALID_BORROW_CAP {
            self.borrow_cap = cap;
        } else {
            panic!("Invalid borrow cap value");
        }
    }

    pub fn get_borrow_cap(&self) -> u64 {
        self.borrow_cap
    }

    pub fn set_supply_cap(&mut self, cap: u64) {
        if cap <= Self::MAX_VALID_SUPPLY_CAP {
            self.supply_cap = cap;
        } else {
            panic!("Invalid supply cap value");
        }
    }

    pub fn get_supply_cap(&self) -> u64 {
        self.supply_cap
    }

    pub fn set_liquidation_protocol_fee(&mut self, fee: u16) {
        if fee <= Self::MAX_VALID_LIQUIDATION_PROTOCOL_FEE {
            self.liquidation_protocol_fee = fee;
        } else {
            panic!("Invalid liquidation protocol fee value");
        }
    }

    pub fn get_liquidation_protocol_fee(&self) -> u16 {
        self.liquidation_protocol_fee
    }

    // pub fn set_emode_category(&mut self, category: u8) {
    //     if category <= Self::MAX_VALID_EMODE_CATEGORY {
    //         self.emode_category = category;
    //     } else {
    //         panic!("Invalid eMode category value");
    //     }
    // }

    // pub fn get_emode_category(&self) -> u8 {
    //     self.emode_category
    // }

    // pub fn set_unbacked_mint_cap(&mut self, cap: u64) {
    //     if cap <= Self::MAX_VALID_UNBACKED_MINT_CAP {
    //         self.unbacked_mint_cap = cap;
    //     } else {
    //         panic!("Invalid unbacked mint cap value");
    //     }
    // }

    // pub fn get_unbacked_mint_cap(&self) -> u64 {
    //     self.unbacked_mint_cap
    // }

    // pub fn set_debt_ceiling(&mut self, ceiling: u64) {
    //     if ceiling <= Self::MAX_VALID_DEBT_CEILING {
    //         self.debt_ceiling = ceiling;
    //     } else {
    //         panic!("Invalid debt ceiling value");
    //     }
    // }

    // pub fn get_debt_ceiling(&self) -> u64 {
    //     self.debt_ceiling
    // }

    pub fn get_flags(&self) -> (bool, bool, bool, bool) {
        (
            self.active,
            self.frozen,
            self.borrowing_enabled,
            // self.stable_borrowing_enabled,
            self.paused,
        )
    }

    // pub fn get_params(&self) -> (u16, u16, u16, u8, u128, u8) {
        pub fn get_params(&self) -> (u16, u16, u16) {
        (
            self.ltv,
            self.liquidation_threshold,
            self.liquidation_bonus,
            // self.decimals,
            // self.reserve_factor,
            // self.emode_category,
        )
    }

    pub fn get_caps(&self) -> (u64, u64) {
        (self.borrow_cap, self.supply_cap)
    }




    pub fn initialize(
        ltv: u16,
        liquidation_threshold: u16,
        liquidation_bonus: u16,
        // decimals: u8,
        active: bool,
        frozen: bool,
        borrowing_enabled: bool,
        // stable_borrowing_enabled: bool,
        paused: bool,
        // borrowable_in_isolation: bool,
        // siloed_borrowing: bool,
        // flashloan_enabled: bool,
        // reserve_factor: u128,
        borrow_cap: u64,
        supply_cap: u64,
        liquidation_protocol_fee: u16,
        // emode_category: u8,
        // unbacked_mint_cap: u64,
        // debt_ceiling: u64,
    ) -> Self {
        if ltv > Self::MAX_VALID_LTV {
            panic!("Invalid LTV value");
        }
        if liquidation_threshold > Self::MAX_VALID_LIQUIDATION_THRESHOLD {
            panic!("Invalid liquidation threshold value");
        }
        if liquidation_bonus > Self::MAX_VALID_LIQUIDATION_BONUS {
            panic!("Invalid liquidation bonus value");
        }
        // if decimals > Self::MAX_VALID_DECIMALS {
        //     panic!("Invalid decimals value");
        // }
        // if reserve_factor > Self::MAX_VALID_RESERVE_FACTOR {
        //     panic!("Invalid reserve factor value");
        // }
        if borrow_cap > Self::MAX_VALID_BORROW_CAP {
            panic!("Invalid borrow cap value");
        }
        if supply_cap > Self::MAX_VALID_SUPPLY_CAP {
            panic!("Invalid supply cap value");
        }
        if liquidation_protocol_fee > Self::MAX_VALID_LIQUIDATION_PROTOCOL_FEE {
            panic!("Invalid liquidation protocol fee value");
        }
        // if emode_category > Self::MAX_VALID_EMODE_CATEGORY {
        //     panic!("Invalid eMode category value");
        // }
        // if unbacked_mint_cap > Self::MAX_VALID_UNBACKED_MINT_CAP {
        //     panic!("Invalid unbacked mint cap value");
        // }
        // if debt_ceiling > Self::MAX_VALID_DEBT_CEILING {
        //     panic!("Invalid debt ceiling value");
        // }

        Self {
            ltv,
            liquidation_threshold,
            liquidation_bonus,
            // decimals,
            active,
            frozen,
            borrowing_enabled,
            // stable_borrowing_enabled,
            paused,
            // borrowable_in_isolation,
            // siloed_borrowing,
            // flashloan_enabled,
            // reserve_factor,
            borrow_cap,
            supply_cap,
            liquidation_protocol_fee,
            // emode_category,
            // unbacked_mint_cap,
            // debt_ceiling,
        }
    }
}


