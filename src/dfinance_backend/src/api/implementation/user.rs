use std::borrow::Cow;
use candid::{ Decode, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use crate::api::declaration::user::UserData;

const MAX_VALUE_SIZE: u32 = 100;

impl Storable for UserData {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    // if you need a bounded value by size
    // const BOUND: Bound = Bound::Bounded {
    //     max_size: MAX_VALUE_SIZE,
    //     is_fixed_size: false,
    // };

    const BOUND: Bound = Bound::Unbounded;
}

impl UserData {
    pub fn get_username(&self) -> String {
        self.username.clone()
    }

    pub fn set_username(&mut self, username: String) {
        self.username = username;
    }

    pub fn get_full_name(&self) -> String {
        self.full_name.clone()
    }

    pub fn set_full_name(&mut self, full_name: String) {
        self.full_name = full_name;
    }
}

#[cfg(test)]
mod tests{

    // use candid::Principal;

    use super::*;

    // const SECONDS: u64 = 1_000_000_000;

    // fn get_principal() -> Principal {
    //     Principal::from_text("bxquz-fu76r-igixs-bw537-mgkyg-h4goq-ldrwe-q4zg2-zxtqy-zupgm-nqe").unwrap()
    // }

    #[test]
    fn test_get_username() {
        let mut state = UserData::default();
        state.set_username("Vinayak".to_string());
        assert_eq!(state.get_username(), "Vinayak");
    }
}
