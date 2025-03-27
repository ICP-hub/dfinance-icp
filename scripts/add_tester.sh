#!/bin/bash

CANISTER_NAME=dfinance_backend

# Define the username and principal ID of the tester (passed as arguments)
USERNAME="tester1"
TESTER_PRINCIPAL="nqqy3-ccgwo-uyp3j-44xrd-5e3my-atqx5-5y6rz-xpnu4-hie4j-o7mrd-eae"

if [ -z "$USERNAME" ] || [ -z "$TESTER_PRINCIPAL" ]; then
  echo "Usage: $0 <username> <tester_principal>"
  exit 1
fi

# Call the add_tester function
dfx canister call $CANISTER_NAME add_tester "(\"$USERNAME\", principal \"$TESTER_PRINCIPAL\")"