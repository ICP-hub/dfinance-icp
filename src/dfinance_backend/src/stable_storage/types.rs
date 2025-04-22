use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use std::collections::BTreeMap;

use crate::declarations::structs::InitArgs;
use crate::declarations::structs::ReserveData;
use crate::stable_storage::storable::Candid;
use crate::declarations::datatypes::{BlockedUserDetails, PriceCache, RequestTracker, SessionStorageData, UserData};


use ic_stable_structures::{memory_manager::VirtualMemory, DefaultMemoryImpl};
pub type VMem = VirtualMemory<DefaultMemoryImpl>;


pub type AssetIndex = StableBTreeMap<String, Candid<ReserveData>, VMem>;
pub type UserProfile = StableBTreeMap<Principal, Candid<UserData>, VMem>;
pub type ReserveList =  StableBTreeMap<String,Principal, VMem>;
pub type PriceCacheList =  StableBTreeMap<String,Candid<PriceCache>, VMem>;
pub type CanisterList =  StableBTreeMap<String,Principal, VMem>;
pub type TesterList =  StableBTreeMap<String,Principal, VMem>;
pub type MetaData =  StableBTreeMap<String,Candid<InitArgs>, VMem>;

pub type FunctionRequests = StableBTreeMap<Principal, Candid<BTreeMap<String, RequestTracker>>, VMem>;
pub type BlockedUsersFunction = StableBTreeMap<Principal, Candid<BTreeMap<String, BlockedUserDetails>>, VMem>;
pub type SessionDetails = StableBTreeMap<Principal, Candid<SessionStorageData>, VMem>; 
pub type UserGuideData = StableBTreeMap<Principal, bool, VMem>;  


