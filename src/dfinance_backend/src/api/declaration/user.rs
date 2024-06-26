use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use serde::{Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserData {
    pub username: String,
    pub full_name: String,
}