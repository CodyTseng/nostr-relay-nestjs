# Security Guide

## Overview

This guide outlines essential security measures for running a Nostr relay in production. It covers:
- Access control and rate limiting
- Network and infrastructure security
- Data validation and protection
- Monitoring and maintenance

For monitoring implementation and alerts, see [Monitoring Guide](monitoring.md).

## Quick Setup

Essential security configurations to implement immediately:
```env
# Basic Protection
WS_MAX_CONNECTIONS_PER_IP=10
WS_MAX_MESSAGE_SIZE=65536
WS_RATE_LIMIT_COUNT=30
```
> Monitor these limits using [WebSocket Metrics](monitoring.md#3-application-performance)

## Core Security Measures

### 1. Access Control

**WebSocket Limits:**
> Track connection patterns in [Monitoring Guide - Application Performance](monitoring.md#3-application-performance)

```env
# Connection Control
WS_MAX_CONNECTIONS_PER_IP=10
WS_AUTH_TIMEOUT=30000

# Message Control
WS_MAX_MESSAGE_SIZE=65536
WS_MAX_EVENT_SIZE=32768
```

**Rate Limiting:**
> Monitor rate limit effectiveness in [Application Alerts](monitoring.md#2-application-alerts)

```env
# Event Submission
WS_RATE_LIMIT_TTL=60000
WS_RATE_LIMIT_COUNT=30

# Subscription Control
WS_MAX_SUBSCRIPTION_FILTERS=10
WS_MAX_FILTER_LENGTH=1024
```

### 2. Infrastructure Security

**Database Protection:**
> Track database health in [Monitoring Guide - Database Health](monitoring.md#2-database-health)

```env
# Connection Pool
DATABASE_MIN_CONNECTIONS=2
DATABASE_MAX_CONNECTIONS=10
DATABASE_IDLE_TIMEOUT=10000

# Query Safety
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=15000
DATABASE_SSL=true
```

**Network Security:**
> Monitor network patterns in [System Resources](monitoring.md#1-system-resources)

```nginx
# Nginx Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Rate Limiting
limit_req_zone $binary_remote_addr zone=nostr_limit:10m rate=10r/s;
```

**Firewall Rules:**
```bash
# Basic Protection
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 127.0.0.1 to any port 5432
```

### 3. Data Validation

**Event Validation:**
> Track validation failures in [Event Processing](monitoring.md#event-processing)

- Size Limits:
  ```env
  WS_MAX_EVENT_SIZE=32768  # 32KB max event size
  MAX_CONTENT_LENGTH=16384 # 16KB content length
  MAX_TAG_COUNT=2000      # Maximum tags per event
  ```
- Content Checks:
  - JSON format validation
  - Required fields verification
  - Tag format validation
  - Timestamp checks

**Proof of Work:**
```env
MIN_POW_DIFFICULTY=20  # Adjust based on your needs
```

## Monitoring & Maintenance

### 1. Active Monitoring
> See complete monitoring setup in [Monitoring Guide](monitoring.md)

**Logging:**
```env
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_ALERTS=true
```

**Metrics:**
```env
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_INTERVAL=60000
```

### 2. Regular Maintenance

**Backup Strategy:**
> Monitor backup success in [Maintenance Schedule](monitoring.md#maintenance-schedule)

- Database:
  - Encrypted backups
  - Secure transfers
  - Regular testing
- Configuration:
  - Version control
  - Encrypted secrets
  - Regular audits

**Security Updates:**
> Track system health in [System Resources](monitoring.md#1-system-resources)

1. Weekly Tasks:
   - Dependency updates
   - Security patches
   - Log review

2. Monthly Tasks:
   - Access pattern review
   - Rate limit adjustments
   - Resource usage audit

3. Quarterly Tasks:
   - SSL certificate renewal
   - Credential rotation
   - Security policy review

## Best Practices

1. **Defense in Depth:**
   > Monitor all layers in [Core Monitoring Areas](monitoring.md#core-monitoring-areas)
   - Multiple security layers
   - No single point of failure
   - Regular security reviews

2. **Minimal Exposure:**
   > Track exposure in [System Alerts](monitoring.md#1-system-alerts)
   - Close unused ports
   - Restrict database access
   - Minimize attack surface

3. **Incident Response:**
   > Set up alerts using [Automated Monitoring](monitoring.md#automated-monitoring)
   - Monitor for anomalies
   - Have response procedures
   - Regular backup testing
