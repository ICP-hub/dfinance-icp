use candid::{CandidType, Principal, Nat, encode_args};
use serde::{Deserialize, Serialize}; // Import the necessary Serde derives
use pocket_ic::PocketIc;
use std::fs;
// use ic_icrc1_ledger::{Ledger, LedgerArgument};


#[derive(CandidType)]
pub enum LedgerArgument {
    Init(InitArgs),
    // Upgrade(Option<UpgradeArgs>),
}
// Define the structure for the InitArgs
#[derive(CandidType, Deserialize, Serialize)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct ArchiveOptions {
    num_blocks_to_archive: u64,
    max_transactions_per_response: Option<u64>,
    trigger_threshold: u64,
    more_controller_ids: Option<Vec<Principal>>,
    max_message_size_bytes: Option<u64>,
    cycles_for_archive_creation: Option<u64>,
    node_max_memory_size_bytes: Option<u64>,
    controller_id: Principal,
}

#[derive(CandidType, Deserialize, Serialize)]
struct FeatureFlags {
    icrc2: bool,
}

#[derive(CandidType, Deserialize, Serialize)]
struct InitArgs {
    token_symbol: String,
    token_name: String,
    transfer_fee: Nat,
    metadata: Vec<(String, String)>, // Adjust as per your metadata structure
    minting_account: Account,
    initial_balances: Vec<(Account, Nat)>,
    archive_options: ArchiveOptions,
    feature_flags: Option<FeatureFlags>,
}

const DTOKEN_WASM: &str = "../../target/wasm32-unknown-unknown/release/dtoken.wasm";

fn dtoken_setup() -> Result<(PocketIc, Principal), String> {
    let pic = PocketIc::new();

    let dtoken_canister = pic.create_canister();
    pic.add_cycles(dtoken_canister, 2_000_000_000_000); // 2T Cycles
    let wasm = fs::read(DTOKEN_WASM).expect("Wasm file not found, run 'dfx build'.");

    // Create the InitArgs struct
    let args = InitArgs {
        token_symbol: String::from("D"),
        token_name: String::from("Demo Token"),
        transfer_fee: Nat::from(1000u64), // Example value
        metadata: vec![], // Empty for now, adjust as necessary
        minting_account: Account {
            owner: Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai").unwrap(),
            subaccount: None,
        },
        initial_balances: vec![], // Empty for now
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 1000,
            max_transactions_per_response: None,
            trigger_threshold: 500,
            more_controller_ids: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: Some(1_000_000),
            node_max_memory_size_bytes: None,
            controller_id: Principal::from_text("avqkn-guaaa-aaaaa-qaaea-cai").unwrap(),
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };

    // Encode the InitArgs using candid
    let args_encoded = encode_args((LedgerArgument::Init(args),))
        .expect("Failed to encode arguments");

    // Install the canister with the encoded arguments
    pic.install_canister(dtoken_canister, wasm, args_encoded, None);

    Ok((pic, dtoken_canister))
}

#[test]
fn test_dtoken_installation() {
    match dtoken_setup() {
        Ok((_pic, dtoken_canister)) => {
            println!("dtoken canister deployed successfully. Canister ID: {}", dtoken_canister);
        },
        Err(e) => {
            println!("Error during dtoken canister setup: {}", e);
        }
    }
}
