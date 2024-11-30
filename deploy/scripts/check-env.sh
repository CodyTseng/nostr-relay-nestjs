#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Source the .env file
source .env

# List of required environment variables
required_vars=("DATABASE_URL" "PORT" "WS_PORT")

# Check each required variable
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env file"
        exit 1
    fi
done

echo "Environment check passed!"
exit 0
