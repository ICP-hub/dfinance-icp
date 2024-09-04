use candid::{decode_one, encode_one, Principal};

use pocket_ic::{PocketIc, WasmResult};
use std::fs;

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();

    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 2_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(backend_canister, wasm, vec![], None);
    let _ = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve_list",
        encode_one(vec![
            ("ckBTC".to_string(), Principal::from_text("c2lt4-zmaaa-aaaaa-qaaiq-cai").unwrap()),
            ("ckETH".to_string(), Principal::from_text("ctiya-peaaa-aaaaa-qaaja-cai").unwrap())
        ]).unwrap(),
    );
    (pic, backend_canister)
}

#[test]
fn test_asset_list_func() {
    let (pic, backend_canister) = setup();

    let Ok(WasmResult::Reply(response)) = pic.query_call(
        backend_canister,
        Principal::anonymous(),
        "get_all_assets",
        encode_one(()).unwrap(),
    ) else {
        panic!("Expected reply");
    };
    let result: Vec<String> = decode_one(&response).unwrap();
    assert_eq!(result, vec!["ckBTC", "ckETH"]);
}