use std::{collections::HashMap, default};
//use crate::types::{User, TokenDeposits};
use crate::types::*;
use crate::VMem;
use candid::{CandidType, Deserialize, Principal};
use core::ops::Deref;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::{Blob, Bound, Storable},
    DefaultMemoryImpl, StableBTreeMap, StableCell,
};
use std::borrow::Cow;
use std::cell::RefCell;
// use ic_cdk_timers::TimerId;
// use serde::{Deserialize, Serialize};

// #[derive(Serialize, Deserialize, Clone)]
// pub struct State {
//     pub users: HashMap<Principal, User>,
//     pub provider_deposits: HashMap<Principal, TokenDeposits>,
//     //pub token_deposits : HashMap<String, Vec<LiquidityEvent>>,
//     pub total_deposit: HashMap<u32, f64>,
//     pub deposits: HashMap<Principal, Vec<Deposit>>,
//     pub launch_timestamp: Option<u64>,
//     pub current_phase: u32,
//     pub total_deposits: f64,
//     pub monthly_data: HashMap<u32, MonthlyData>,
// }

// impl State {
//     pub fn new() -> Self {
//         Self {
//             users: HashMap::new(),
//             provider_deposits: HashMap::new(),
//             total_deposit: HashMap::new(),
//             deposits: HashMap::new(),
//             launch_timestamp: None,
//             current_phase: 1,
//             total_deposits: 0.0,
//             monthly_data: HashMap::new(),
//         }
//     }
// }

// impl Default for State {
//     fn default() -> Self {
//         State::new()
//     }
// }

pub type Users = StableBTreeMap<StoredPrincipal, Candid<User>, VMem>;
pub const USER_MEMORY_ID: MemoryId = MemoryId::new(0);

pub type TotalDeposit = StableBTreeMap<u32, f64, VMem>;
pub const TOTAL_DEPOSIT_MEMORY_ID: MemoryId = MemoryId::new(1);

pub type LaunchTimestamp = StableCell<Option<u64>, VMem>;
pub const LAUNCH_TIMESTAMP_MEMORY_ID: MemoryId = MemoryId::new(2);

pub type CurrentPhase = StableCell<u32, VMem>;
pub const CURRENT_PHASE_MEMORY_ID: MemoryId = MemoryId::new(3);
pub type MonthlyDataMap = StableBTreeMap<u32, Candid<MonthlyData>, VMem>;
pub const MONTHLY_DATA_MEMORY_ID: MemoryId = MemoryId::new(4);
pub struct State {
    pub users: Users,
    pub total_deposits: TotalDeposit,
    pub launch_timestamp: LaunchTimestamp,
    pub current_phase: CurrentPhase,
    pub monthly_data: MonthlyDataMap,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct StoredPrincipal(Principal);

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

#[derive(Default)]
pub struct Candid<T>(pub T)
where
    T: CandidType + for<'de> Deserialize<'de>;

impl<T> Storable for Candid<T>
where
    T: CandidType + for<'de> Deserialize<'de>,
{
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(&self.0).expect("encoding should always succeed"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(candid::decode_one(bytes.as_ref()).expect("decoding should succeed"))
    }
}

impl<T> Deref for Candid<T>
where
    T: CandidType + for<'de> Deserialize<'de>,
{
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}
