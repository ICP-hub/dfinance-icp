use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{update, query};
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct PriceOracleSentinel {
    sequencer_oracle: RefCell<Principal>,
    grace_period: RefCell<u64>,
    addresses_provider: Principal,
}

impl PriceOracleSentinel {
    pub fn new(addresses_provider: Principal) -> Self {
        PriceOracleSentinel {
            sequencer_oracle: RefCell::new(Principal::anonymous()),
            grace_period: RefCell::new(0),
            addresses_provider,
        }
    }

    /// Returns the PoolAddressesProvider
    /// Returns the address of the PoolAddressesProvider contract
    #[query]
    pub fn addresses_provider(&self) -> Principal {
        self.addresses_provider
    }

    /// Returns true if the `borrow` operation is allowed.
    /// Operation not allowed when PriceOracle is down or grace period not passed.
    /// Returns True if the `borrow` operation is allowed, false otherwise.
    #[query]
    pub fn is_borrow_allowed(&self) -> bool {
        // Implement logic to check if borrow is allowed
        true // Placeholder value, replace with actual logic
    }

    /// Returns true if the `liquidation` operation is allowed.
    /// Operation not allowed when PriceOracle is down or grace period not passed.
    /// Returns True if the `liquidation` operation is allowed, false otherwise.
    #[query]
    pub fn is_liquidation_allowed(&self) -> bool {
        // Implement logic to check if liquidation is allowed
        true // Placeholder value, replace with actual logic
    }

    /// Updates the address of the sequencer oracle
    /// newSequencerOracle: The address of the new Sequencer Oracle to use
    #[update]
    pub fn set_sequencer_oracle(&self, new_sequencer_oracle: Principal) {
        self.sequencer_oracle.replace(new_sequencer_oracle);
        // Emit event (placeholder, implement event logic if needed)
    }

    /// Updates the duration of the grace period
    /// newGracePeriod: The value of the new grace period duration
    #[update]
    pub fn set_grace_period(&self, new_grace_period: u64) {
        self.grace_period.replace(new_grace_period);
        // Emit event (placeholder, implement event logic if needed)
    }

    /// Returns the SequencerOracle
    /// Returns the address of the sequencer oracle contract
    #[query]
    pub fn get_sequencer_oracle(&self) -> Principal {
        *self.sequencer_oracle.borrow()
    }

    /// Returns the grace period
    /// Returns the duration of the grace period
    #[query]
    pub fn get_grace_period(&self) -> u64 {
        *self.grace_period.borrow()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    #[test]
    fn test_addresses_provider() {
        let oracle = PriceOracleSentinel::new(Principal::anonymous());
        assert_eq!(oracle.addresses_provider(), Principal::anonymous());
    }

    #[test]
    fn test_is_borrow_allowed() {
        let oracle = PriceOracleSentinel::new(Principal::anonymous());
        assert!(oracle.is_borrow_allowed());
    }

    #[test]
    fn test_is_liquidation_allowed() {
        let oracle = PriceOracleSentinel::new(Principal::anonymous());
        assert!(oracle.is_liquidation_allowed());
    }

    #[test]
    fn test_set_sequencer_oracle() {
        let oracle = PriceOracleSentinel::new(Principal::anonymous());
        let new_oracle = Principal::anonymous();
        oracle.set_sequencer_oracle(new_oracle);
        assert_eq!(oracle.get_sequencer_oracle(), new_oracle);
    }

    #[test]
    fn test_set_grace_period() {
        let oracle = PriceOracleSentinel::new(Principal::anonymous());
        let new_grace_period = 100;
        oracle.set_grace_period(new_grace_period);
        assert_eq!(oracle.get_grace_period(), new_grace_period);
    }
}

