#!/bin/bash

# Move the execution context to the directory where this script lives
cd "$(dirname "$0")"

# Configuration
TARGET_DIR="data_setup"
MIGRATION_NAME=$1

# 1. Validate input
if [ -z "$MIGRATION_NAME" ]; then
    echo "Error: Please provide a name for the script."
    echo "Usage: ./new_script.sh name_of_script"
    exit 1
fi

# 2. Ensure the directory exists
mkdir -p "$TARGET_DIR"

# 3. Determine the next order number
# ls -v sorts naturally (1, 2, 10) instead of alphabetically (1, 10, 2)
LAST_FILE=$(ls -v "$TARGET_DIR" 2>/dev/null | grep -E '^[0-9]+_' | tail -n 1)

if [ -z "$LAST_FILE" ]; then
    NEXT_NUM=1
else
    # Extract the number from the start of the filename
    LAST_NUM=$(echo "$LAST_FILE" | cut -d'_' -f1)
    # Increment the number (no leading zero handling needed now)
    NEXT_NUM=$((LAST_NUM + 1))
fi

# 4. Create the file (e.g., 3_sm64_star.sql)
NEW_FILENAME="${NEXT_NUM}_${MIGRATION_NAME}.sql"
FULL_PATH="${TARGET_DIR}/${NEW_FILENAME}"

touch "$FULL_PATH"

echo "Created new data setup script: $FULL_PATH"