use candid::{CandidType, Nat, Principal};
use candid::{Decode, Encode};
use ic_stable_structures::{storable::Bound, Storable};
// use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue;
// use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use serde_bytes::{self, ByteBuf};
use std::borrow::Cow;

pub type CanisterId = Principal;

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Default,
)]
pub struct ProposalPlace {
    pub place_name : String,
    pub min_required_thredshold : u64,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Default,
)]
pub struct CanisterSettings {
    pub controllers: Option<Vec<Principal>>,

    pub compute_allocation: Option<Nat>,

    pub memory_allocation: Option<Nat>,

    pub freezing_threshold: Option<Nat>,

    pub reserved_cycles_limit: Option<Nat>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Default,
)]
pub struct CreateCanisterArgument {
    /// See [CanisterSettings].
    pub settings: Option<CanisterSettings>,
}

pub mod core {
    use std::cmp::Ordering;

    /// Represents a unique identifier or key.
    ///
    /// This type, `Key`, is an alias for `String`, used to represent unique identifiers or keys within the context
    /// of various data structures and operations.
    ///
    /// `Key` is commonly employed as a unique identifier or key in Rust code.
    pub type Key = String;

    /// Represents binary data as a vector of bytes.
    ///
    /// This type, `Blob`, is an alias for `Vec<u8>`, providing a convenient way to represent binary data
    /// as a collection of bytes.
    pub type Blob = Vec<u8>;

    /// Represents the domain name used in various configurations across the satellite.
    ///
    /// This type alias simplifies the reuse of `String` for domain names, providing a clear and
    /// specific semantic meaning when used in structs and function signatures. It is used to
    /// identify domains for authentication, custom domains, and potentially more areas where
    /// domain names are needed.
    ///
    /// # Examples
    ///
    /// Basic usage:
    ///
    /// ```
    /// let main_domain: DomainName = "example.com".to_string();
    /// ```
    pub type DomainName = String;

    pub trait Compare {
        fn cmp_updated_at(&self, other: &Self) -> Ordering;
        fn cmp_created_at(&self, other: &Self) -> Ordering;
    }

    /// Sha256 Digest: 32 bytes
    pub type Hash = [u8; 32];

    pub trait Hashable {
        fn hash(&self) -> Hash;
    }
}

pub mod ic {
    use crate::new_types::core::Blob;

