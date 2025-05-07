set -e

#!/bin/bash

SOURCE_FILE="../../dfx.main.json"

DEST_FILE="../../dfx.json"

cat "$SOURCE_FILE" > "$DEST_FILE"

./deploy.sh

