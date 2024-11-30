# Troubleshooting Guide

## WebSocket Connection Issues

If you're experiencing WebSocket connection issues with your Nostr relay, here's a comprehensive guide to diagnose and fix common problems:

### Common Symptoms
- WebSocket connection returns 400 Bad Request
- Connection closes immediately after opening
- "Unexpected server response: 200" errors
- EADDRINUSE errors when starting the server

### Diagnosis Steps

1. **Check Server Status**
```bash
# Check if server is running
pm2 status nostr-relay

# Check server logs
pm2 logs nostr-relay --lines 100
```

2. **Verify Port Availability**
```bash
# Check if port is in use
lsof -i :3000

# Kill process using port if needed
kill -9 <PID>
```

3. **Test WebSocket Connection**
```bash
# Using wscat
wscat -c ws://localhost:3000

# Using curl
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost:3000" \
  -H "Origin: http://localhost:3000" \
  ws://localhost:3000
```

### Common Solutions

1. **Port Already in Use**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Start server
npm run start:dev
```

2. **Nginx Configuration**
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
    }
}
```

3. **SSL/TLS Issues**
```nginx
server {
    listen 443 ssl;
    server_name your.domain.com;

    ssl_certificate /etc/letsencrypt/live/your.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Database Issues

### Common Problems

1. **Connection Errors**
```
error: connection to server failed
```

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

2. **Migration Errors**
```
error: relation "events" does not exist
```

**Solutions:**
```bash
# Run migrations
npx ts-node scripts/migrate-to-latest.ts

# Check database schema
psql -U nostr_user -d nostr_relay -c "\dt"
```

3. **Performance Issues**
```sql
-- Check slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Analyze tables
ANALYZE events;

-- Update statistics
VACUUM ANALYZE;
```

## Event Processing Issues

### Common Problems

1. **Event Validation Failures**
- Invalid signatures
- Missing required tags
- Invalid timestamps

**Solutions:**
```javascript
// Check event format
console.log(JSON.stringify(event, null, 2));

// Verify signature
const valid = nostrTools.verifySignature(event);

// Check timestamp
const now = Math.floor(Date.now() / 1000);
if (Math.abs(event.created_at - now) > 60 * 60) {
    console.log('Invalid timestamp');
}
```

2. **Rate Limiting Issues**
- Too many events from one client
- Subscription limits exceeded

**Solutions:**
```env
# Adjust rate limits in .env
WS_RATE_LIMIT_TTL=60000
WS_RATE_LIMIT_COUNT=30
MAX_SUBSCRIPTION_FILTERS=10
```

## Performance Issues

### Diagnosis

1. **High CPU Usage**
```bash
# Check system resources
top -u nostr_user

# Monitor Node.js process
pm2 monit
```

2. **Memory Leaks**
```bash
# Check memory usage
pm2 status

# Generate heap dump
node --heapsnapshot
```

3. **Slow Queries**
```sql
-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active';
```

### Solutions

1. **Database Optimization**
```sql
-- Add indexes
CREATE INDEX ON events (created_at);
CREATE INDEX ON events (kind);

-- Clean up old events
DELETE FROM events WHERE created_at < NOW() - INTERVAL '30 days';
```

2. **Application Optimization**
```javascript
// Implement caching
const cache = new Map();

// Batch processing
const batchSize = 1000;
for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await processBatch(batch);
}
```

## Common Error Messages

### 1. "Failed to connect to relay"
- Check if relay is running
- Verify WebSocket URL
- Check firewall settings

### 2. "Event rejected"
- Verify event format
- Check signature
- Confirm timestamp is valid

### 3. "Database connection failed"
- Check PostgreSQL status
- Verify connection string
- Check database permissions

## Quick Reference

### Server Commands
```bash
# Start server
npm run start:dev

# Check status
pm2 status

# View logs
pm2 logs

# Restart server
pm2 restart nostr-relay
```

### Database Commands
```bash
# Connect to database
psql -U nostr_user -d nostr_relay

# Backup database
pg_dump -U nostr_user nostr_relay > backup.sql

# Restore database
psql -U nostr_user -d nostr_relay < backup.sql
```

### Test Commands
```bash
# Run all tests
node test-nips.js

# Test specific NIP
node test-nips.js --nip=1
