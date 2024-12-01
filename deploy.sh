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
rm -rf maiqr-relay.old
[ -d maiqr-relay ] && mv maiqr-relay maiqr-relay.old

echo "Cloning latest version..."
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git maiqr-relay
cd maiqr-relay
git checkout feat/nip-29-implementation

echo "Restoring environment configuration..."
cp /opt/.env.backup .env

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Copying views to dist..."
mkdir -p dist/views
cp -r src/views/* dist/views/

echo "Setting proper permissions..."
chown -R root:root .
chmod -R 755 .

echo "Starting service..."
NODE_ENV=production pm2 start dist/src/main.js --name nostr-relay

echo "Saving PM2 process list..."
pm2 save

echo "Waiting for service to start..."
sleep 5

echo "Service status:"
pm2 list
pm2 logs nostr-relay
