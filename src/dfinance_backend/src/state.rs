use std::collections::HashMap;
use candid::{self, CandidType, Deserialize, Principal};
use crate::{memory, types::User};
use ic_stable_structures::{writer::Writer, Memory as _, StableBTreeMap};
// mod memory;
use memory::Memory;


#[derive(Deserialize, Clone, CandidType, Debug, Default)]
pub struct State {
    pub users: StableBTreeMap<Principal, User, Memory>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: StableBTreeMap::init(),
        }
    }
}

impl State {
    pub fn get_users(&self) -> HashMap<Principal, User> {
        self.users
    }
}

#[cfg(test)]
mod tests{
    use super::*;

    const SECONDS: u64 = 1_000_000_000;

    fn get_principal() -> Principal {
        Principal::from_text("bxquz-fu76r-igixs-bw537-mgkyg-h4goq-ldrwe-q4zg2-zxtqy-zupgm-nqe").unwrap()
    }
}