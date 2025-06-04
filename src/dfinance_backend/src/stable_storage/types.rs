use candid::Principal;
use ic_stable_structures::StableBTreeMap;


use crate::declarations::datatypes::{
    AssetInfo, FaucetReserves, InitArgs, PriceCache,  ReserveData,  UserData, RollbackRetryJob
};
use crate::stable_storage::storable::Candid;

use ic_stable_structures::{memory_manager::VirtualMemory, DefaultMemoryImpl};
pub type VMem = VirtualMemory<DefaultMemoryImpl>;

pub type AssetIndex = StableBTreeMap<String, Candid<ReserveData>, VMem>;
pub type FaucetData = StableBTreeMap<Principal, Candid<FaucetReserves>, VMem>;
pub type UserProfile = StableBTreeMap<Principal, Candid<UserData>, VMem>;
pub type ReserveList =  StableBTreeMap<String,Principal, VMem>;
pub type PriceCacheList =  StableBTreeMap<String,Candid<PriceCache>, VMem>;
pub type CanisterList =  StableBTreeMap<String,Principal, VMem>;
pub type TesterList =  StableBTreeMap<String,Principal, VMem>;
pub type MetaData =  StableBTreeMap<String,Candid<InitArgs>, VMem>;
pub type AccessControl = StableBTreeMap<Principal, Candid<Vec<String>>, VMem>;
pub type AssetRecords = StableBTreeMap<String, Candid<AssetInfo>, VMem>;
pub type PendingRollbackMap = StableBTreeMap<u64, Candid<RollbackRetryJob>, VMem>;
pub type CriticalRollbackMap = StableBTreeMap<u64, Candid<RollbackRetryJob>, VMem>;
