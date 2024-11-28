# Security Guide

This guide covers security best practices for running a Nostr relay in production.

## Basic Security Measures

1. Keep system packages updated
2. Use strong passwords
3. Configure firewall rules
4. Enable rate limiting
5. Monitor system logs

## Rate Limiting Configuration

The relay includes built-in rate limiting. Configure in your `.env`:

```env
THROTTLER_TTL=60
THROTTLER_LIMIT=30
```

## IP Filtering

Configure IP whitelisting/blacklisting in your `.env`:

```env
WHITELIST_IPS=1.2.3.4,5.6.7.8
BLACKLIST_IPS=9.10.11.12
```

## Event Validation

The relay performs several validations on events:
- Signature verification
- Timestamp validation
- Content length limits
- POW difficulty requirements (if enabled)

## Monitoring and Alerts

1. Set up log monitoring
2. Configure alert thresholds
3. Monitor database connections
4. Track WebSocket connections

## SSL/TLS Configuration

Ensure proper SSL/TLS configuration in Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
```
