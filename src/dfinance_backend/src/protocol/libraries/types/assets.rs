use ic_stable_structures::StableBTreeMap;

use crate::declarations::assets::ReserveData;
use crate::declarations::storable::{Candid, StoredPrincipal};
use crate::protocol::libraries::types::memory::VMem;

// pub type AssetIndex = StableBTreeMap<StoredPrincipal, Candid<ReserveData>, VMem>;
pub type AssetIndex = StableBTreeMap<String, Candid<ReserveData>, VMem>;
