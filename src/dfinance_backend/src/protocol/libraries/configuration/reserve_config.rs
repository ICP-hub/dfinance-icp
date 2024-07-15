use ic_cdk_macros::*;
use candid::{CandidType, Deserialize};
use crate::declarations::assets::ReserveConfigurationMap;
//add error file here

//Rust's standard library does not provide a u256 type directly. Instead, the u128 type is a 128-bit unsigned integer, which may not be sufficient to store all the configuration parameters if they require more than 128 bits.
//use external crates like ethnum or primitive-types to work with 256-bit integers in Rust.
use ethnum::U256;  //read the docs


// #[derive(CandidType, Deserialize)]
// pub struct ReserveConfigurationMap {
//     data: u128,
//     // data: U256,
// }

pub const LTV_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
// pub const LTV_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000;
pub const LIQUIDATION_THRESHOLD_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const LIQUIDATION_BONUS_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const DECIMALS_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const ACTIVE_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const FROZEN_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const BORROWING_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const STABLE_BORROWING_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const PAUSED_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const BORROWABLE_IN_ISOLATION_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const SILOED_BORROWING_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const FLASHLOAN_ENABLED_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const RESERVE_FACTOR_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const BORROW_CAP_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const SUPPLY_CAP_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const LIQUIDATION_PROTOCOL_FEE_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const EMODE_CATEGORY_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const UNBACKED_MINT_CAP_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);
pub const DEBT_CEILING_MASK: U256 = U256::from_words(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF, 0xFFFF0000FFFFFFFF);


// pub const LIQUIDATION_THRESHOLD_START_BIT_POSITION: U256 = 16;
pub const LIQUIDATION_THRESHOLD_START_BIT_POSITION: u8 = 16;
pub const LIQUIDATION_BONUS_START_BIT_POSITION: u8 = 32;
pub const RESERVE_DECIMALS_START_BIT_POSITION: u8 = 48;
pub const IS_ACTIVE_START_BIT_POSITION: u8 = 56;
pub const IS_FROZEN_START_BIT_POSITION: u8 = 57;
pub const BORROWING_ENABLED_START_BIT_POSITION: u8 = 58;
pub const STABLE_BORROWING_ENABLED_START_BIT_POSITION: u8 = 59;
pub const IS_PAUSED_START_BIT_POSITION: u8 = 60;
pub const BORROWABLE_IN_ISOLATION_START_BIT_POSITION: u8 = 61;
pub const SILOED_BORROWING_START_BIT_POSITION: u8 = 62;
pub const FLASHLOAN_ENABLED_START_BIT_POSITION: u8 = 63;
pub const RESERVE_FACTOR_START_BIT_POSITION: u8 = 64;
pub const BORROW_CAP_START_BIT_POSITION: u8 = 80;
pub const SUPPLY_CAP_START_BIT_POSITION: u8 = 116;
pub const LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION: u8 = 152;
pub const EMODE_CATEGORY_START_BIT_POSITION: u8 = 168;
pub const UNBACKED_MINT_CAP_START_BIT_POSITION: u8 = 176;
pub const DEBT_CEILING_START_BIT_POSITION: u8 = 212;

pub const MAX_VALID_LTV: u128 = 65535;
pub const MAX_VALID_LIQUIDATION_THRESHOLD: u128 = 65535;
pub const MAX_VALID_LIQUIDATION_BONUS: u128 = 65535;
pub const MAX_VALID_DECIMALS: u128 = 255;
pub const MAX_VALID_RESERVE_FACTOR: u128 = 65535;
pub const MAX_VALID_BORROW_CAP: u128 = 68719476735;
pub const MAX_VALID_SUPPLY_CAP: u128 = 68719476735;
pub const MAX_VALID_LIQUIDATION_PROTOCOL_FEE: u128 = 65535;
pub const MAX_VALID_EMODE_CATEGORY: u128 = 255;
pub const MAX_VALID_UNBACKED_MINT_CAP: u128 = 68719476735;
pub const MAX_VALID_DEBT_CEILING: u128 = 1099511627775;

pub const DEBT_CEILING_DECIMALS: u128 = 2;
pub const MAX_RESERVES_COUNT: u16 = 128;

impl ReserveConfigurationMap {
    //ensures the ltv is valid and updates the data
    
    pub fn set_ltv(&mut self, ltv: U256) {
        assert!(ltv <= MAX_VALID_LTV, "Invalid LTV");
        self.data = (self.data & LTV_MASK) | ltv;
    }
    //retrieves the Loan to Value of the reserve
   
    pub fn get_ltv(&self) -> u128 {
        self.data & !LTV_MASK
    }
     //set and get the liquidation threshold of the reserve.
    //threshold value is bit-shifted and masked appropriately to fit within the data field
    
