# Installation Guide

This guide will help you set up the Nostr relay server for both development and production environments.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v15+)
- npm or yarn

## Development Setup

1. **Clone the Repository**
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your settings. Key configurations:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/nostr_relay

# WebSocket
WS_PORT=3000

# Security
MIN_POW_DIFFICULTY=0
MAX_WS_PAGE_SIZE=100
MAX_WS_RESPONSE_SIZE=1000
MAX_WS_OUTGOING_RATE_LIMIT=3
```

4. **Start PostgreSQL**
Using Docker:
```bash
docker compose --profile dev up -d
```

Or local PostgreSQL:
```bash
createdb nostr_relay
```

5. **Run Migrations**
```bash
npx ts-node scripts/migrate-to-latest.ts
```

6. **Start Development Server**
```bash
npm run start:dev
```

## Testing

The relay includes a comprehensive test suite for NIP implementations:

```bash
node test-nips.js
```

This will test all implemented NIPs:
- NIP-01: Basic protocol flow
- NIP-02: Contact List
- NIP-04: Encrypted Direct Message
- NIP-05: DNS Mapping
- NIP-11: Relay Information
- NIP-13: Proof of Work
- NIP-17: Report Events
- NIP-22: Event Timestamps
- NIP-26: Delegated Events
- NIP-28: Public Chat
- NIP-29: Group Chat
- NIP-40: Expiration
- NIP-42: Authentication
- NIP-50: Search
