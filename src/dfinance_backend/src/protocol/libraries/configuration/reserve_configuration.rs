// use ethnum::U256;
use serde::{Deserialize, Serialize};

#[derive(Default, Serialize, Deserialize, Clone, Debug)]
pub struct ReserveConfiguration {
    ltv: u16,
    liquidation_threshold: u16,
    liquidation_bonus: u16,
    decimals: u8,
    active: bool,
    frozen: bool,
    borrowing_enabled: bool,
    stable_borrowing_enabled: bool,
    paused: bool,
    borrowable_in_isolation: bool,
    siloed_borrowing: bool,
    flashloan_enabled: bool,
    reserve_factor: u16,
    borrow_cap: u64,
    supply_cap: u64,
    liquidation_protocol_fee: u16,
    emode_category: u8,
    unbacked_mint_cap: u64,
    debt_ceiling: u64,
}

impl ReserveConfiguration {
    pub const MAX_VALID_LTV: u16 = 65535;
    pub const MAX_VALID_LIQUIDATION_THRESHOLD: u16 = 65535;
    pub const MAX_VALID_LIQUIDATION_BONUS: u16 = 65535;
    pub const MAX_VALID_DECIMALS: u8 = 255;
    pub const MAX_VALID_RESERVE_FACTOR: u16 = 65535;
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

    pub fn set_decimals(&mut self, decimals: u8) {
        if decimals <= Self::MAX_VALID_DECIMALS {
            self.decimals = decimals;
        } else {
            panic!("Invalid decimals value");
        }
    }

    pub fn get_decimals(&self) -> u8 {
        self.decimals
    }

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

    pub fn set_stable_borrowing_enabled(&mut self, enabled: bool) {
        self.stable_borrowing_enabled = enabled;
    }

    pub fn get_stable_borrowing_enabled(&self) -> bool {
        self.stable_borrowing_enabled
    }

    pub fn set_paused(&mut self, paused: bool) {
        self.paused = paused;
    }

    pub fn get_paused(&self) -> bool {
        self.paused
    }

    pub fn set_borrowable_in_isolation(&mut self, borrowable: bool) {
        self.borrowable_in_isolation = borrowable;
    }

    pub fn get_borrowable_in_isolation(&self) -> bool {
        self.borrowable_in_isolation
    }

    pub fn set_siloed_borrowing(&mut self, siloed: bool) {
        self.siloed_borrowing = siloed;
    }

    pub fn get_siloed_borrowing(&self) -> bool {
        self.siloed_borrowing
    }

    pub fn set_flashloan_enabled(&mut self, enabled: bool) {
        self.flashloan_enabled = enabled;
    }

    pub fn get_flashloan_enabled(&self) -> bool {
        self.flashloan_enabled
    }

    pub fn set_reserve_factor(&mut self, factor: u16) {
        if factor <= Self::MAX_VALID_RESERVE_FACTOR {
            self.reserve_factor = factor;
        } else {
            panic!("Invalid reserve factor value");
        }
    }

    pub fn get_reserve_factor(&self) -> u16 {
        self.reserve_factor
    }

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

    pub fn set_emode_category(&mut self, category: u8) {
        if category <= Self::MAX_VALID_EMODE_CATEGORY {
            self.emode_category = category;
        } else {
            panic!("Invalid eMode category value");
        }
    }

    pub fn get_emode_category(&self) -> u8 {
        self.emode_category
    }

    pub fn set_unbacked_mint_cap(&mut self, cap: u64) {
        if cap <= Self::MAX_VALID_UNBACKED_MINT_CAP {
            self.unbacked_mint_cap = cap;
        } else {
            panic!("Invalid unbacked mint cap value");
        }
    }

    pub fn get_unbacked_mint_cap(&self) -> u64 {
        self.unbacked_mint_cap
    }

    pub fn set_debt_ceiling(&mut self, ceiling: u64) {
        if ceiling <= Self::MAX_VALID_DEBT_CEILING {
            self.debt_ceiling = ceiling;
        } else {
            panic!("Invalid debt ceiling value");
        }
    }

    pub fn get_debt_ceiling(&self) -> u64 {
        self.debt_ceiling
    }

    pub fn get_flags(&self) -> (bool, bool, bool, bool, bool) {
        (
            self.active,
            self.frozen,
            self.borrowing_enabled,
            self.stable_borrowing_enabled,
            self.paused,
        )
    }

    pub fn get_params(&self) -> (u16, u16, u16, u8, u16, u8) {
        (
            self.ltv,
            self.liquidation_threshold,
            self.liquidation_bonus,
            self.decimals,
            self.reserve_factor,
            self.emode_category,
        )
    }

    pub fn get_caps(&self) -> (u64, u64) {
        (self.borrow_cap, self.supply_cap)
    }
}