    pub fn set_liquidation_threshold(&mut self, threshold: u128) {
        assert!(threshold <= MAX_VALID_LIQUIDATION_THRESHOLD, "Invalid liquidation threshold");
        self.data = (self.data & LIQUIDATION_THRESHOLD_MASK) | (threshold << LIQUIDATION_THRESHOLD_START_BIT_POSITION);
    }

    
    pub fn get_liquidation_threshold(&self) -> u128 {
        (self.data & !LIQUIDATION_THRESHOLD_MASK) >> LIQUIDATION_THRESHOLD_START_BIT_POSITION
    }

    
    pub fn set_liquidation_bonus(&mut self, bonus: u128) {
        assert!(bonus <= MAX_VALID_LIQUIDATION_BONUS, "Invalid liquidation bonus");
        self.data = (self.data & LIQUIDATION_BONUS_MASK) | (bonus << LIQUIDATION_BONUS_START_BIT_POSITION);
    }

    
    pub fn get_liquidation_bonus(&self) -> u128 {
        (self.data & !LIQUIDATION_BONUS_MASK) >> LIQUIDATION_BONUS_START_BIT_POSITION
    }

   
    pub fn set_decimals(&mut self, decimals: u128) {
        assert!(decimals <= MAX_VALID_DECIMALS, "Invalid decimals");
        self.data = (self.data & DECIMALS_MASK) | (decimals << RESERVE_DECIMALS_START_BIT_POSITION);
    }

    
    pub fn get_decimals(&self) -> u128 {
        (self.data & !DECIMALS_MASK) >> RESERVE_DECIMALS_START_BIT_POSITION
    }
    //When a reserve is active, it can be used for regular operations such as lending and borrowing
    
    pub fn set_active(&mut self, active: bool) {
        self.data = (self.data & ACTIVE_MASK) | ((active as u128) << IS_ACTIVE_START_BIT_POSITION);
    }

    
    pub fn get_active(&self) -> bool {
        (self.data & !ACTIVE_MASK) != 0
    }
    //Existing positions in a frozen reserve might still accrue interest, but no new deposits, withdrawals, loans, or repayments can occur
    
    pub fn set_frozen(&mut self, frozen: bool) {
        self.data = (self.data & FROZEN_MASK) | ((frozen as u128) << IS_FROZEN_START_BIT_POSITION);
    }

   
    pub fn get_frozen(&self) -> bool {
        (self.data & !FROZEN_MASK) != 0
    }
    //Pausing might be used in response to an unexpected issue or during an upgrade process.
    
    pub fn set_paused(&mut self, paused: bool) {
        self.data = (self.data & PAUSED_MASK) | ((paused as u128) << IS_PAUSED_START_BIT_POSITION);
    }

   
    pub fn get_paused(&self) -> bool {
        (self.data & !PAUSED_MASK) != 0
    }

    
    pub fn set_borrowable_in_isolation(&mut self, borrowable: bool) {
        self.data = (self.data & BORROWABLE_IN_ISOLATION_MASK) | ((borrowable as u128) << BORROWABLE_IN_ISOLATION_START_BIT_POSITION);
    }

    
    pub fn get_borrowable_in_isolation(&self) -> bool {
        (self.data & !BORROWABLE_IN_ISOLATION_MASK) != 0
    }

    pub fn set_siloed_borrowing(&mut self, siloed: bool) {
        self.data = (self.data & SILOED_BORROWING_MASK) | ((siloed as u128) << SILOED_BORROWING_START_BIT_POSITION);
    }

    
    pub fn get_siloed_borrowing(&self) -> bool {
        (self.data & !SILOED_BORROWING_MASK) != 0
    }

  
    pub fn set_borrowing_enabled(&mut self, enabled: bool) {
        self.data = (self.data & BORROWING_MASK) | ((enabled as u128) << BORROWING_ENABLED_START_BIT_POSITION);
    }

  
    pub fn get_borrowing_enabled(&self) -> bool {
        (self.data & !BORROWING_MASK) != 0
    }

    
    pub fn set_stable_rate_borrowing_enabled(&mut self, enabled: bool) {
        self.data = (self.data & STABLE_BORROWING_MASK) | ((enabled as u128) << STABLE_BORROWING_ENABLED_START_BIT_POSITION);
    }

   
    pub fn get_stable_rate_borrowing_enabled(&self) -> bool {
        (self.data & !STABLE_BORROWING_MASK) != 0
    }

   
    pub fn set_reserve_factor(&mut self, reserve_factor: u128) {
        assert!(reserve_factor <= MAX_VALID_RESERVE_FACTOR, "Invalid reserve factor");
        self.data = (self.data & RESERVE_FACTOR_MASK) | (reserve_factor << RESERVE_FACTOR_START_BIT_POSITION);
    }

    
    pub fn get_reserve_factor(&self) -> u128 {
        (self.data & !RESERVE_FACTOR_MASK) >> RESERVE_FACTOR_START_BIT_POSITION
    }

  
    pub fn set_borrow_cap(&mut self, borrow_cap: u128) {
        assert!(borrow_cap <= MAX_VALID_BORROW_CAP, "Invalid borrow cap");
        self.data = (self.data & BORROW_CAP_MASK) | (borrow_cap << BORROW_CAP_START_BIT_POSITION);
    }

   
    pub fn get_borrow_cap(&self) -> u128 {
        (self.data & !BORROW_CAP_MASK) >> BORROW_CAP_START_BIT_POSITION
    }

   
    pub fn set_supply_cap(&mut self, supply_cap: u128) {
        assert!(supply_cap <= MAX_VALID_SUPPLY_CAP, "Invalid supply cap");
        self.data = (self.data & SUPPLY_CAP_MASK) | (supply_cap << SUPPLY_CAP_START_BIT_POSITION);
    }


