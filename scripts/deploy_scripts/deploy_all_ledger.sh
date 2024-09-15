#!/bin/bash

set -e


output1=$(./deploy_ckbtc.sh)
echo "ckbtc ledger: $output"



output3=$(./deploy_dtoken.sh)
echo "dtoken ledger: $output"

output2=$(./deploy_debttoken.sh)
echo "debttoken ledger: $output"

output4=$(./deploy_cketh.sh)
echo "cketh ledger: $output"

echo "all scripts deployed successfully"
