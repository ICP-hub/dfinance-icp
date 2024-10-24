# #!/usr/bin/env bash
# function generate_did() {
#   local canister=$1
#   canister_root="src/$canister"

#   cargo build --manifest-path="$canister_root/Cargo.toml" \
#     --target wasm32-unknown-unknown \
#     --release --package "$canister"

#   candid-extractor "target/wasm32-unknown-unknown/release/$canister.wasm" >"$canister_root/$canister.did"
# }

# # List of canisters to generate candid files for
# # (comma separated list of canister names)

# CANISTERS=dtoken,dfinance_backend,debttoken

# for canister in $(echo $CANISTERS | sed "s/,/ /g"); do
#   generate_did "$canister"
# done

# echo "did generated"

cargo build --release --target wasm32-unknown-unknown --package dfinance_backend

candid-extractor target/wasm32-unknown-unknown/release/dfinance_backend.wasm >src/dfinance_backend/dfinance_backend.did