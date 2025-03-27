# did generate for buy_burn canister
cargo build --release --target wasm32-unknown-unknown --package buy_burn
candid-extractor target/wasm32-unknown-unknown/release/buy_burn.wasm >src/buy_burn/buy_burn.did

# did generate for lp_pool canister
cargo build --release --target wasm32-unknown-unknown --package lp_pool
candid-extractor target/wasm32-unknown-unknown/release/lp_pool.wasm >src/lp_pool/lp_pool.did