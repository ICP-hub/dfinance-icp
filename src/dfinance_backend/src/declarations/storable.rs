// use candid::{CandidType, Deserialize, Principal};
// use core::ops::Deref;
// use ic_stable_structures::storable::{Blob, Bound, Storable};
// use std::borrow::Cow;

// The Candid struct is a wrapper around the data that needs to be stored in the canister. It proivdes the implementation of the Storable trait.
// #[derive(Default, Clone)]
// pub struct Candid<T>(pub T)
// where
//     T: CandidType + for<'de> Deserialize<'de>;

// impl<T> Storable for Candid<T>
// where
//     T: CandidType + for<'de> Deserialize<'de>,
// {
//     const BOUND: Bound = Bound::Unbounded;

//     fn to_bytes(&self) -> Cow<'_, [u8]> {
//         Cow::Owned(candid::encode_one(&self.0).expect("encoding should always succeed"))
//     }

//     fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
//         Self(candid::decode_one(bytes.as_ref()).expect("decoding should succeed"))
//     }
// }

// impl<T> Deref for Candid<T>
// where
//     T: CandidType + for<'de> Deserialize<'de>,
// {
//     type Target = T;

//     fn deref(&self) -> &T {
//         &self.0
//     }
// }
use candid::{CandidType, Decode, Encode, Principal};
use serde::Deserialize;
use std::borrow::Cow;
use ic_stable_structures::storable::{Blob, Bound, Storable};

// #[derive(Default, Clone, CandidType, Deserialize, Serialize)]
// pub struct MyStruct {
//     pub value: f64,
// }

#[derive(Default, Clone,Debug)]
pub struct Candid<T>(pub T)
where
    T: CandidType + for<'de> Deserialize<'de>;

impl<T> Storable for Candid<T>
where
    T: CandidType + for<'de> Deserialize<'de>,
{
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(&self.0).expect("encoding should always succeed"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(Decode!(bytes.as_ref(), T).expect("decoding should succeed"))
    }
}

impl<T> std::ops::Deref for Candid<T>
where
    T: CandidType + for<'de> Deserialize<'de>,
{
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}


// The StoredPrincipal struct is a wrapper around the Principal struct. It provides the implementation of the Storable trait.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct StoredPrincipal(pub Principal);

impl Storable for StoredPrincipal {
    const BOUND: Bound = Blob::<29>::BOUND;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(
            Blob::<29>::try_from(self.0.as_slice())
                .expect("principal length should not exceed 29 bytes")
                .to_bytes()
                .into_owned(),
        )
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(Principal::from_slice(
            Blob::<29>::from_bytes(bytes).as_slice(),
        ))
    }
}