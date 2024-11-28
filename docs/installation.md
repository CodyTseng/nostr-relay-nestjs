# Installation Guide

This guide covers the complete installation and setup process for the Nostr Relay. For production deployment, see our [Deployment Guide](deployment.md)

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Next Steps](#next-steps)

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- Git

For production requirements, see the [Deployment Guide](deployment.md#system-requirements).

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the development server:
```bash
npm run start:dev
```

## Configuration

### Environment Variables

Key environment variables to configure:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/nostr_relay

# Server Configuration
PORT=8000
HOST=localhost

# Rate Limiting
THROTTLER_TTL=60
THROTTLER_LIMIT=30

# See .env.example for all options
```

For security-related configurations, see our [Security Guide](security.md#rate-limiting-configuration).

## Development Setup

1. Set up the database:
```bash
# Create database
createdb nostr_relay

# Run migrations
npm run migration:run
```

2. Start in development mode:
```bash
# Start with auto-reload
npm run start:dev

# Start with debugging
npm run start:debug
```

## Testing

Run the test suite:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Next Steps

1. **For Development:**
   - Review the codebase structure
   - Check out our feature implementation status in the [README](../README.md#features)
   - Start implementing your custom features

2. **For Production:**
   - Follow our [Deployment Guide](deployment.md) for production setup
   - Review our [Security Guide](security.md) for security best practices
   - Set up [Monitoring](monitoring.md) for your relay

3. **For Maintenance:**
   - Learn about monitoring in our [Monitoring Guide](monitoring.md)
   - Set up backup procedures
   - Configure health checks
