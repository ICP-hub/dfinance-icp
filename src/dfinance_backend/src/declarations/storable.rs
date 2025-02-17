use candid::{CandidType, Decode, Encode, Principal};
use serde::Deserialize;
use std::borrow::Cow;
use ic_stable_structures::storable::{Blob, Bound, Storable};

/*
 * @title Candid Wrapper for Storable
 * @notice A generic wrapper that enables storing Candid-serializable types in stable memory.
 * @dev Implements the `Storable` trait, allowing seamless conversion between Candid-encoded 
 *      bytes and the original data type. Uses unbounded storage to accommodate varying sizes.
 *      Also implements `Deref` for easy access to the underlying value.
 */
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

/*
 * @title StoredPrincipal Wrapper
 * @notice A lightweight wrapper for storing `Principal` values in stable memory.
 * @dev Implements the `Storable` trait using a fixed-size `Blob` (29 bytes), ensuring 
 *      compatibility with the Internet Computer's stable storage constraints. 
 *      Uses `Principal::as_slice` for conversion and enforces a maximum size of 29 bytes.
 */
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