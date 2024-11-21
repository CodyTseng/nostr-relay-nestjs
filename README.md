# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs?ref=badge_shield)

Powered by [nostr-relay](https://github.com/CodyTseng/nostr-relay) & [NestJS](https://nestjs.com/).

A high-performance nostr relay, using PostgreSQL.

If you'd like to help me test the reliability of this relay implementation, you can add wss://nostr-relay.app to your relay list (it's free) 💜⚡️

> **Note:** Please use the released version of this code. The latest version may contain changes to migration scripts and other elements that are not finalized.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

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
| [NIP-40: Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md)                                 |   🟢   |                                          |
| [NIP-42: Authentication of clients to relays](https://github.com/nostr-protocol/nips/blob/master/42.md)                  |   🟢   |                                          |
| [NIP-45: Counting results](https://github.com/nostr-protocol/nips/blob/master/45.md)                                     |   🔴   |                                          |
| [NIP-50: Keywords filter](https://github.com/nostr-protocol/nips/blob/master/50.md)                                      |   🟢   |                                          |

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

### Service Management

Create a systemd service for automatic management:

```ini
# /etc/systemd/system/nostr-relay.service
[Unit]
Description=Nostr Relay Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=nostr
Group=nostr
WorkingDirectory=/path/to/relay
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Service management commands:
```bash
# Enable and start the service
sudo systemctl enable nostr-relay
sudo systemctl start nostr-relay

# Check status
sudo systemctl status nostr-relay

# View logs
journalctl -u nostr-relay -f
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