    pub struct WasmArg {
        pub wasm: Blob,
        pub install_arg: Vec<u8>,
    }
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Default,
)]
pub(crate) struct CreateCanisterArgumentExtended {
    /// See [CanisterSettings].
    pub settings: Option<CanisterSettings>,
    /// sender_canister_version must be set to ic_cdk::api::canister_version()
    pub sender_canister_version: Option<u64>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct UpdateSettingsArgument {
    pub canister_id: CanisterId,
    /// See [CanisterSettings].
    pub settings: CanisterSettings,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub(crate) struct UpdateSettingsArgumentExtended {
    /// Principal of the canister.
    pub canister_id: CanisterId,
    /// See [CanisterSettings].
    pub settings: CanisterSettings,
    /// sender_canister_version must be set to ic_cdk::api::canister_version()
    pub sender_canister_version: Option<u64>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct UploadChunkArgument {
    pub canister_id: CanisterId,

    #[serde(with = "serde_bytes")]
    pub chunk: Vec<u8>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct ChunkHash {
    /// The hash of an uploaded chunk
    #[serde(with = "serde_bytes")]
    pub hash: Vec<u8>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct ClearChunkStoreArgument {
    pub canister_id: CanisterId,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct StoredChunksArgument {
    pub canister_id: CanisterId,
}

#[derive(
    CandidType,
    Serialize,
    Deserialize,
    Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Clone,
    Copy,
    Default,
)]
pub enum CanisterInstallMode {
    /// A fresh install of a new canister.
    #[serde(rename = "install")]
    #[default]
    Install,
    /// Reinstalling a canister that was already installed.
    #[serde(rename = "reinstall")]
    Reinstall,
    /// Upgrade an existing canister.
    #[serde(rename = "upgrade")]
    Upgrade(Option<SkipPreUpgrade>),
}

#[derive(
    CandidType,
    Serialize,
    Deserialize,
    Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Clone,
    Copy,
    Default,
)]
pub struct SkipPreUpgrade(pub Option<bool>);

/// WASM module.
pub type WasmModule = Vec<u8>;

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct InstallCodeArgument {
    /// See [CanisterInstallMode].
    pub mode: CanisterInstallMode,
    /// Principal of the canister.
    pub canister_id: CanisterId,
    /// Code to be installed.
    pub wasm_module: WasmModule,
    /// The argument to be passed to `canister_init` or `canister_post_upgrade`.
    pub arg: Vec<u8>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub(crate) struct InstallCodeArgumentExtended {
    /// See [CanisterInstallMode].
    pub mode: CanisterInstallMode,
    /// Principal of the canister.
    pub canister_id: CanisterId,
    /// Code to be installed.
    pub wasm_module: WasmModule,
    /// The argument to be passed to `canister_init` or `canister_post_upgrade`.
    pub arg: Vec<u8>,
    /// sender_canister_version must be set to ic_cdk::api::canister_version()
    pub sender_canister_version: Option<u64>,
}

/// Argument type of [install_chunked_code](super::install_chunked_code).
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct InstallChunkedCodeArgument {
    /// See [CanisterInstallMode].
    pub mode: CanisterInstallMode,
    /// Principal of the canister being installed
    pub target_canister: CanisterId,
    /// The canister in whose chunk storage the chunks are stored (defaults to target_canister if not specified)
    pub store_canister: Option<CanisterId>,
    /// The list of chunks that make up the canister wasm
    pub chunk_hashes_list: Vec<ChunkHash>,
    /// The sha256 hash of the wasm
    #[serde(with = "serde_bytes")]
    pub wasm_module_hash: Vec<u8>,
    /// The argument to be passed to `canister_init` or `canister_post_upgrade`
    #[serde(with = "serde_bytes")]
    pub arg: Vec<u8>,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub(crate) struct InstallChunkedCodeArgumentExtended {
    /// See [CanisterInstallMode].
    pub mode: CanisterInstallMode,
    /// Principal of the canister being installed
    pub target_canister: CanisterId,
    /// The canister in whose chunk storage the chunks are stored (defaults to target_canister if not specified)
    pub store_canister: Option<CanisterId>,
    /// The list of chunks that make up the canister wasm
    pub chunk_hashes_list: Vec<ChunkHash>,
    /// The sha256 hash of the wasm
    #[serde(with = "serde_bytes")]
    pub wasm_module_hash: Vec<u8>,
    /// The argument to be passed to `canister_init` or `canister_post_upgrade`.
    #[serde(with = "serde_bytes")]
    pub arg: Vec<u8>,
    /// sender_canister_version must be set to ic_cdk::api::canister_version()
    pub sender_canister_version: Option<u64>,
}

/// A wrapper of canister id.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Copy,
)]
pub struct CanisterIdRecord {
    /// Principal of the canister.
    pub canister_id: CanisterId,
}

#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Copy,
)]
pub(crate) struct CanisterIdRecordExtended {
    /// Principal of the canister.
    pub canister_id: CanisterId,
    /// sender_canister_version must be set to ic_cdk::api::canister_version()
    pub sender_canister_version: Option<u64>,
}

/// Status of a canister.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Copy,
)]
pub enum CanisterStatusType {
    /// The canister is running.
    #[serde(rename = "running")]
    Running,
    /// The canister is stopping.
    #[serde(rename = "stopping")]
    Stopping,
    /// The canister is stopped.
    #[serde(rename = "stopped")]
    Stopped,
}

