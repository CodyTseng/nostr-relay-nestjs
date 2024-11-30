#!/bin/bash

echo "Checking for processes on port 3000..."

# Find and kill any process using port 3000
if lsof -i :3000 > /dev/null; then
    echo "Found existing processes on port 3000, cleaning up..."
    # Kill processes using port 3000
    lsof -ti :3000 | xargs kill -9
    echo "Cleaned up port 3000"
fi

# Delete any existing PM2 processes named nostr-relay
if pm2 list | grep -q "nostr-relay"; then
    echo "Found existing PM2 nostr-relay processes, cleaning up..."
    pm2 delete nostr-relay
    echo "Cleaned up PM2 processes"
fi

echo "Starting nostr-relay..."
pm2 start npm --name "nostr-relay" -- run start:dev

echo "Relay started! Use 'pm2 logs nostr-relay' to view logs"
