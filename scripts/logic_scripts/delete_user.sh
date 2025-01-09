#!/bin/bash

# Number of users to delete
NUM_USERS=41

# Loop to delete users
for ((i=1; i<=NUM_USERS; i++))
do
  IDENTITY="user$i"

  # Check if the identity exists
  if dfx identity list | grep -q "$IDENTITY"; then
    echo "Deleting identity: $IDENTITY"
    dfx identity remove "$IDENTITY"
    
    if [ $? -eq 0 ]; then
      echo "Identity $IDENTITY deleted successfully!"
    else
      echo "Failed to delete identity $IDENTITY. Please check for errors."
    fi
  else
    echo "Identity $IDENTITY does not exist. Skipping."
  fi
done

# Switch back to the default identity
dfx identity use default

echo "All specified users deleted!"
