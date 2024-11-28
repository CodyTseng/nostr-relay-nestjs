# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs?ref=badge_shield)

A high-performance Nostr relay implementation powered by [NestJS](https://nestjs.com/) and PostgreSQL.

## Getting Started

1. **New to Nostr Relay?**
   - Start with our [Installation Guide](docs/installation.md) for setup instructions
   - Follow our [Quick Start](#quick-start) section below

2. **Ready for Production?**
   - Follow our [Deployment Guide](docs/deployment.md) for production setup
   - Review our [Security Guide](docs/security.md) for best practices
   - Set up proper [Monitoring](docs/monitoring.md) for your relay

3. **Quick Deploy**
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

## Documentation Roadmap

Our documentation is organized to help you at every stage:

1. [Installation Guide](docs/installation.md)
   - Complete setup instructions
   - Development environment setup
   - Basic configuration

2. [Deployment Guide](docs/deployment.md)
   - Production deployment walkthrough
   - Server setup and configuration
   - Nginx and SSL setup

3. [Security Guide](docs/security.md)
   - Security best practices
   - Rate limiting configuration
   - Access control setup

4. [Monitoring Guide](docs/monitoring.md)
   - System monitoring
   - Performance optimization
   - Maintenance procedures
   - Troubleshooting

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start the relay:
```bash
npm run start:dev
```

For detailed setup instructions, see our [Installation Guide](docs/installation.md).

## Features

 🟢 Full implemented 🟡 Partially implemented 🔴 Not implemented

| Feature                                                                                                                  | Status | Note                                     |
| ------------------------------------------------------------------------------------------------------------------------ | :----: | ---------------------------------------- |
| [NIP-01: Basic protocol flow description](https://github.com/nostr-protocol/nips/blob/master/01.md)                      |   🟢   |                                          |
| [NIP-02: Follow List](https://github.com/nostr-protocol/nips/blob/master/02.md)                                          |   🟢   |                                          |
| [NIP-04: Encrypted Direct Message](https://github.com/nostr-protocol/nips/blob/master/04.md)                             |   🟢   |                                          |
| [NIP-05: Mapping Nostr keys to DNS-based internet identifiers](https://github.com/nostr-protocol/nips/blob/master/05.md) |   🟢   |                                          |
| [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)                                       |   🔴   | No real deletion in a distributed system |
| [NIP-11: Relay Information Document](https://github.com/nostr-protocol/nips/blob/master/11.md)                           |   🟢   |                                          |
| [NIP-13: Proof of Work](https://github.com/nostr-protocol/nips/blob/master/13.md)                                        |   🟢   |                                          |
| [NIP-17: Report Events](https://github.com/nostr-protocol/nips/blob/master/17.md)                                        |   🟢   | Strict validation: requires `e` (event) and `p` (pubkey) tags, optional `k` (kind) tag, non-empty reason required |
| [NIP-22: Event created_at Limits](https://github.com/nostr-protocol/nips/blob/master/22.md)                              |   🟢   |                                          |
| [NIP-26: Delegated Event Signing](https://github.com/nostr-protocol/nips/blob/master/26.md)                              |   🟢   |                                          |
| [NIP-28: Public Chat](https://github.com/nostr-protocol/nips/blob/master/28.md)                                          |   🟢   |                                          |
| [NIP-29: Group Chat Events](https://github.com/nostr-protocol/nips/blob/master/29.md)                                   |   🟢   | [Group Chat Guide](docs/nip-29.md)      |
| [NIP-40: Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md)                                 |   🟢   |                                          |
| [NIP-42: Authentication of clients to relays](https://github.com/nostr-protocol/nips/blob/master/42.md)                  |   🟢   |                                          |
| [NIP-45: Counting results](https://github.com/nostr-protocol/nips/blob/master/45.md)                                     |   🔴   |                                          |
| [NIP-50: Keywords filter](https://github.com/nostr-protocol/nips/blob/master/50.md)                                      |   🟢   |                                          |

## Enhanced Security Features

### WebSocket Security
- **Connection Limits**: Configurable maximum connections per IP address
- **Message Size Restrictions**: Limits on WebSocket message sizes to prevent abuse
- **Authentication Timeouts**: Automatic disconnection of unauthenticated clients after a configurable period
- **Event Size Limits**: Maximum size limits for individual events
- **Subscription Controls**: Limits on the number of subscription filters per client
- **Filter Length Restrictions**: Maximum length limits for subscription filters

### Rate Limiting
- **Event Rate Limiting**: Configurable limits on event submissions per time window
- **Request Rate Limiting**: Separate rate limits for different types of requests (EVENT, REQ)
- **Block Duration**: Configurable blocking period for clients exceeding rate limits

### Database Security
- **Connection Pooling**: Configurable minimum and maximum connections
- **Query Timeouts**: Automatic termination of long-running queries
- **SSL Enforcement**: Secure database connections with SSL/TLS
- **Statement Timeouts**: Protection against resource-intensive queries
- **Idle Connection Management**: Automatic cleanup of idle connections
- **Error Logging**: Comprehensive logging of database errors and warnings

### Configuration
You can configure these security features through environment variables:

```env
# WebSocket Security Settings
WS_MAX_MESSAGE_SIZE=65536          # Maximum WebSocket message size in bytes (default: 64KB)
WS_MAX_CONNECTIONS_PER_IP=10       # Maximum concurrent connections per IP
WS_RATE_LIMIT_TTL=60000           # Rate limit time window in milliseconds
WS_RATE_LIMIT_COUNT=30            # Maximum requests per time window
WS_AUTH_TIMEOUT=30000             # Authentication timeout in milliseconds
WS_MAX_EVENT_SIZE=32768           # Maximum event size in bytes (default: 32KB)
WS_MAX_SUBSCRIPTION_FILTERS=10     # Maximum number of subscription filters
WS_MAX_FILTER_LENGTH=1024         # Maximum length of subscription filters

# Database Security Settings
DATABASE_MIN_CONNECTIONS=2      # Minimum number of connections in pool
DATABASE_MAX_CONNECTIONS=10     # Maximum number of connections in pool
DATABASE_IDLE_TIMEOUT=10000    # Idle connection timeout in milliseconds
DATABASE_CONNECTION_TIMEOUT=5000 # Connection timeout in milliseconds
DATABASE_SSL=true              # Enable SSL for database connections
DATABASE_STATEMENT_TIMEOUT=30000 # Statement timeout in milliseconds
DATABASE_QUERY_TIMEOUT=15000   # Query timeout in milliseconds
```

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

## Recent Changes

### 2024 Updates
- Fixed WebSocket connection handling to properly manage undefined request objects and headers
- Improved IP address extraction from WebSocket connections
- Enhanced error handling in the NostrGateway
- Fixed circular dependency in NostrRelayService

## Testing Your Installation

You can verify your relay is working properly using these terminal commands:

1. Test the NIP-11 information endpoint:
```bash
curl -i -H "Accept: application/nostr+json" https://your-domain.com
```

A successful response should look like:
```json
{
  "name": "Your Relay Name",
  "description": "Your relay description",
  "pubkey": "your-public-key",
  "supported_nips": [1, 2, 4, 11, 13, 22, 26, 28, 29, 40],
  "software": "git+https://github.com/HumanjavaEnterprises/nostr-relay-nestjs",
  "version": "2.2.0"
  // ... other configuration details
}
```

2. Test SSL/WebSocket endpoint:
```bash
nc -zv your-domain.com 443
```

You should see: `Connection to your-domain.com port 443 [tcp/https] succeeded!`

3. Check security headers:
```bash
curl -I https://your-domain.com
```

Look for these important headers:
- `strict-transport-security` (HSTS)
- `x-frame-options`
- `x-content-type-options`
- `content-security-policy`

### Common Issues

1. If curl returns "Connection refused":
   - Check if Nginx is running: `systemctl status nginx`
   - Verify your firewall allows port 443: `sudo ufw status`

2. If WebSocket connection fails:
   - Check Nginx error logs: `tail -f /var/log/nginx/error.log`
   - Verify PM2 process is running: `pm2 status`

3. If SSL certificate issues occur:
   - Verify certificate renewal: `certbot certificates`
   - Check SSL configuration: `nginx -t`

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
