# Deployment Guide

This guide covers deploying the Nostr relay in a production environment.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js v18+
- PostgreSQL v15+
- Nginx
- PM2 (`npm install -g pm2`)
- Domain name with DNS configured

## Step-by-Step Deployment

### 1. Server Setup

1. **Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Install PostgreSQL**
```bash
sudo apt install postgresql postgresql-contrib
```

### 2. Database Setup

1. **Create Database and User**
```bash
sudo -u postgres psql

CREATE DATABASE nostr_relay;
CREATE USER nostr_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nostr_relay TO nostr_user;
```

2. **Configure PostgreSQL**
Edit `/etc/postgresql/15/main/postgresql.conf`:
```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 3. Application Setup

1. **Clone Repository**
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with production settings:
```env
NODE_ENV=production
DATABASE_URL=postgres://nostr_user:your_password@localhost:5432/nostr_relay
WS_PORT=3000
```

4. **Run Migrations**
```bash
npx ts-node scripts/migrate-to-latest.ts
```

### 4. Process Management

1. **Install PM2**
```bash
npm install -g pm2
```

2. **Create PM2 Config**
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'nostr-relay',
    script: 'dist/src/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. **Start Application**
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 5. Nginx Setup

1. **Install Nginx**
```bash
sudo apt install nginx
```

2. **Configure Nginx**
Create `/etc/nginx/sites-available/nostr-relay`:
```nginx
server {
    listen 80;
    server_name your.domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/nostr-relay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Setup

1. **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Get Certificate**
```bash
sudo certbot --nginx -d your.domain.com
```

### 7. Monitoring

1. **View Logs**
```bash
pm2 logs nostr-relay
```

2. **Monitor Status**
```bash
pm2 monit
```

3. **View Metrics**
```bash
pm2 plus
```

## Maintenance

### Backup Strategy

1. **Database Backups**
```bash
pg_dump -U nostr_user nostr_relay > backup.sql
```

2. **Configuration Backups**
- Back up `.env`
- Back up `ecosystem.config.js`
- Back up Nginx configurations

### Updates

1. **Pull Updates**
```bash
git pull
```

2. **Update Dependencies**
```bash
npm install
```

3. **Rebuild and Restart**
```bash
npm run build
pm2 restart nostr-relay
```
