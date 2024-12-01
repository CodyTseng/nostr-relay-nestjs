# Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues in the Nostr relay implementation. It covers four main areas:
- WebSocket connectivity
- Database operations
- Event processing
- System performance

## Quick Diagnosis

Before diving into specific issues, check these common points:
```bash
# Check server status
pm2 status nostr-relay

# View recent logs
pm2 logs nostr-relay --lines 100

# Check database connection
psql -U nostr_user -d nostr_relay -c "\conninfo"
```

## Common Issues and Solutions

### 1. WebSocket Connection Issues

**Symptoms:**
- 400 Bad Request responses
- Immediate connection closure
- "Unexpected server response: 200"
- EADDRINUSE errors

**Quick Solutions:**
```bash
# Check port availability
lsof -i :3000
kill -9 <PID>  # If needed

# Test connection
wscat -c ws://localhost:3000
```

**Nginx Configuration:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### 2. Database Issues

**Common Problems:**
1. Connection Failures
2. Migration Errors
3. Performance Issues

**Quick Solutions:**
```bash
# Database status
sudo systemctl status postgresql

# Run migrations
npx ts-node scripts/migrate-to-latest.ts

# Check tables
psql -U nostr_user -d nostr_relay -c "\dt"
```

**Performance Optimization:**
```sql
-- Check active queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Update statistics
VACUUM ANALYZE events;
```

### 3. Event Processing Issues

**Common Problems:**
1. Invalid Events
   - Bad signatures
   - Missing tags
   - Invalid timestamps
2. Rate Limiting

**Solutions:**

1. Event Validation:
```javascript
// Verify event
const valid = nostrTools.verifySignature(event);
console.log(JSON.stringify(event, null, 2));
```

2. Rate Limiting:
```env
# Adjust in .env
WS_RATE_LIMIT_TTL=60000
WS_RATE_LIMIT_COUNT=30
MAX_SUBSCRIPTION_FILTERS=10
```

### 4. Performance Issues

**Monitoring Tools:**
```bash
# System resources
top -u nostr_user
pm2 monit

# Memory analysis
node --heapsnapshot
```

**Common Checks:**
1. CPU Usage
   - Monitor process load
   - Check for runaway processes
2. Memory Usage
   - Watch for leaks
   - Monitor heap size
3. Database Performance
   - Index usage
   - Query optimization

## Advanced Troubleshooting

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl;
    server_name your.domain.com;
    ssl_certificate /etc/letsencrypt/live/your.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.domain.com/privkey.pem;
}
```

### Database Maintenance
```bash
# Backup database
pg_dump -U nostr_user nostr_relay > backup.sql

# Check indexes
psql -U nostr_user -d nostr_relay -c "\di"
```

## Getting Help

If issues persist:
1. Check the logs thoroughly
2. Review recent changes
3. Test in development environment
4. Open an issue with:
   - Error messages
   - Relevant logs
   - Steps to reproduce