    pub fn get_supply_cap(&self) -> u128 {
        (self.data & !SUPPLY_CAP_MASK) >> SUPPLY_CAP_START_BIT_POSITION
    }

  
    pub fn set_debt_ceiling(&mut self, ceiling: u128) {
        assert!(ceiling <= MAX_VALID_DEBT_CEILING, "Invalid debt ceiling");
        self.data = (self.data & DEBT_CEILING_MASK) | (ceiling << DEBT_CEILING_START_BIT_POSITION);
    }

   
    pub fn get_debt_ceiling(&self) -> u128 {
        (self.data & !DEBT_CEILING_MASK) >> DEBT_CEILING_START_BIT_POSITION
    }

    
    pub fn set_liquidation_protocol_fee(&mut self, liquidation_protocol_fee: u128) {
        assert!(liquidation_protocol_fee <= MAX_VALID_LIQUIDATION_PROTOCOL_FEE, "Invalid liquidation protocol fee");
        self.data = (self.data & LIQUIDATION_PROTOCOL_FEE_MASK) | (liquidation_protocol_fee << LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION);
    }

   
    pub fn get_liquidation_protocol_fee(&self) -> u128 {
        (self.data & !LIQUIDATION_PROTOCOL_FEE_MASK) >> LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION
    }

   
    pub fn set_unbacked_mint_cap(&mut self, unbacked_mint_cap: u128) {
        assert!(unbacked_mint_cap <= MAX_VALID_UNBACKED_MINT_CAP, "Invalid unbacked mint cap");
        self.data = (self.data & UNBACKED_MINT_CAP_MASK) | (unbacked_mint_cap << UNBACKED_MINT_CAP_START_BIT_POSITION);
    }

   
    pub fn get_unbacked_mint_cap(&self) -> u128 {
        (self.data & !UNBACKED_MINT_CAP_MASK) >> UNBACKED_MINT_CAP_START_BIT_POSITION
    }

    
    pub fn set_e_mode_category(&mut self, category: u128) {
        assert!(category <= MAX_VALID_EMODE_CATEGORY, "Invalid eMode category");
        self.data = (self.data & EMODE_CATEGORY_MASK) | (category << EMODE_CATEGORY_START_BIT_POSITION);
    }

    
    pub fn get_e_mode_category(&self) -> u128 {
        (self.data & !EMODE_CATEGORY_MASK) >> EMODE_CATEGORY_START_BIT_POSITION
    }

  
    pub fn set_flash_loan_enabled(&mut self, flash_loan_enabled: bool) {
        self.data = (self.data & FLASHLOAN_ENABLED_MASK) | ((flash_loan_enabled as u128) << FLASHLOAN_ENABLED_START_BIT_POSITION);
    }

    
    pub fn get_flash_loan_enabled(&self) -> bool {
        (self.data & !FLASHLOAN_ENABLED_MASK) != 0
    }

    
    pub fn get_flags(&self) -> (bool, bool, bool, bool, bool) {
        let data_local = self.data;
        (
            (data_local & !ACTIVE_MASK) != 0,
            (data_local & !FROZEN_MASK) != 0,
            (data_local & !BORROWING_MASK) != 0,
            (data_local & !STABLE_BORROWING_MASK) != 0,
            (data_local & !PAUSED_MASK) != 0,
        )
    }

   
    pub fn get_params(&self) -> (u128, u128, u128, u128, u128, u128) {
        let data_local = self.data;
        (
            data_local & !LTV_MASK,
            (data_local & !LIQUIDATION_THRESHOLD_MASK) >> LIQUIDATION_THRESHOLD_START_BIT_POSITION,
            (data_local & !LIQUIDATION_BONUS_MASK) >> LIQUIDATION_BONUS_START_BIT_POSITION,
            (data_local & !DECIMALS_MASK) >> RESERVE_DECIMALS_START_BIT_POSITION,
            (data_local & !RESERVE_FACTOR_MASK) >> RESERVE_FACTOR_START_BIT_POSITION,
            (data_local & !EMODE_CATEGORY_MASK) >> EMODE_CATEGORY_START_BIT_POSITION,
        )
    }

   
    pub fn get_caps(&self) -> (u128, u128) {
        let data_local = self.data;
        (
            (data_local & !BORROW_CAP_MASK) >> BORROW_CAP_START_BIT_POSITION,
            (data_local & !SUPPLY_CAP_MASK) >> SUPPLY_CAP_START_BIT_POSITION,
        )
    }
}
