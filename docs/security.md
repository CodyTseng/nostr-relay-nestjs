# Security Guide

This guide covers security best practices for running a Nostr relay in production.

## WebSocket Security

### Connection Limits
```env
WS_MAX_CONNECTIONS_PER_IP=10
```
Limits concurrent connections from a single IP address to prevent DoS attacks.

### Message Size Restrictions
```env
WS_MAX_MESSAGE_SIZE=65536
WS_MAX_EVENT_SIZE=32768
```
Prevents memory exhaustion from large messages.

### Authentication Timeouts
```env
WS_AUTH_TIMEOUT=30000
```
Disconnects unauthenticated clients after timeout.

### Subscription Controls
```env
WS_MAX_SUBSCRIPTION_FILTERS=10
WS_MAX_FILTER_LENGTH=1024
```
Prevents abuse through excessive subscriptions.

## Rate Limiting

### Event Rate Limiting
```env
WS_RATE_LIMIT_TTL=60000
WS_RATE_LIMIT_COUNT=30
```
Limits event submissions per time window.

### Request Rate Limiting
```env
MAX_WS_OUTGOING_RATE_LIMIT=3
```
Controls outgoing message rate.

## Database Security

### Connection Management
```env
DATABASE_MIN_CONNECTIONS=2
DATABASE_MAX_CONNECTIONS=10
DATABASE_IDLE_TIMEOUT=10000
```
Prevents connection exhaustion.

### Query Protection
```env
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=15000
```
Prevents resource exhaustion from long queries.

### SSL Enforcement
```env
DATABASE_SSL=true
```
Encrypts database connections.

## Network Security

### Nginx Configuration
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=nostr_limit:10m rate=10r/s;

# WebSocket timeouts
proxy_read_timeout 300;
proxy_connect_timeout 300;
proxy_send_timeout 300;

# Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Firewall Configuration
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from localhost
sudo ufw allow from 127.0.0.1 to any port 5432
```

## Event Validation

### Proof of Work
```env
MIN_POW_DIFFICULTY=20
```
Requires computational work for event submission.

### Event Size Limits
- Maximum event size: 32KB
- Maximum content length: 16KB
- Maximum tag count: 2000

### Content Validation
- Strict JSON format checking
- Required field validation
- Tag format validation
- Timestamp validation

## Monitoring and Alerts

### Log Monitoring
```javascript
// Enable detailed logging
LOG_LEVEL=debug
LOG_FORMAT=json

// Monitor for suspicious patterns
LOG_ALERTS=true
```

### Performance Monitoring
```env
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Health Checks
```env
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_INTERVAL=60000
```

## Backup Security

### Database Backups
- Encrypted backups
- Secure transfer protocols
- Regular backup testing
- Offsite storage

### Configuration Backups
- Version control for configs
- Encrypted sensitive data
- Regular audits

## Regular Maintenance

### Updates
- Regular dependency updates
- Security patch monitoring
- Version compatibility checks

### Audits
- Access log review
- Rate limit effectiveness
- Resource usage patterns
- Connection patterns

### Key Rotation
- Regular SSL certificate renewal
- Database credential rotation
- API key rotation
