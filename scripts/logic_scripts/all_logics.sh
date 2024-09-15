#!/bin/bash

set -e

echo "Running supply logic"
output1=$(./supply.sh)
echo "Supply executed successfully: $output1 "
echo "--------------------------------------"
echo "--------------------------------------"

echo "Running borrow logic"
output2=$(./borrow.sh)
echo "Borrow executed successfully: $output2 "
echo "--------------------------------------"
echo "--------------------------------------"

echo "Running repay logic"
output3=$(./repay.sh)
echo "Repay executed successfully: $output3 "
echo "--------------------------------------"
echo "--------------------------------------"

echo "Running withdraw logic"
output4=$(./withdraw.sh)
echo "Withdraw executed successfully: $output4 "
echo "--------------------------------------"
echo "--------------------------------------"

echo "Running liquidation logic"
output5=$(./liquidation.sh)
echo "Liquidation executed successfully: $output5 "
echo "--------------------------------------"
echo "--------------------------------------"

echo "all logics executed successfully"
