# Monitoring Guide

## Overview

Effective monitoring is crucial for maintaining a reliable Nostr relay. This guide covers:
- System and resource monitoring
- Performance tracking
- Log analysis
- Alerting systems
- Maintenance procedures

For security responses to monitoring alerts, see [Security Guide](security.md).

## Quick Reference

Essential monitoring commands:
```bash
# System Status
pm2 status nostr-relay    # Basic process info
pm2 monit                 # Real-time monitoring
pm2 logs nostr-relay      # Live application logs

# Database Health
psql -U nostr_user -d nostr_relay -c "SELECT pg_size_pretty(pg_database_size('nostr_relay'));"
```

## Core Monitoring Areas

### 1. System Resources

**Why Monitor**: Prevents system overload and ensures optimal performance.
> 🔒 For resource-based attacks and mitigation, see [Security Guide - Infrastructure Security](security.md#2-infrastructure-security)

**Key Metrics**:
1. CPU Usage:
   ```bash
   pm2 monit              # Real-time process monitoring
   top -u nostr_user      # System-wide view
   ```

2. Memory Usage:
   ```bash
   pm2 status            # Process memory
   free -h               # System memory
   ```

3. Disk Usage:
   ```bash
   df -h                 # Overall disk usage
   du -sh /path/to/relay # Application storage
   ```

### 2. Database Health

**Why Monitor**: Database performance directly impacts relay responsiveness.
> 🔒 For database security measures and access control, see [Security Guide - Data Protection](security.md#2-infrastructure-security)

**Key Metrics**:
1. Connection Status:
   ```sql
   -- Active connections and queries
   SELECT * FROM pg_stat_activity 
   WHERE datname = 'nostr_relay';
   ```

2. Storage Analysis:
   ```sql
   -- Database size
   SELECT pg_size_pretty(pg_database_size('nostr_relay'));
   
   -- Table sizes and growth
   SELECT 
       relname as "Table",
       pg_size_pretty(pg_total_relation_size(relid)) As "Size"
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

### 3. Application Performance

**Why Monitor**: Ensures optimal user experience and identifies bottlenecks.
> 🔒 For WebSocket security and rate limiting, see [Security Guide - Access Control](security.md#1-access-control)

**WebSocket Metrics**:
```javascript
// Key performance indicators
const metrics = {
    activeConnections: await relay.getConnectionCount(),
    messageRate: await relay.getMessageRate(),
    subscriptions: await relay.getSubscriptionCount()
};
```

**Event Processing**:
```javascript
// Event statistics
const eventMetrics = {
    processingRate: await relay.getEventRate(),
    sizeDistribution: await relay.getEventSizeDistribution(),
    typeDistribution: await relay.getEventTypeDistribution()
};
```

## Proactive Monitoring

### 1. Log Analysis

**Why Monitor**: Early problem detection and debugging.
> 🔒 For log-based security analysis and incident response, see [Security Guide - Best Practices](security.md#best-practices)

**Application Logs**:
```bash
# Real-time monitoring
pm2 logs nostr-relay

# Error tracking
pm2 logs nostr-relay --err --lines 100

# Pattern analysis
grep "error" /path/to/logs/nostr-relay.log
```

**Nginx Logs**:
```bash
# Access patterns
tail -f /var/log/nginx/access.log

# Error detection
tail -f /var/log/nginx/error.log
```

### 2. Performance Optimization

**Database Tuning**:
> 🔒 For database security configuration, see [Security Guide - Infrastructure Security](security.md#2-infrastructure-security)

```sql
-- Regular maintenance
ANALYZE events;
VACUUM ANALYZE events;

-- Performance analysis
EXPLAIN ANALYZE SELECT * FROM events WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Application Settings**:
```env
# Connection management
DATABASE_MIN_CONNECTIONS=2
DATABASE_MAX_CONNECTIONS=10

# Caching strategy
CACHE_TTL=3600
CACHE_MAX_ITEMS=10000
```

## Automated Monitoring

### 1. System Alerts

**Disk Space Monitor**:
> 🔒 For disk-based attack prevention, see [Security Guide - Infrastructure Security](security.md#2-infrastructure-security)

```bash
#!/bin/bash
THRESHOLD=90
USAGE=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage above ${THRESHOLD}%"
fi
```

**Memory Monitor**:
> 🔒 For memory-based attack prevention, see [Security Guide - Infrastructure Security](security.md#2-infrastructure-security)

```bash
#!/bin/bash
FREE_MEM=$(free | grep Mem | awk '{print $4/$2 * 100.0}')
if [ $(echo "$FREE_MEM < 20" | bc) -eq 1 ]; then
    echo "Low memory warning"
fi
```

### 2. Application Alerts

**Connection Monitoring**:
> 🔒 For connection limits and rate limiting, see [Security Guide - Access Control](security.md#1-access-control)

```javascript
// Alert on connection overload
if (activeConnections > maxConnections) {
    alert('Connection threshold exceeded');
}

// Alert on error spikes
if (errorRate > threshold) {
    alert('Abnormal error rate detected');
}
```

## Maintenance Schedule

### Daily Tasks
- Monitor system resources
- Check error logs
- Review connection patterns
> 🔒 For daily security checks, see [Security Guide - Regular Maintenance](security.md#2-regular-maintenance)

### Weekly Tasks
- Analyze performance metrics
- Review database growth
- Check backup integrity
> 🔒 For weekly security updates, see [Security Guide - Regular Maintenance](security.md#2-regular-maintenance)

### Monthly Tasks
- Database optimization
- Log rotation
- Storage cleanup
> 🔒 For monthly security audits, see [Security Guide - Regular Maintenance](security.md#2-regular-maintenance)

## Best Practices

1. **Proactive Monitoring**
   - Set up alerts before issues occur
   - Monitor trends, not just current values
   - Keep historical metrics for analysis
   > 🔒 See [Security Guide - Best Practices](security.md#best-practices) for security-focused monitoring

2. **Resource Management**
   - Set appropriate thresholds
   - Monitor resource trends
   - Plan for scaling
   > 🔒 See [Security Guide - Infrastructure Security](security.md#2-infrastructure-security) for resource protection

3. **Performance Optimization**
   - Regular database maintenance
   - Query optimization
   - Connection pool tuning
   > 🔒 See [Security Guide - Data Validation](security.md#3-data-validation) for secure optimization
