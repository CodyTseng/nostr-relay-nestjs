# Installation Guide

## Overview

This guide focuses on setting up a local development environment for the Nostr relay. For production deployment, see:
- [Deployment Guide](deployment.md) - General deployment instructions
- [DigitalOcean Guide](deployment-digitalocean.md) - DigitalOcean-specific deployment
- [Architecture Decisions](architecture_decisions.md) - Why we chose PM2 over Docker

## Local Development Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v15+)
- npm or yarn
- Git

### Quick Start

1. **Clone and Setup**
```bash
# Clone repository
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

2. **Configure Environment**

Edit `.env` for local development:
```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/nostr_relay

# Development Settings
WS_PORT=3000
MIN_POW_DIFFICULTY=0  # Reduced for development
```

3. **Database Setup**

Choose one method:

```bash
# Option 1: Local PostgreSQL
createdb nostr_relay

# Option 2: Docker (for development only)
docker compose --profile dev up -d
```

> ℹ️ While we use PM2 in production (see [Architecture Decisions](architecture_decisions.md#pm2-vs-docker-for-deployment)), 
> Docker can be convenient for local development.

4. **Run Migrations**
```bash
npx ts-node scripts/migrate-to-latest.ts
```

5. **Start Development Server**
```bash
npm run start:dev
```

## Development Workflow

### 1. Code Changes
- Make changes in `src/` directory
- TypeScript compilation is automatic in dev mode
- Changes trigger automatic restart

### 2. Testing
```bash
# Run all NIP tests
npm run test:nips

# Run specific NIP test
npm run test:nips -- --nip=1
```

Implemented NIPs:
- NIP-01: Basic protocol flow
- NIP-02: Contact List
- NIP-04: Encrypted Direct Message
- NIP-11: Relay Information
- NIP-28: Public Chat
- NIP-29: Group Chat
- NIP-42: Authentication

### 3. Local Verification
1. Check WebSocket connection:
```bash
wscat -c ws://localhost:3000
```

2. Verify relay info:
```bash
curl http://localhost:3000
```

## Preparing for Deployment

When ready to deploy:

1. **Build the Project**
```bash
npm run build
```

2. **Test Production Build**
```bash
npm run start:prod
```

3. **Deploy to Production**
See [Deployment Guide](deployment.md) for:
- Server setup
- PM2 configuration
- Nginx setup
- SSL/TLS configuration

> 📚 Read [Architecture Decisions](architecture_decisions.md) to understand our deployment choices,
> particularly why we chose PM2 over Docker for production.
