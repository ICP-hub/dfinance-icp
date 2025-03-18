#!/bin/bash

for i in {1..100000}
do
    echo "Updating reserve price: Attempt $i"
   dfx canister call dfinance_backend update_reserves_price  # Replace this with your actual command
    sleep 0.5  # Add a delay of 0.5 seconds to avoid overwhelming the system (adjust as needed)
done

echo "All 200 updates completed!"
