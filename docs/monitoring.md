# Monitoring and Maintenance Guide

This guide covers monitoring, maintenance, and operational procedures for your Nostr Relay.

## Table of Contents
- [System Monitoring](#system-monitoring)
- [Application Monitoring](#application-monitoring)
- [Database Monitoring](#database-monitoring)
- [Log Management](#log-management)
- [Backup Procedures](#backup-procedures)
- [Update Procedures](#update-procedures)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## System Monitoring

### Resource Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop                  # CPU and memory usage
iotop                 # Disk I/O
nethogs               # Network usage by process
```

### Disk Usage
```bash
# Check disk space
df -h

# Find large files/directories
du -sh /* | sort -hr | head -n 10

# Monitor disk I/O
iostat -x 1
```

## Application Monitoring

### PM2 Process Management
```bash
# View process status
pm2 status

# Monitor processes in real-time
pm2 monit

# View application logs
pm2 logs nostr-relay

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Performance Metrics
```bash
# Monitor WebSocket connections
netstat -an | grep :8000 | wc -l

# Check open file descriptors
lsof -p $(pgrep -f nostr-relay) | wc -l
```

## Database Monitoring

### Connection Monitoring
```bash
# Check active connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Monitor connection count
watch -n 5 "sudo -u postgres psql -c 'SELECT count(*) FROM pg_stat_activity;'"
```

### Database Statistics
```bash
# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('nostr_relay'));"

# Table sizes
sudo -u postgres psql -d nostr_relay -c "
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name)) as total_size,
    pg_size_pretty(pg_table_size(table_name)) as table_size,
    pg_size_pretty(pg_indexes_size(table_name)) as index_size
FROM (
    SELECT ('"'\"' || schemaname || '"'\"."'\"' || tablename || '"'\"')::regclass AS table_name
    FROM pg_tables
    WHERE schemaname = 'public'
) AS tables
ORDER BY pg_total_relation_size(table_name) DESC;
"
```

### Performance Monitoring
```bash
# Check index usage
sudo -u postgres psql -d nostr_relay -c "
SELECT 
    schemaname || '.' || relname as table,
    indexrelname as index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique AND idx_scan < 50 AND pg_relation_size(relid) > 5 * 8192
ORDER BY pg_relation_size(i.indexrelid) / nullif(idx_scan, 0) DESC NULLS FIRST,
         pg_relation_size(i.indexrelid) DESC;
"
```

## Log Management

### Nginx Logs
```bash
# Monitor access logs in real-time
tail -f /var/log/nginx/access.log

# Monitor error logs
tail -f /var/log/nginx/error.log

# Analyze access patterns
goaccess /var/log/nginx/access.log
```

### System Logs
```bash
# View system logs
journalctl -f

# View authentication logs
tail -f /var/log/auth.log
```

## Backup Procedures

### Database Backup
```bash
#!/bin/bash
# Save as /usr/local/bin/backup-nostr-relay.sh

# Configuration
BACKUP_DIR="/backup/postgresql"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump -U postgres nostr_relay > "$BACKUP_DIR/nostr_relay_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/nostr_relay_$TIMESTAMP.sql"

# Remove old backups
find "$BACKUP_DIR" -name "nostr_relay_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

### Configuration Backup
```bash
#!/bin/bash
# Save as /usr/local/bin/backup-config.sh

BACKUP_DIR="/backup/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup configuration files
tar czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" \
    /etc/nginx/sites-available/* \
    /etc/postgresql/*/main/postgresql.conf \
    /etc/postgresql/*/main/pg_hba.conf \
    /opt/nostr-relay/.env
```

## Update Procedures

### Application Updates
```bash
# Update application
cd /opt/nostr-relay
git pull
npm install
npm run build
pm2 restart nostr-relay

# Verify status
pm2 status nostr-relay
curl -I https://your-domain.com
```

### System Updates
```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Check if reboot is required
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required"
fi
```

## Health Checks

### Basic Health Check Script
```bash
#!/bin/bash
# Save as /usr/local/bin/health-check.sh

check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 is running"
    else
        echo "❌ $1 is not running"
    fi
}

# Check system resources
echo "=== System Resources ==="
df -h / | tail -n 1
free -h | grep Mem
uptime

# Check services
echo -e "\n=== Services ==="
check_service postgresql
check_service nginx

# Check PM2 process
echo -e "\n=== PM2 Process ==="
pm2 jlist | grep -q '"name":"nostr-relay"' && echo "✅ nostr-relay is running" || echo "❌ nostr-relay is not running"

# Check SSL certificate
echo -e "\n=== SSL Certificate ==="
certbot certificates | grep "Expiry Date"

# Check database
echo -e "\n=== Database ==="
sudo -u postgres psql -d nostr_relay -c "SELECT count(*) FROM events;" || echo "❌ Database query failed"
```

## Troubleshooting

### Common Issues

1. **High CPU Usage**
```bash
# Find CPU-intensive processes
top -c

# Check PM2 metrics
pm2 monit
```

2. **Memory Issues**
```bash
# Check memory usage
free -h
vmstat 1

# Check PM2 memory usage
pm2 status
```

3. **Disk Space Issues**
```bash
# Find large files
find / -type f -size +100M -exec ls -lh {} \;

# Clean up logs
journalctl --vacuum-time=7d
```

4. **Database Performance**
```bash
# Check slow queries
sudo -u postgres psql -d nostr_relay -c "
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
"
```

### Emergency Procedures

1. **Quick Process Restart**
```bash
pm2 restart nostr-relay
```

2. **Database Emergency Stop**
```bash
sudo systemctl stop postgresql
```

3. **Emergency Backup**
```bash
pg_dump -U postgres nostr_relay > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
```
