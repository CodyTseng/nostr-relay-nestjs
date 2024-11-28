# Production Deployment Guide

This guide covers the complete production deployment process for your Nostr Relay. For monitoring and maintenance procedures after deployment, please refer to the [Monitoring and Maintenance Guide](monitoring.md).

## Table of Contents
- [System Requirements](#system-requirements)
- [Initial Server Setup](#initial-server-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Security Hardening](#security-hardening)

## System Requirements

### Hardware Recommendations
- CPU: 2+ cores
- RAM: 2GB minimum (4GB recommended)
- Storage: 20GB minimum (SSD recommended)
- Network: 100Mbps minimum

### Software Requirements
- Ubuntu 20.04 LTS or later
- PostgreSQL 14+
- Node.js 18+
- Nginx
- PM2 (for process management)

## Initial Server Setup

### Basic Security Configuration
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Database Setup

### Install PostgreSQL
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL
sudo apt install postgresql-14 postgresql-contrib-14

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configure PostgreSQL
```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE nostr_relay;"
sudo -u postgres psql -c "CREATE USER nostr_user WITH ENCRYPTED PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nostr_relay TO nostr_user;"

# Configure PostgreSQL for better performance
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add these optimizations:
```ini
max_connections = 100
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Application Deployment

### Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### Deploy Application
```bash
# Create application directory
sudo mkdir -p /opt/nostr-relay
sudo chown -R $USER:$USER /opt/nostr-relay

# Clone repository
git clone https://github.com/yourusername/nostr-relay-nestjs.git /opt/nostr-relay
cd /opt/nostr-relay

# Install dependencies and build
npm install
npm run build

# Configure environment
cp .env.example .env
nano .env  # Set your environment variables

# Start with PM2
pm2 start dist/src/main.js --name nostr-relay
pm2 save
pm2 startup
```

## Nginx Configuration

### Install and Configure Nginx
```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/nostr-relay
```

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
        proxy_cache off;
        proxy_redirect off;
        client_max_body_size 50M;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/nostr-relay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/TLS Setup

### Install Certbot and Get Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Security Hardening

### Configure Fail2ban
```bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.d/nostr-relay.conf
```

Add:
```ini
[nostr-relay]
enabled = true
port = 80,443
filter = nostr-relay
logpath = /var/log/nginx/access.log
maxretry = 5
findtime = 300
bantime = 3600
```

Create filter:
```bash
sudo nano /etc/fail2ban/filter.d/nostr-relay.conf
```

Add:
```ini
[Definition]
failregex = ^<HOST> .* "POST /api/v1/events" .* 400
            ^<HOST> .* "POST /api/v1/events" .* 429
ignoreregex =
```

### Enable and Start Fail2ban
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Next Steps

After completing the deployment, refer to the [Monitoring and Maintenance Guide](monitoring.md) for detailed information about:
- System and application monitoring
- Database maintenance
- Backup procedures
- Update processes
- Health checks
- Troubleshooting common issues
