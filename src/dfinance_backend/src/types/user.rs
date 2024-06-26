use std::borrow::Cow;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{storable::{self, Bound}, BTreeMap, Storable, StableBTreeMap};
use serde::{Serialize};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{ DefaultMemoryImpl};
use crate::api::declaration::user::UserData;

// Memory types
pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub type UserDataStorage = StableBTreeMap<Principal, UserData, Memory>;
