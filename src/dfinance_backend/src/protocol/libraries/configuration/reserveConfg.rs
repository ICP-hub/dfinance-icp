use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk_macros::update;

#[derive(CandidType, Deserialize)]
pub struct ReserveConfiguration {
    data: u64,
}

const MAX_VALID_LTV: u64 = 0xFFFFFFFFFFFFFFFF;
const LTV_MASK: u64 = 0xFFFFFFFFFFFFFFFF;

const MAX_VALID_LIQUIDATION_THRESHOLD: u64 = 0xFFFFFFFFFFFFFFFF;
const LIQUIDATION_THRESHOLD_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const LIQUIDATION_THRESHOLD_START_BIT_POSITION: u64 = 16;

// // //
const MAX_VALID_LIQUIDATION_BONUS: u64 = 10000; // Example value
const LIQUIDATION_BONUS_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const LIQUIDATION_BONUS_START_BIT_POSITION: u64 = 0;

const MAX_VALID_DECIMALS: u64 = 18; // Example value
const DECIMALS_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const RESERVE_DECIMALS_START_BIT_POSITION: u64 = 0;

const ACTIVE_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const IS_ACTIVE_START_BIT_POSITION: u64 = 0;

const FROZEN_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const IS_FROZEN_START_BIT_POSITION: u64 = 0;

const PAUSED_MASK: u64 = 0xFFFFFFFFFFFFFFFF;
const IS_PAUSED_START_BIT_POSITION: u64 = 0;
// // //

impl ReserveConfiguration {
    #[update]
    //ensures the ltv is valid and updates the data
    pub fn set_ltv(&mut self, ltv: u64) {
        assert!(ltv <= MAX_VALID_LTV, "Invalid LTV");
        self.data = (self.data & LTV_MASK) | ltv;
    }

    //retrieves the Loan to Value of the reserve
    #[query]
    pub fn get_ltv(&self) -> u64 {
        self.data & !LTV_MASK
    }

    //set and get the liquidation threshold of the reserve.
    //threshold value is bit-shifted and masked appropriately to fit within the data field
    #[update]
    pub fn set_liquidation_threshold(&mut self, threshold: u64) {
        assert!(
            threshold <= MAX_VALID_LIQUIDATION_THRESHOLD,
            "Invalid Liquidation Threshold"
        );
        self.data = (self.data & LIQUIDATION_THRESHOLD_MASK)
            | (threshold << LIQUIDATION_THRESHOLD_START_BIT_POSITION);
    }

    #[query]
    pub fn get_liquidation_threshold(&self) -> u64 {
        (self.data & !LIQUIDATION_THRESHOLD_MASK) >> LIQUIDATION_THRESHOLD_START_BIT_POSITION
    }

    #[update]
    pub fn set_liquidation_bonus(self: &mut ReserveConfigurationMap, bonus: u64) {
        assert!(
            bonus > MAX_VALID_LIQUIDATION_BONUS,
            "Invalid Liquidation bonus"
        );

        self.data =
            (self.data & LIQUIDATION_BONUS_MASK) | (bonus << LIQUIDATION_BONUS_START_BIT_POSITION);
    }

    #[query]
    pub fn get_liquidation_bonus(self: &ReserveConfigurationMap) -> u64 {
        (self.data & !LIQUIDATION_BONUS_MASK) >> LIQUIDATION_BONUS_START_BIT_POSITION
    }

    #[update]
    pub fn set_decimals(self: &mut ReserveConfigurationMap, decimals: u64) {
        assert!(decimals > MAX_VALID_DECIMALS, "Invalid decimal");
        // if decimals > MAX_VALID_DECIMALS {
        //     panic!("{}", Errors::INVALID_DECIMALS);
        // }
        self.data = (self.data & DECIMALS_MASK) | (decimals << RESERVE_DECIMALS_START_BIT_POSITION);

        #[query]
        pub fn get_decimals(self: &ReserveConfigurationMap) -> u64 {
            (self.data & !DECIMALS_MASK) >> RESERVE_DECIMALS_START_BIT_POSITION
        }
        
        //When a reserve is active, it can be used for regular operations such as lending and borrowing
        #[update]
        pub fn set_active(self: &mut ReserveConfigurationMap, active: bool) {
            self.data =
                (self.data & ACTIVE_MASK) | ((active as u64) << IS_ACTIVE_START_BIT_POSITION);
        }

        #[query]
        pub fn get_active(self: &ReserveConfigurationMap) -> bool {
            (self.data & !ACTIVE_MASK) != 0
        }
        
        //Existing positions in a frozen reserve might still accrue interest, but no new deposits, withdrawals, loans, or repayments can occur
        #[update]
        pub fn set_frozen(self: &mut ReserveConfigurationMap, frozen: bool) {
            self.data =
                (self.data & FROZEN_MASK) | ((frozen as u64) << IS_FROZEN_START_BIT_POSITION);
        }

        #[query]
        pub fn get_frozen(self: &ReserveConfigurationMap) -> bool {
            (self.data & !FROZEN_MASK) != 0
        }
        
        //Pausing might be used in response to an unexpected issue or during an upgrade process.
        #[update]
        pub fn set_paused(self: &mut ReserveConfigurationMap, paused: bool) {
            self.data =
                (self.data & PAUSED_MASK) | ((paused as u64) << IS_PAUSED_START_BIT_POSITION);
        }

        #[query]
        pub fn get_paused(self: &ReserveConfigurationMap) -> bool {
            (self.data & !PAUSED_MASK) != 0
        }
    }
}
