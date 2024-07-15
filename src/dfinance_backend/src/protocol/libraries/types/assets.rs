use ic_stable_structures::StableBTreeMap;

use crate::declarations::{
    assets::ReserveData,
    storable::{Candid, StoredPrincipal},
};
use crate::protocol::libraries::types::{datatypes::UserData, memory::VMem};

pub type AssetIndex = StableBTreeMap<String, Candid<ReserveData>, VMem>;
pub type UserProfile = StableBTreeMap<StoredPrincipal, Candid<UserData>, VMem>;
