#!/bin/bash
set -e

# Configuration
APP_USER="nostr"
APP_DIR="/opt/maiqr-relay"
DOMAIN="relay.maiqr.app"  # Replace with your domain
NODE_VERSION="18"

echo "Starting DigitalOcean deployment setup..."

# 1. System Updates
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# 2. Install Required Packages
echo "Installing required packages..."
apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

# 3. Configure Firewall
echo "Configuring firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 5432/tcp  # PostgreSQL
ufw --force enable

# 4. Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 5. Create Application User
echo "Setting up application user..."
if ! id -u $APP_USER >/dev/null 2>&1; then
    useradd -m -s /bin/bash $APP_USER
fi

# 6. Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER nostr_user WITH PASSWORD 'your_password_here';" || true
sudo -u postgres psql -c "CREATE DATABASE nostr_relay OWNER nostr_user;" || true
sudo -u postgres psql -c "ALTER USER nostr_user WITH SUPERUSER;" || true

# Update PostgreSQL configuration
cat > /etc/postgresql/*/main/conf.d/custom.conf << EOF
# Connection Settings
max_connections = 100
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB

# Write Ahead Log
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Query Planning
random_page_cost = 1.1
effective_cache_size = 768MB

# Security
ssl = on
ssl_prefer_server_ciphers = on
EOF

# Restart PostgreSQL
systemctl restart postgresql

# 7. Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;

        # Buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/xml text/javascript application/x-javascript application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 8. SSL Certificate
echo "Setting up SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com

# 9. Application Deployment
echo "Deploying application..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Clean up PM2 processes
pm2 delete all || true
pm2 kill || true
rm -rf ~/.pm2

cd $APP_DIR

# Extract application
echo "Extracting application..."
tar -xzf /tmp/nostr-relay-clean.tar.gz
chown -R $APP_USER:$APP_USER .

# Install dependencies
echo "Installing dependencies..."
npm install

# Run migrations
echo "Running database migrations..."
npx ts-node scripts/migrate-to-latest.ts

# Start application with PM2
echo "Starting application..."
pm2 start npm --name "maiqr-relay" -- run start:prod
pm2 save
pm2 startup

# 10. Setup PM2 Monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

echo "Deployment complete! Your Nostr relay is now running at https://$DOMAIN"
echo "Please make sure to:"
echo "1. Update the PostgreSQL password in the configuration"
echo "2. Update the email address for SSL certificate notifications"
echo "3. Configure your environment variables in $APP_DIR/.env"
echo "4. Set up regular database backups"
echo "5. Configure monitoring alerts"
