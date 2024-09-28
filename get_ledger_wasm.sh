#!/bin/bash

# Set the IC version (commit hash) that you want to download the ledger WASM for
export IC_VERSION=d87954601e4b22972899e9957e800406a0a6b929

# Download the ledger WASM file using curl
echo "Downloading ledger-canister.wasm.gz..."
curl -o ledger.wasm.gz https://download.dfinity.systems/ic/$IC_VERSION/canisters/ledger-canister.wasm.gz

# Unzip the downloaded file to get the .wasm file
echo "Unzipping ledger.wasm.gz..."
gunzip ledger.wasm.gz

echo "Ledger WASM downloaded and unzipped as 'ledger.wasm'"
