# Production Deployment Guide

This guide covers the complete production deployment process for your Nostr Relay.

## Server Setup

### System Requirements
- Ubuntu 20.04 or later
- 1GB RAM minimum (2GB recommended)
- 20GB storage minimum

### Basic Server Security

1. Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Configure UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Nginx Configuration

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Configure SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. Nginx configuration for WebSocket support:
```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

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
    }
}
```

## Application Deployment

1. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

2. Install PM2:
```bash
sudo npm install -p pm2
```

3. Deploy application:
```bash
pm2 start dist/src/main.js --name nostr-relay
pm2 save
pm2 startup
```

## Security Hardening

### Fail2ban Configuration

1. Install Fail2ban:
```bash
sudo apt install fail2ban
```

2. Create Nostr relay jail configuration:
```bash
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

## Monitoring

### Basic Monitoring Commands

1. Check relay status:
```bash
pm2 status nostr-relay
```

2. View logs:
```bash
pm2 logs nostr-relay
```

3. Monitor database connections:
```bash
psql -d nostr_relay -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```
