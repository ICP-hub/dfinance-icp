use candid::{CandidType, Decode, Encode, Principal};
use serde::Deserialize;
use std::borrow::Cow;
use ic_stable_structures::storable::{Blob, Bound, Storable};

/* 
 * @title Stored Principal
 * @notice A lightweight wrapper for storing `Principal` values in stable memory.
 * @dev Implements `Storable` using a fixed-size `Blob` (29 bytes) to ensure compatibility
 *      with the Internet Computer's stable storage constraints.
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
 * @title Candid Wrapper
 * @notice A generic wrapper for Candid-serializable types to enable stable storage.
 * @dev Implements the `Storable` trait, allowing efficient encoding and decoding for stable memory.
 *      Uses `Encode!` and `Decode!` macros to serialize and deserialize the wrapped type.
 * 
 * @typeparam T Any type that implements `CandidType` and `Deserialize`. 
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