/// Like [CanisterSettings].
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Default,
)]
pub struct DefiniteCanisterSettings {
    /// Controllers of the canister.
    pub controllers: Vec<Principal>,
    /// Compute allocation.
    pub compute_allocation: Nat,
    /// Memory allocation.
    pub memory_allocation: Nat,
    /// Freezing threshold.
    pub freezing_threshold: Nat,
    /// Reserved cycles limit.
    pub reserved_cycles_limit: Nat,
}

/// Query statistics, returned by [canister_status](super::canister_status).
#[derive(
    CandidType, Clone, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize,
)]
pub struct QueryStats {
    /// Total number of query calls.
    pub num_calls_total: candid::Nat,
    /// Total number of instructions executed by query calls.
    pub num_instructions_total: candid::Nat,
    /// Total number of payload bytes use for query call requests.
    pub request_payload_bytes_total: candid::Nat,
    /// Total number of payload bytes use for query call responses.
    pub response_payload_bytes_total: candid::Nat,
}

/// Return type of [canister_status](super::canister_status).
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CanisterStatusResponse {
    /// See [CanisterStatusType].
    pub status: CanisterStatusType,
    /// See [DefiniteCanisterSettings].
    pub settings: DefiniteCanisterSettings,
    /// A SHA256 hash of the module installed on the canister. This is null if the canister is empty.
    pub module_hash: Option<Vec<u8>>,
    /// The memory size taken by the canister.
    pub memory_size: Nat,
    /// The cycle balance of the canister.
    pub cycles: Nat,
    /// Amount of cycles burned per day.
    pub idle_cycles_burned_per_day: Nat,
    /// Query statistics
    pub query_stats: QueryStats,
    /// The reserved cycles balance of the canister.
    /// These are cycles that are reserved by the resource reservation mechanism
    /// on storage allocation. See also the `reserved_cycles_limit` parameter in
    /// canister settings.
    pub reserved_cycles: Nat,
}

/// Details about a canister change initiated by a user.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct FromUserRecord {
    /// Principal of the user.
    pub user_id: Principal,
}

/// Details about a canister change initiated by a canister (called _originator_).
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct FromCanisterRecord {
    /// Principal of the originator.
    pub canister_id: Principal,
    /// Canister version of the originator when the originator initiated the change.
    /// This is null if the original does not include its canister version
    /// in the field `sender_canister_version` of the management canister payload.
    pub canister_version: Option<u64>,
}

/// Provides details on who initiated a canister change.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub enum CanisterChangeOrigin {
    /// See [FromUserRecord].
    #[serde(rename = "from_user")]
    FromUser(FromUserRecord),
    /// See [FromCanisterRecord].
    #[serde(rename = "from_canister")]
    FromCanister(FromCanisterRecord),
}

/// Details about a canister creation.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CreationRecord {
    /// Initial set of canister controllers.
    pub controllers: Vec<Principal>,
}

/// The mode with which a canister is installed.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Copy,
)]
// #[serde(rename_all = "lowercase")]
pub enum CodeDeploymentMode {
    /// A fresh install of a new canister.
    #[serde(rename = "install")]
    Install,
    /// Reinstalling a canister that was already installed.
    #[serde(rename = "reinstall")]
    Reinstall,
    /// Upgrade an existing canister.
    #[serde(rename = "upgrade")]
    Upgrade,
}

/// Details about a canister code deployment.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CodeDeploymentRecord {
    /// See [CodeDeploymentMode].
    pub mode: CodeDeploymentMode,
    /// A SHA256 hash of the new module installed on the canister.
    pub module_hash: Vec<u8>,
}

/// Details about updating canister controllers.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct ControllersChangeRecord {
    /// The full new set of canister controllers.
    pub controllers: Vec<Principal>,
}

/// Provides details on the respective canister change.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub enum CanisterChangeDetails {
    /// See [CreationRecord].
    #[serde(rename = "creation")]
    Creation(CreationRecord),
    /// Uninstalling canister's module.
    #[serde(rename = "code_uninstall")]
    CodeUninstall,
    /// See [CodeDeploymentRecord].
    #[serde(rename = "code_deployment")]
    CodeDeployment(CodeDeploymentRecord),
    /// See [ControllersChangeRecord].
    #[serde(rename = "controllers_change")]
    ControllersChange(ControllersChangeRecord),
}

