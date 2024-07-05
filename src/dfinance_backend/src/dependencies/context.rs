// context.rs
use candid::Principal;
use ic_cdk::api;
use serde::{Deserialize, Serialize};

pub trait Context {
    fn msg_sender(&self) -> Principal {
        api::caller()
    }

    fn msg_data(&self) -> Vec<u8> {
        // This function can retrieve and return the current message data.
        // Since ICP does not have a direct equivalent to Ethereum's msg.data, we'll simulate it.
        vec![] // Placeholder for message data
    }
}
