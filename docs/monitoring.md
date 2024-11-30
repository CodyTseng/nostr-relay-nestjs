# Monitoring Guide

This guide covers monitoring and maintaining your Nostr relay.

## System Monitoring

### Resource Usage

1. **CPU Usage**
```bash
pm2 monit
```

2. **Memory Usage**
```bash
pm2 status
```

3. **Disk Usage**
```bash
df -h
du -sh /path/to/relay
```

### Database Monitoring

1. **Connection Status**
```sql
SELECT * FROM pg_stat_activity;
```

2. **Database Size**
```sql
SELECT pg_size_pretty(pg_database_size('nostr_relay'));
```

3. **Table Sizes**
```sql
SELECT 
    relname as "Table",
    pg_size_pretty(pg_total_relation_size(relid)) As "Size"
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

## Performance Monitoring

### WebSocket Metrics

1. **Active Connections**
```javascript
const activeConnections = await relay.getConnectionCount();
```

2. **Message Rate**
```javascript
const messageRate = await relay.getMessageRate();
```

3. **Subscription Count**
```javascript
const subscriptions = await relay.getSubscriptionCount();
```

### Event Metrics

1. **Event Processing Rate**
```javascript
const eventRate = await relay.getEventRate();
```

2. **Event Size Distribution**
```javascript
const eventSizes = await relay.getEventSizeDistribution();
```

3. **Event Types Distribution**
```javascript
const eventTypes = await relay.getEventTypeDistribution();
```

## Log Analysis

### Application Logs

1. **View Real-time Logs**
```bash
pm2 logs nostr-relay
```

2. **Error Tracking**
```bash
pm2 logs nostr-relay --err --lines 100
```

3. **Log Patterns**
```bash
grep "error" /path/to/logs/nostr-relay.log
```

### Nginx Logs

1. **Access Logs**
```bash
tail -f /var/log/nginx/access.log
```

2. **Error Logs**
```bash
tail -f /var/log/nginx/error.log
```

## Performance Optimization

### Database Optimization

1. **Index Maintenance**
```sql
ANALYZE events;
REINDEX TABLE events;
```

2. **Vacuum**
```sql
VACUUM ANALYZE events;
```

3. **Query Performance**
```sql
EXPLAIN ANALYZE SELECT * FROM events WHERE ...;
```

### Application Optimization

1. **Connection Pool**
```env
DATABASE_MIN_CONNECTIONS=2
DATABASE_MAX_CONNECTIONS=10
```

2. **Cache Settings**
```env
CACHE_TTL=3600
CACHE_MAX_ITEMS=10000
```

## Alerting

### System Alerts

1. **Disk Space**
```bash
#!/bin/bash
THRESHOLD=90
USAGE=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage above ${THRESHOLD}%"
fi
```

2. **Memory Usage**
```bash
#!/bin/bash
FREE_MEM=$(free | grep Mem | awk '{print $4/$2 * 100.0}')
if [ $(echo "$FREE_MEM < 20" | bc) -eq 1 ]; then
    echo "Low memory warning"
fi
```

### Application Alerts

1. **Connection Count**
```javascript
if (activeConnections > maxConnections) {
    alert('Too many connections');
}
```

2. **Error Rate**
```javascript
if (errorRate > threshold) {
    alert('High error rate detected');
}
```

## Maintenance Procedures

### Regular Maintenance

1. **Log Rotation**
```bash
/etc/logrotate.d/nostr-relay
```

2. **Database Cleanup**
```sql
DELETE FROM events WHERE created_at < NOW() - INTERVAL '30 days';
```

3. **Backup Verification**
```bash
pg_dump -U nostr_user nostr_relay > backup.sql
psql -U nostr_user -d nostr_relay_test < backup.sql
```

### Emergency Procedures

1. **Quick Restart**
```bash
pm2 restart nostr-relay
```

2. **Database Recovery**
```bash
pg_restore -U nostr_user -d nostr_relay backup.sql
```

3. **Service Recovery**
```bash
sudo systemctl restart nginx
pm2 reload nostr-relay
```

## Documentation

### Metrics Documentation

1. **System Metrics**
- CPU Usage
- Memory Usage
- Disk Usage
- Network I/O

2. **Application Metrics**
- Active Connections
- Message Rate
- Event Rate
- Error Rate

3. **Database Metrics**
- Query Performance
- Connection Count
- Table Sizes
- Index Usage