/// Represents a canister change as stored in the canister history.
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CanisterChange {
    /// The system timestamp (in nanoseconds since Unix Epoch) at which the change was performed
    pub timestamp_nanos: u64,
    /// The canister version after performing the change.
    pub canister_version: u64,
    /// The change's origin (a user or a canister).
    pub origin: CanisterChangeOrigin,
    /// The change's details.
    pub details: CanisterChangeDetails,
}

/// Argument type of [canister_info](super::canister_info).
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CanisterInfoRequest {
    /// Principal of the canister.
    pub canister_id: Principal,
    /// Number of most recent changes requested to be retrieved from canister history.
    /// No changes are retrieved if this field is null.
    pub num_requested_changes: Option<u64>,
}

/// Return type of [canister_info](super::canister_info).
#[derive(
    CandidType, Serialize, Deserialize, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone,
)]
pub struct CanisterInfoResponse {
    /// Total number of changes ever recorded in canister history.
    /// This might be higher than the number of canister changes in `recent_changes`
    /// because the IC might drop old canister changes from its history
    /// (with `20` most recent canister changes to always remain in the list).
    pub total_num_changes: u64,
    /// The canister changes stored in the order from the oldest to the most recent.
    pub recent_changes: Vec<CanisterChange>,
    /// A SHA256 hash of the module installed on the canister. This is null if the canister is empty.
    pub module_hash: Option<Vec<u8>>,
    /// Controllers of the canister.
    pub controllers: Vec<Principal>,
}

#[derive(Clone, CandidType, PartialEq, Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub user_id: Principal,
    pub email_id: String,
    pub profile_img: String,
    pub image_canister: Principal,
    pub username: String,
    pub dao_ids: Vec<Principal>,
    pub post_count: u32,
    pub post_id: Vec<String>,
    pub followers_count: u32,
    pub followers_list: Vec<Principal>,
    pub followings_count: u32,
    pub followings_list: Vec<Principal>,
    pub description: String,
    pub tag_defines: Vec<String>,
    pub contact_number: String,
    pub twitter_id: String,
    pub telegram: String,
    pub website: String,
    pub follow_dao : Vec<Principal>,
    pub join_dao :  Vec<Principal>,
    pub submitted_proposals : u64,
}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct Profileinput {
    pub email_id: String,
    pub profile_img: String,
    pub username: String,
    pub description: String,
    pub contact_number: String,
    pub twitter_id: String,
    pub telegram: String,
    pub website: String,
    pub tag_defines: Vec<String>,

    // image data
    pub image_content: ByteBuf,
    pub image_title: String,
    pub image_content_type: String,
}

// basic profile
#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct MinimalProfileinput {
    pub email_id: String,
    // pub profile_img: String,
    pub name: String,

    // image data
    pub image_content: ByteBuf,
    pub image_title: String,
    pub image_content_type: String,
}

