use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::context::*;
use crate::errors::*;
use crate::icredit_delegation_token::*;
use crate::protocol::tokenization::base::eip712base::*;
use crate::versioned_initializable::*;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct BorrowAllowanceDelegatedEvent {
    pub delegator: Principal,
    pub delegatee: Principal,
    pub underlying_asset: Principal,
    pub amount: u64,
}

pub trait DebtTokenBase:
    VersionedInitializable + EIP712Base + Context + ICreditDelegationToken
{
    fn new(underlying_asset: Principal) -> Self;
    fn approve_delegation(&self, delegatee: Principal, amount: u64);
    fn delegation_with_sig(
        &self,
        delegator: Principal,
        delegatee: Principal,
        value: u64,
        deadline: u64,
        v: u8,
        r: [u8; 32],
        s: [u8; 32],
    );
    fn borrow_allowance(&self, from_user: Principal, to_user: Principal) -> u64;
    fn _approve_delegation(&self, delegator: Principal, delegatee: Principal, amount: u64);
    fn _decrease_borrow_allowance(&self, delegator: Principal, delegatee: Principal, amount: u64);
    fn hash_eip712_message(
        domain_separator: [u8; 32],
        delegator: Principal,
        delegatee: Principal,
        value: u64,
        nonce: u64,
        deadline: u64,
    ) -> [u8; 32];
    fn recover(digest: [u8; 32], v: u8, r: [u8; 32], s: [u8; 32]) -> Principal;
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct DebtTokenBaseImpl {
    underlying_asset: Principal,
    borrow_allowances: RefCell<HashMap<Principal, HashMap<Principal, u64>>>,
    nonces: RefCell<HashMap<Principal, u64>>,
}

impl VersionedInitializable for DebtTokenBaseImpl {}
impl EIP712Base for DebtTokenBaseImpl {}
impl Context for DebtTokenBaseImpl {}
impl ICreditDelegationToken for DebtTokenBaseImpl {}

impl DebtTokenBase for DebtTokenBaseImpl {
    fn new(underlying_asset: Principal) -> Self {
        Self {
            underlying_asset,
            borrow_allowances: RefCell::new(HashMap::new()),
            nonces: RefCell::new(HashMap::new()),
        }
    }

    fn approve_delegation(&self, delegatee: Principal, amount: u64) {
        self._approve_delegation(self._msg_sender(), delegatee, amount);
    }

    fn delegation_with_sig(
        &self,
        delegator: Principal,
        delegatee: Principal,
        value: u64,
        deadline: u64,
        v: u8,
        r: [u8; 32],
        s: [u8; 32],
    ) {
        assert!(
            delegator != Principal::anonymous(),
            Errors::ZERO_ADDRESS_NOT_VALID
        );
        assert!(api::time() <= deadline, Errors::INVALID_EXPIRATION);

        let current_valid_nonce = self.nonces.borrow().get(&delegator).cloned().unwrap_or(0);
        let domain_separator = self.domain_separator();
        let digest = Self::hash_eip712_message(
            domain_separator,
            delegator,
            delegatee,
            value,
            current_valid_nonce,
            deadline,
        );

        assert!(
            delegator == Self::recover(digest, v, r, s),
            Errors::INVALID_SIGNATURE
        );
        self.nonces
            .borrow_mut()
            .insert(delegator, current_valid_nonce + 1);
        self._approve_delegation(delegator, delegatee, value);
    }

    fn borrow_allowance(&self, from_user: Principal, to_user: Principal) -> u64 {
        self.borrow_allowances
            .borrow()
            .get(&from_user)
            .and_then(|m| m.get(&to_user))
            .cloned()
            .unwrap_or(0)
    }

    fn _approve_delegation(&self, delegator: Principal, delegatee: Principal, amount: u64) {
        self.borrow_allowances
            .borrow_mut()
            .entry(delegator)
            .or_insert_with(HashMap::new)
            .insert(delegatee, amount);
        let event = BorrowAllowanceDelegatedEvent {
            delegator,
            delegatee,
            underlying_asset: self.underlying_asset,
            amount,
        };
        ic_cdk::println!("{:?}", event);
    }

    fn _decrease_borrow_allowance(&self, delegator: Principal, delegatee: Principal, amount: u64) {
        let mut allowances = self.borrow_allowances.borrow_mut();
        let delegatee_allowance = allowances
            .get_mut(&delegator)
            .unwrap()
            .get_mut(&delegatee)
            .unwrap();
        *delegatee_allowance -= amount;

        let event = BorrowAllowanceDelegatedEvent {
            delegator,
            delegatee,
            underlying_asset: self.underlying_asset,
            amount: *delegatee_allowance,
        };
        ic_cdk::println!("{:?}", event);
    }

    // Helper method to hash EIP712 message
    fn hash_eip712_message(
        domain_separator: [u8; 32],
        delegator: Principal,
        delegatee: Principal,
        value: u64,
        nonce: u64,
        deadline: u64,
    ) -> [u8; 32] {
        // Implement the EIP712 message hashing logic here
        [0u8; 32]
    }

    // Helper method to recover address from signature
    fn recover(digest: [u8; 32], v: u8, r: [u8; 32], s: [u8; 32]) -> Principal {
        // Implement the address recovery logic here
        Principal::anonymous()
    }
}
