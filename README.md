# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs?ref=badge_shield)

A high-performance Nostr relay implementation powered by [NestJS](https://nestjs.com/) and PostgreSQL.

## Documentation

📚 **Getting Started**
- [Installation Guide](docs/installation.md) - Complete setup instructions
- [Deployment Guide](docs/deployment.md) - Production deployment walkthrough
- [Security Guide](docs/security.md) - Security best practices and configuration
- [Monitoring Guide](docs/monitoring.md) - System monitoring and maintenance
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions
- [NIP-29 Guide](docs/nip-29.md) - Group chat implementation details

## Quick Start

1. **Clone and Install:**
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
npm install
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start PostgreSQL:**
```bash
docker compose --profile dev up -d
```

4. **Run Migrations:**
```bash
npx ts-node scripts/migrate-to-latest.ts
```

5. **Start the Relay:**
```bash
npm run start:dev
```

Quick Deploy: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

## Features

### NIPs Support Status

 🟢 Full implemented 🟡 Partially implemented 🔴 Not implemented

| NIP | Status | Description | Note |
|-----|:------:|-------------|------|
| [01](https://github.com/nostr-protocol/nips/blob/master/01.md) | 🟢 | Basic protocol flow | Core functionality |
| [02](https://github.com/nostr-protocol/nips/blob/master/02.md) | 🟢 | Contact List | |
| [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | 🟢 | Encrypted Direct Message | |
| [05](https://github.com/nostr-protocol/nips/blob/master/05.md) | 🟢 | DNS Identifiers | |
| [09](https://github.com/nostr-protocol/nips/blob/master/09.md) | 🔴 | Event Deletion | No real deletion in distributed system |
| [11](https://github.com/nostr-protocol/nips/blob/master/11.md) | 🟢 | Relay Information | |
| [13](https://github.com/nostr-protocol/nips/blob/master/13.md) | 🟢 | Proof of Work | |
| [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | 🟢 | Report Events | Strict validation |
| [22](https://github.com/nostr-protocol/nips/blob/master/22.md) | 🟢 | Event Timestamps | |
| [26](https://github.com/nostr-protocol/nips/blob/master/26.md) | 🟢 | Delegated Events | |
| [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | 🟢 | Public Chat | |
| [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | 🟢 | Group Chat | See [Guide](docs/nip-29.md) |
| [40](https://github.com/nostr-protocol/nips/blob/master/40.md) | 🟢 | Expiration | |
| [42](https://github.com/nostr-protocol/nips/blob/master/42.md) | 🟢 | Authentication | |
| [45](https://github.com/nostr-protocol/nips/blob/master/45.md) | 🔴 | Counting | |
| [50](https://github.com/nostr-protocol/nips/blob/master/50.md) | 🟢 | Search | |

## Security Features

Our relay implements comprehensive security measures across multiple layers:

### Connection Security
- Maximum connections per IP
- WebSocket message size limits
- Authentication timeouts
- Event size restrictions
- Subscription filter limits
- Rate limiting per client

### Database Security
- Connection pooling
- Query timeouts
- SSL/TLS encryption
- Statement timeouts
- Idle connection management
- Comprehensive error logging

### Configuration

Key security settings can be configured via environment variables:

```env
# WebSocket Security
WS_MAX_CONNECTIONS_PER_IP=10
WS_MAX_MESSAGE_SIZE=65536
WS_RATE_LIMIT_TTL=60000
WS_RATE_LIMIT_COUNT=30
WS_AUTH_TIMEOUT=30000

# Database Security
DATABASE_SSL=true
DATABASE_MIN_CONNECTIONS=2
DATABASE_MAX_CONNECTIONS=10
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=15000
```

For detailed security configuration, see our [Security Guide](docs/security.md).

## Installation and Setup

### Prerequisites
- Node.js (LTS version recommended)
- Docker and Docker Compose
- PostgreSQL 15 (if not using Docker)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
   cd nostr-relay-nestjs
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL in development mode:
   ```bash
   docker compose --profile dev up -d
   ```

4. Install dependencies and run migrations:
   ```bash
   npm install
   npx ts-node scripts/migrate-to-latest.ts
   ```

5. Start the application:
   ```bash
   npm run start
   ```

## Deployment Guide

This section provides detailed instructions for deploying the relay on a production server (tested on Ubuntu/DigitalOcean).

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Nginx
- PM2 (`npm install -g pm2`)
- Domain name with DNS configured

### Step 1: Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
```

2. Install dependencies:
```bash
npm install
```

3. Generate relay keys:
```bash
node generate-keys.js
# Save the output - you'll need the public key for the .env file
```

### Step 2: Database Setup

1. Install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. Create database and user:
```bash
sudo -u postgres psql

CREATE DATABASE nostr_relay;
CREATE USER nostr_relay WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nostr_relay TO nostr_relay;
\q
```

### Step 3: Environment Configuration

1. Create .env file:
```bash
cp example.env .env
```

2. Configure essential variables:
```env
# Database
DATABASE_URL=postgresql://nostr_relay:your_password@localhost:5432/nostr_relay

# Relay Configuration
RELAY_NAME="Your Relay Name"
RELAY_DESCRIPTION="Your relay description"
RELAY_PUBKEY="your-public-key-from-generate-keys"
MIN_POW_DIFFICULTY=1

# Server Configuration
PORT=3000
HOST=127.0.0.1
```

### Step 4: Build and Deploy

1. Build the application:
```bash
npm run build
```

2. Set up PM2 for process management:
```bash
pm2 start dist/src/main.js --name nostr-relay
pm2 save
pm2 startup
```

### Step 5: Nginx Configuration

1. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/your-domain
```

2. Add the following configuration:
```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # WebSocket and HTTP proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;

        # Allow large uploads
        client_max_body_size 10M;
    }
}
```

3. Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificate

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

### Common Issues and Troubleshooting

1. **Port 3000 Already in Use**
   - Check for existing processes: `lsof -i :3000`
   - Kill conflicting process: `kill -9 <PID>`
   - Ensure no systemd services are auto-starting: `systemctl list-units | grep nostr`

2. **Database Connection Issues**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check connection string in .env
   - Ensure database user has proper permissions

3. **WebSocket Connection Failed**
   - Verify Nginx configuration
   - Check PM2 process status: `pm2 status`
   - Review logs: `pm2 logs nostr-relay`

### Monitoring and Maintenance

1. View application logs:
```bash
pm2 logs nostr-relay
```

2. Monitor performance:
```bash
pm2 monit
```

3. Check metrics:
```bash
curl http://localhost:3000/metrics
```

4. Restart the relay:
```bash
pm2 restart nostr-relay
```

### Adding to Public Directories

Once your relay is running, consider adding it to public directories:
- [nostr.watch](https://nostr.watch/add)
- [nostr.info](https://nostr.info)

Use your WebSocket URL: `wss://your-domain.com`

## Production Deployment Guide

### Key Generation and Security

Before deploying the relay, you must generate a key pair for relay authentication:

```bash
# Generate keys using the provided script
node scripts/generate-keys.js
```

The script will output:
- A 64-character public key
- A private key for authentication

Important security notes:
- Store the private key securely (e.g., password manager)
- Never share or expose the private key
- Add only the public key to your `.env` file
- Verify the public key is exactly 64 characters

### Environment Configuration

Create a production `.env` file with these settings:

```env
# Required Core Settings
DATABASE_URL=postgresql://user:password@localhost:5432/nostr_relay
RELAY_PUBKEY=<your-64-character-public-key>

# Server Configuration
PORT=3000
HOST=127.0.0.1

# Performance Tuning
MAX_SUBSCRIPTION_PER_CLIENT=20
MAX_FILTERS_PER_SUBSCRIPTION=10
MIN_POW_DIFFICULTY=0
MAX_WS_PAGE_SIZE=100
MAX_WS_RESPONSE_SIZE=1000
MAX_WS_OUTGOING_RATE_LIMIT=3

# Search Configuration
MEILI_SEARCH_SYNC_EVENT_KINDS=0,1,30023,1984

# Optional Web of Trust Settings
WOT_TRUST_ANCHOR_PUBKEY=
WOT_TRUST_DEPTH=
WOT_FETCH_FOLLOW_LIST_FROM=
```

Performance recommendations:
- Adjust `MAX_WS_PAGE_SIZE` based on your server capacity
- Monitor `MAX_SUBSCRIPTION_PER_CLIENT` impact on memory usage
- Set appropriate `MIN_POW_DIFFICULTY` for spam prevention

### Systemd Service Configuration

Create a systemd service file for automatic startup:

```bash
sudo nano /etc/systemd/system/nostr-relay.service
```

Add this content:
```ini
[Unit]
Description=Nostr Relay Service
After=network.target postgresql.service nginx.service
Wants=postgresql.service nginx.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/path/to/nostr-relay
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin:/usr/local/node/bin

ExecStart=/usr/bin/node dist/src/main.js

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
LogLevelMax=debug

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nostr-relay
sudo systemctl start nostr-relay
```

### Security with Fail2ban

1. Install and configure fail2ban:
```bash
sudo apt update
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

2. Create Nostr relay jail configuration:
```bash
sudo tee /etc/fail2ban/jail.d/nostr-relay.conf << 'EOF'
[nostr-relay]
enabled = true
port = 80,443
filter = nostr-relay
logpath = /var/log/nginx/access.log
maxretry = 20
findtime = 60
bantime = 3600
EOF
```

3. Create Nostr relay filter:
```bash
sudo tee /etc/fail2ban/filter.d/nostr-relay.conf << 'EOF'
[Definition]
failregex = ^<HOST> .* "(?:GET|POST|HEAD|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH) .*" (?:403|400|404|405) .*$
            ^<HOST> .* "(WS|GET|POST)" .* (?:403|400|405) .*$
ignoreregex =
EOF
```

4. Enable and start fail2ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Service Management

Common service management commands:

```bash
# View service status
sudo systemctl status nostr-relay
sudo systemctl status fail2ban

# View logs
journalctl -u nostr-relay -f
tail -f /var/log/fail2ban.log

# Restart services
sudo systemctl restart nostr-relay
sudo systemctl restart fail2ban

# Check banned IPs
sudo fail2ban-client status nostr-relay

# Unban an IP
sudo fail2ban-client set nostr-relay unbanip <IP_ADDRESS>
```

### Nginx Configuration

Configure Nginx as a reverse proxy with SSL termination:

```nginx
# /etc/nginx/sites-available/nostr-relay.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # WebSocket Proxy Configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        
        # Buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
    }
}
```

SSL setup with Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

### Monitoring and Maintenance

1. **Database Maintenance**:
   ```bash
   # Regular vacuum
   psql -d nostr_relay -c "VACUUM ANALYZE;"
   
   # Backup database
   pg_dump -Fc nostr_relay > backup_$(date +%Y%m%d).dump
   
   # Monitor database size
   psql -d nostr_relay -c "SELECT pg_size_pretty(pg_database_size('nostr_relay'));"
   ```

2. **Performance Monitoring**:
   - Monitor WebSocket connections:
   ```bash
   # Check current connections
   netstat -an | grep :3000 | wc -l
   
   # Monitor memory usage
   ps aux | grep nostr-relay
   ```

3. **Log Monitoring**:
   ```bash
   # Check for errors
   journalctl -u nostr-relay -p err
   
   # Monitor real-time logs
   journalctl -u nostr-relay -f
   ```

4. **Backup Strategy**:
   - Daily database backups
   - Weekly configuration backups
   - Regular SSL certificate renewal checks
   - Periodic key rotation (if needed)

### Troubleshooting Guide

1. **WebSocket Connection Issues**:
   - Check Nginx logs: `tail -f /var/log/nginx/error.log`
   - Verify WebSocket upgrade headers
   - Test connection: `wscat -c wss://your-domain.com`
   - Check firewall rules for port 443

2. **Database Connection Problems**:
```bash
# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Verify connection
psql -d $DATABASE_URL -c "SELECT 1;"
```

3. **Service Start Failures**:
```bash
# Check detailed service status
systemctl status nostr-relay

# Check journal logs
journalctl -u nostr-relay -n 100

# Verify permissions
ls -la /path/to/relay
```

4. **Performance Issues**:
   - Check system resources:
     ```bash
     top -u nostr
     free -m
     df -h
     ```
   - Monitor database connections:
     ```bash
     psql -d nostr_relay -c "SELECT count(*) FROM pg_stat_activity;"
     ```
   - Check for slow queries:
     ```bash
     psql -d nostr_relay -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
     ```

## Process Management with PM2

For production deployments, we recommend using PM2 for process management. PM2 ensures your relay stays running and automatically restarts if it crashes.

### PM2 Setup

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the relay with PM2:
```bash
pm2 start npm --name "nostr-relay" -- start
```

3. Enable startup script (auto-restart on server reboot):
```bash
pm2 startup
pm2 save
```

4. Useful PM2 commands:
```bash
# View logs
pm2 logs nostr-relay

# Restart application
pm2 restart nostr-relay

# View status
pm2 status

# View detailed metrics
pm2 monit
```

### Recent Updates

1. **Custom WebSocket Adapter**
   - Implemented enhanced WebSocket connection management
   - Added IP-based rate limiting
   - Improved message validation and security checks
   - Added support for connection authentication

2. **Nginx Configuration**
   - Updated WebSocket proxy settings
   - Added buffering optimization
   - Improved header handling for WebSocket upgrades

Example Nginx configuration for WebSocket support:
```nginx
server {
    listen 80;
    server_name your-relay-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }
}
```

## Deployment

The `deploy` directory contains all necessary files for production deployment:

### Scripts
- `deploy/scripts/deploy.sh` - Main deployment script for setting up the relay
- `deploy/scripts/check-env.sh` - Environment variable validation script

### Nginx Configuration
- `deploy/nginx/relay-final.conf` - Production Nginx configuration
- `deploy/nginx/connection-upgrade.conf` - WebSocket connection upgrade settings

For detailed deployment instructions, see our [Deployment Guide](docs/deployment.md).

## Testing

The `tests` directory contains various test scripts:

- `test-nostr.js` - Tests relay connectivity using nostr-tools
- `test-relay.js` - Low-level WebSocket connection test
- `test-ws-server.js` - Test WebSocket server for development

To run the tests:
```bash
# Run nostr-tools based test
node tests/test-nostr.js

# Run WebSocket connection test
node tests/test-relay.js

# Start test WebSocket server
node tests/test-ws-server.js
```

## Development Tools

When running in development mode (`--profile dev`):
- **pgAdmin**: Access at http://localhost:5050
  - Email: admin@example.com
  - Password: admin
- **PostgreSQL**: Development settings
  - Host: localhost
  - Port: 5432
  - Database: nostr_relay
  - User: nostr_user
  - Password: nostr_password

## License

This project is licensed under the MIT License - see the LICENSE file for details.