#[derive(Clone, CandidType, Serialize, Deserialize, Debug)]
pub struct DaoGroup {
    pub group_name: String,
    pub group_members: Vec<Principal>,
    pub group_permissions: Vec<ProposalType>,
    pub quorem: u8,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum MetadataValue {
    Nat(Nat),
    Int(i64),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct Metadata {
    pub key: String,
    pub value: MetadataValue,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: u64,
    pub max_transactions_per_response: Option<u64>,
    pub trigger_threshold: u64,
    pub max_message_size_bytes: Option<u64>,
    pub cycles_for_archive_creation: Option<u64>,
    pub node_max_memory_size_bytes: Option<u64>,
    pub controller_id: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct ICRC1LedgerInitArgs {
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub transfer_fee: Nat,
    pub decimals: Option<u8>,
    pub max_memo_length: Option<u16>,
    pub token_symbol: String,
    pub token_name: String,
    pub metadata: Vec<Metadata>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
    pub archive_options: ArchiveOptions,
}

#[derive(Clone, CandidType, Serialize, Deserialize, Debug)]
pub struct DaoInput {
    pub dao_name: String,
    pub purpose: String,
    pub daotype: String,
    pub link_of_document: String,
    pub cool_down_period: u32,
    pub members: Vec<Principal>,
    // pub tokenissuer: String,
    pub linksandsocials: Vec<String>,
    pub required_votes: u32,
    pub dao_groups: Vec<DaoGroup>,
    pub token_name: String,
    pub token_symbol: String,
    pub token_supply: u32,
    pub tokens_required_to_vote: u32,
    // pub followers: Vec<Principal>,
    // min_treadshold : Vec<u32>,
    // image data
    // pub image_id: Option<String>,
    pub image_id: String,
    pub image_content: ByteBuf,
    pub image_title: String,
    pub image_content_type: String,
    pub members_permissions: Vec<ProposalType>,
    pub proposal_entry : Vec<ProposalPlace>,
}

#[derive(Clone, CandidType, Serialize, Deserialize, Debug)]
pub struct DaoCanisterInput {
    pub dao_name: String,
    pub purpose: String,
    pub daotype: String,
    pub link_of_document: String,
    pub cool_down_period: u32,
    pub members: Vec<Principal>,
    // pub tokenissuer: String,
    pub linksandsocials: Vec<String>,
    pub required_votes: u32,
    pub token_symbol: String,
    pub token_supply: u32,
    pub followers: Vec<Principal>,
    pub image_id: String,
    pub members_permissions: Vec<ProposalType>,
    pub dao_groups: Vec<DaoGroup>,
    pub tokens_required_to_vote: u32,
    pub image_canister: Principal,
    pub daohouse_canister_id: Principal,
    pub proposal_entry : Vec<ProposalPlace>,

}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct DaoDetails {
    // pub dao_id: Principal,
    pub dao_name: String,
    // pub image_id: String,
    pub dao_desc: String,
    pub dao_canister_id: Principal,
    pub dao_associated_ledger: Principal,
}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct PostInfo {
    pub principal_id: Principal,
    pub username: String,
    pub post_id: String,
    // pub post_title:String,
    pub post_description: String,
    pub post_img: String,
    // pub post_created_at:String,
    pub post_created_at: u64,
    pub like_count: u32,
    pub like_id_list: Vec<Principal>,
    pub comment_count: u32,
    pub user_image_id: String,
    pub comment_list: Vec<Comment>,
    pub is_liked: u32,
}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct GetAllPostsResponse {
    pub posts: Vec<PostInfo>,
    pub size: u32,
}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct PostInput {
    //  pub post_title:String,
    pub post_description: String,
    pub username: String,
    pub user_image_id: String,
    //pub post_img:String,

    // image data
    pub image_content: ByteBuf,
    pub image_title: String,
    pub image_content_type: String,
}

#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct ImageData {
    pub content: ByteBuf,
    pub name: String,
    pub content_type: String,
}

// comment
#[derive(Clone, CandidType, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct Comment {
    pub author_principal: Principal,
    pub comment_text: String,
    pub comment_id: Option<String>,
    pub replies: Vec<String>,
}

// reply comment data
#[derive(Clone, CandidType, Serialize, Deserialize)]
pub struct ReplyCommentData {
    pub comment_id: String,
    pub comment: String,
    pub post_id: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct LedgerCanisterId {
    pub id: Principal,
}

// dao response
#[derive(Clone, CandidType, Serialize, Deserialize, Debug)]
pub struct DaoResponse {
    pub dao_id: Principal,
    pub dao_name: String,
    pub purpose: String,
    pub daotype: String,
    pub link_of_document: String,
    pub cool_down_period: String,
    pub tokenissuer: String,
    pub linksandsocials: Vec<String>,
    pub required_votes: i8,
    pub groups_count: u64,
    pub group_name: Vec<String>,
}

#[derive(CandidType, Clone, Serialize, Debug, Deserialize, Default)]
pub struct Analytics {
    pub members_count: u64,
    pub proposals_count: u64,
    pub dao_counts: u64,
    pub post_count: u64,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct Pagination {
    pub start: u32,
    pub end: u32,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct WasmArgs {
    pub wasm: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct InitialArgs {
    pub payment_recipient: Principal, // payment recipient principal address
    pub ic_asset_canister_id: Principal,
    pub dao_canister_id: Principal,
}

// LEDGER PARAMS
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum LedgerArg {
    Init(InitArgs),
    Upgrade(Option<UpgradeArgs>),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Copy)]
pub struct CanisterData {
    pub ic_asset_canister: Principal,
    pub dao_canister: Principal,
    pub paymeny_recipient: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InitArgs {
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub transfer_fee: Nat,
    pub decimals: Option<u8>,
    pub max_memo_length: Option<u16>,
    pub token_symbol: String,
    pub token_name: String,
    pub metadata: Vec<Metadata>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
    pub archive_options: ArchiveOptions,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum ChangeFeeCollector {
    Unset,
    SetTo(Account),
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Icrc28TrustedOriginsResponse {
    pub trusted_origins: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpgradeArgs {
    pub metadata: Option<Vec<Metadata>>,
    pub token_symbol: Option<String>,
    pub token_name: Option<String>,
    pub transfer_fee: Option<Nat>,
    pub change_fee_collector: Option<ChangeFeeCollector>,
    pub max_memo_length: Option<u16>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
}

// ligher proposal instance
#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct ProposalKeyStore {
    pub associated_dao_canister_id: Principal,
    pub proposal_id: String,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct ProposalValueStore {
    pub associated_dao_canister_id: Principal,
    pub proposal_id: String,
    pub propsal_title: String,
    pub proposal_description: String,
    pub proposal_submitted_at: u64,
    pub proposal_expired_at: u64,
    pub required_votes: u32,
    pub created_by: Principal,
    pub proposal_type: ProposalType,
    pub principal_action: Principal,
    // pub total_tokens: u32,
    pub dao_members: Vec<Principal>, // pub votes:
    // pub proposal_entry : ProposalPlace,
    pub minimum_threadsold : u64,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq, Eq)]
pub enum ProposalType {
    AddMemberToDaoProposal,
    AddMemberToGroupProposal,
    RemoveMemberToDaoProposal,
    RemoveMemberToGroupProposal,
    ChangeDaoConfig,
    ChangeDaoPolicy,
    BountyRaised,
    BountyDone,
    Polls,
    TokenTransfer,
    GeneralPurpose,
    BountyClaim,
}

// const MAX_VALUE_SIZE: u32 = 800;
const MAX_VALUE_SIZE_ANALYTICS: u32 = 300;
// const MAX_VALUE_SIZE_DAO: u32 = 400;
const MAX_VALUE_SIZE_CANISTER_DATA: u32 = 600;
// const MAX_VALUE_SIZE: u32 = 600;

impl Storable for UserProfile {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    // IF MEMORY ERROR UNCOMMENT BELOW LINE
    const BOUND: Bound = Bound::Unbounded;

    // const BOUND: Bound = Bound::Bounded {
    //     max_size: MAX_VALUE_SIZE,
    //     is_fixed_size: false,
    // };
}

impl Storable for PostInfo {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;

    // const BOUND: Bound = Bound::Bounded {
    //     max_size: MAX_VALUE_SIZE,
    //     is_fixed_size: false,
    // };
}

impl Storable for DaoDetails {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;

    // const BOUND: Bound = Bound::Bounded {
    //     max_size: MAX_VALUE_SIZE_DAO,
    //     is_fixed_size: false,
    // };
}

impl Storable for Analytics {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE_ANALYTICS,
        is_fixed_size: false,
    };
}

impl Storable for WasmArgs {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for ProposalValueStore {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for CanisterData {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    // const BOUND: Bound = Bound::Unbounded;

    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE_CANISTER_DATA,
        is_fixed_size: false,
    };
}
