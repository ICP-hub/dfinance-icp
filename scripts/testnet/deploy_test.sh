set -e

#!/bin/bash

SOURCE_FILE="../../dfx.test.json"
DEST_FILE="../../dfx.json"


if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Error: Source file '$SOURCE_FILE' not found." >&2
  exit 1
fi

cat "$SOURCE_FILE" > "$DEST_FILE"

if [[ -x "./deploy.sh" ]]; then
  ./deploy.sh
else
  echo "Error: Deployment script is not found or not executable." >&2
  exit 1
fi

