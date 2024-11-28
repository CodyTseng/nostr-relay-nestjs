# Installation Guide

This guide covers the complete installation and setup process for the Nostr Relay.

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- Nginx (for production deployment)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/CodyTseng/nostr-relay-nestjs.git
cd nostr-relay-nestjs
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Configure your PostgreSQL database:
```bash
createdb nostr_relay
```

5. Run migrations:
```bash
npm run migration:run
```

6. Start the development server:
```bash
npm run start:dev
```

## Production Deployment

For detailed production deployment instructions, see [deployment.md](deployment.md)
