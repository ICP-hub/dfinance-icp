cargo build --release --target wasm32-unknown-unknown --package dfinance_backend

candid-extractor target/wasm32-unknown-unknown/release/dfinance_backend.wasm >src/dfinance_backend/dfinance_backend.did