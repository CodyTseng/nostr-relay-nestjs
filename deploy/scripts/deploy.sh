#!/bin/bash
set -e

echo "Starting deployment..."

# Clean up PM2 processes
echo "Cleaning up PM2 processes..."
pm2 delete all || true
pm2 kill || true
rm -rf ~/.pm2

echo "Cleaning up old deployments..."
cd /opt
rm -rf maiqr-relay
rm -rf nostr-relay

echo "Extracting new deployment..."
tar -xzf nostr-relay-clean.tar.gz
mv nostr-relay-nestjs maiqr-relay
cd maiqr-relay

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npx ts-node scripts/migrate-to-latest.ts

echo "Starting application with PM2..."
pm2 start npm --name "maiqr-relay" -- run start:prod

echo "Deployment complete!"
