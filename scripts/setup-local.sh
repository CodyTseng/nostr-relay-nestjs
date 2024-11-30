#!/bin/bash
set -e

echo "Setting up local Nostr relay environment..."

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Create PostgreSQL user and database
echo "Setting up PostgreSQL database..."
createuser -s nostr_user || true
createdb -O nostr_user nostr_relay || true

# Set password for nostr_user
psql -c "ALTER USER nostr_user WITH PASSWORD 'nostr_password';" || true

# Install dependencies
echo "Installing project dependencies..."
npm install

# Run database migrations
echo "Running database migrations..."
npm run migration:run

# Start the relay with PM2
echo "Starting Nostr relay with PM2..."
pm2 delete nostr-relay 2>/dev/null || true
pm2 start dist/src/main.js --name nostr-relay

echo "Local setup complete!"
echo "Your Nostr relay should be running at http://localhost:3000"
echo "To view logs, run: pm2 logs nostr-relay"
echo "To stop the relay, run: pm2 stop nostr-relay"
