// eip712_base.rs
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct EIP712Base {
    eip712_revision: Vec<u8>,
    eip712_domain: [u8; 32],
    nonces: RefCell<HashMap<Principal, u64>>,
    domain_separator: RefCell<[u8; 32]>,
    chain_id: u64,
}

impl EIP712Base {
    pub fn new() -> Self {
        let chain_id = ic_cdk::api::time() as u64; // Placeholder for chain ID equivalent
        Self {
            eip712_revision: b"1".to_vec(),
            eip712_domain: keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)".as_bytes()),
            nonces: RefCell::new(HashMap::new()),
            domain_separator: RefCell::new([0u8; 32]),
            chain_id,
        }
    }

    pub fn domain_separator(&self) -> [u8; 32] {
        let current_chain_id = ic_cdk::api::time() as u64; // Placeholder for chain ID equivalent
        if current_chain_id == self.chain_id {
            return *self.domain_separator.borrow();
        }
        self.calculate_domain_separator()
    }

    pub fn nonces(&self, owner: Principal) -> u64 {
        *self.nonces.borrow().get(&owner).unwrap_or(&0)
    }

    pub fn calculate_domain_separator(&self) -> [u8; 32] {
        keccak256(
            &[
                &self.eip712_domain[..],
                &keccak256(&self.eip712_revision)[..],
                &self.chain_id.to_be_bytes()[..],
                &Principal::management_canister().as_slice(),
            ]
            .concat(),
        )
    }

    pub fn eip712_base_id(&self) -> String {
        // Override this method to return the name of the signing domain
        String::new()
    }
}

// Helper function to mimic Solidity's keccak256 hash
fn keccak256(input: &[u8]) -> [u8; 32] {
    use sha3::{Digest, Keccak256};
    let mut hasher = Keccak256::new();
    hasher.update(input);
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}
