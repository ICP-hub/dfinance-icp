use crate::stable_storage::state::State;
use std::cell::RefCell;
use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};
use ic_certified_map::{RbTree, leaf_hash, AsHashTree};
use ic_cdk::api::{data_certificate, set_certified_data};
use serde:: Serialize;
use candid::{CandidType, Encode};
use crate::declarations::datatypes::Certificate;

/*
 * @title Memory Manager
 * @dev This thread-local static variable initializes and manages the memory allocation.
 * @notice It uses the `MemoryManager` with the `DefaultMemoryImpl` implementation.
 * @returns A `RefCell` wrapping a `MemoryManager` instance.
 * @functionality Initializes and manages memory allocation using the `MemoryManager` with the `DefaultMemoryImpl` implementation.
 */


thread_local! {

    // The memory manager.
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

}
/*
 * @title Canister State Manager
 * @dev This thread-local static variable initializes and manages the global state of the canister.
 * @notice The state is created using the memory manager to ensure efficient storage handling.
 * @returns A `RefCell` wrapping the `State` instance.
 * @functionality Initializes and manages the global state of the canister using the memory manager.
 */

thread_local! {

    // The state of the canister.
    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State::new(&mm.borrow()))
    );
    pub static CERTIFICATE_TREE: RefCell<RbTree<String, [u8; 32]>> = RefCell::new(RbTree::new());

}


/* Read-only access to the global state. 
   @functionality State Access
   Executes a closure `f` with an immutable reference to `State`. */
pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}

/* Mutable access to the global state.
   @functionality State Mutation
   Executes the provided function `f` with a mutable reference to `State`. */
pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}

/*
 * @title Insert Certified Value
 * @notice Inserts a key-value pair into the certified data tree with cryptographic hashing.
 * @dev Serializes the value using Candid and updates the certified data root hash accordingly.
 * @param key The key under which to store the certified value.
 * @param value The value to be serialized and inserted into the certified data tree.
 * @functionality Maintains the integrity and verifiability of certified data for queries.
 */
pub fn insert_certified_value<T: Serialize + CandidType>(key: String, value: T) {
    let bytes: Vec<u8> = Encode!(&value).unwrap();

    CERTIFICATE_TREE.with(|tree| {
        let mut tree = tree.borrow_mut();
        tree.insert(key.clone(), leaf_hash(&bytes));
        set_certified_data(&tree.root_hash());
    });
}

/*
 * @title Get Certificate Witness
 * @notice Retrieves the certificate and witness proof for a given key in the certified data tree.
 * @dev Constructs a CBOR serialized witness for the key to prove data authenticity.
 * @param key The key for which to generate the certificate witness.
 * @return Certificate containing the data certificate and witness proof bytes.
 * @functionality Provides cryptographic proof to clients verifying data integrity for queries.
 */
pub fn get_certificate_witness(key: String)-> Certificate {
    let certificate = data_certificate().expect("No data certificate available");

    let witness = CERTIFICATE_TREE.with(|tree| {
        let tree = tree.borrow();
        let mut witness_bytes = vec![];
        let mut serializer = serde_cbor::Serializer::new(&mut witness_bytes);
        let _ = serializer.self_describe();
        tree.witness(key.as_bytes()).serialize(&mut serializer).unwrap();
        witness_bytes
    });
    Certificate {
        certificate,
        witness,
    }
}