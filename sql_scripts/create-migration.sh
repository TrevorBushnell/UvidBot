#!/bin/bash

# Move the execution context to the directory where this script lives
cd "$(dirname "$0")"

# Configuration - Now pointing to the migrations folder
TARGET_DIR="migrations"
MIGRATION_NAME=$1

# 1. Validate input
if [ -z "$MIGRATION_NAME" ]; then
    echo "Error: Please provide a name for the migration."
    echo "Usage: ./new_migration.sh name_of_migration"
    exit 1
fi

# 2. Ensure the directory exists
mkdir -p "$TARGET_DIR"

# 3. Determine the next order number
# ls -v handles natural numerical sorting (1, 2, 10...)
LAST_FILE=$(ls -v "$TARGET_DIR" 2>/dev/null | grep -E '^[0-9]+_' | tail -n 1)

if [ -z "$LAST_FILE" ]; then
    NEXT_NUM=1
else
    # Extract the number from the start of the filename
    LAST_NUM=$(echo "$LAST_FILE" | cut -d'_' -f1)
    # Increment the number
    NEXT_NUM=$((LAST_NUM + 1))
fi

# 4. Create the file (e.g., 1_add_user_table.sql)
NEW_FILENAME="${NEXT_NUM}_${MIGRATION_NAME}.sql"
FULL_PATH="${TARGET_DIR}/${NEW_FILENAME}"

touch "$FULL_PATH"

echo "Created new migration: $FULL_PATH"