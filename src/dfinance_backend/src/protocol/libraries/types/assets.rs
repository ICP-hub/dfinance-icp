use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::StableBTreeMap;
use std::collections::BTreeMap;

use crate::api::functions::{BlockedUserDetails, RequestTracker, SessionStorageData};
use crate::declarations::assets::InitArgs;
use crate::declarations::{assets::ReserveData, storable::Candid};
use crate::protocol::libraries::math::calculate::PriceCache;
use crate::protocol::libraries::types::{datatypes::UserData, memory::VMem};

pub type AssetIndex = StableBTreeMap<String, Candid<ReserveData>, VMem>;
pub type UserProfile = StableBTreeMap<Principal, Candid<UserData>, VMem>;
pub type ReserveList = StableBTreeMap<String, Principal, VMem>;
pub type PriceCacheList = StableBTreeMap<String, Candid<PriceCache>, VMem>;
pub type CanisterList = StableBTreeMap<String, Principal, VMem>;
pub type TesterList = StableBTreeMap<String, Principal, VMem>;
pub type MetaData = StableBTreeMap<u32, Candid<InitArgs>, VMem>;

pub type Requests = StableBTreeMap<Principal, Candid<BTreeMap<String, RequestTracker>>, VMem>;
pub type BlockedUsers = StableBTreeMap<Principal, Candid<BTreeMap<String, BlockedUserDetails>>, VMem>;

pub type SessionDetails = StableBTreeMap<Principal, Candid<SessionStorageData>, VMem>; 
pub type UserGuideData = StableBTreeMap<Principal, bool, VMem>;  
