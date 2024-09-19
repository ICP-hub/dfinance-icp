#!/bin/bash

set -e

output1=$(./deploy_token_ledger.sh)
echo "token ledger: $output"

output3=$(./deploy_dtoken.sh)
echo "dtoken ledger: $output"

output2=$(./deploy_debttoken.sh)
echo "debttoken ledger: $output"

echo "all scripts deployed successfully"
