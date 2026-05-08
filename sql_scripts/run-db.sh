#!/bin/bash

# Move the execution context to the directory where this script lives
cd "$(dirname "$0")"

# The database is now reliably one level up from this script's location
DB_FILE="../main.db"

# Function to execute scripts in a directory
run_sql_scripts() {
    local subdir=$1
    if [ -d "$subdir" ]; then
        echo "--> Processing scripts in: $subdir"
        
        # 'ls -v' handles the 1, 2, 10 sorting order
        for script in $(ls -v "$subdir"/*.sql 2>/dev/null); do
            echo "Executing $script..."
            
            # Execute and check for failure
            sqlite3 "$DB_FILE" < "$script"
            
            if [ $? -ne 0 ]; then
                echo "FAILED: Error in $script. Aborting entire process."
                exit 1
            fi
        done
    else
        echo "Directory $subdir not found, skipping..."
    fi
}

# 1. Execute data_setup scripts
run_sql_scripts "data_setup"

# 2. Execute migrations scripts
# This will only be reached if ALL data_setup scripts succeed
run_sql_scripts "migrations"

echo "Database update complete."