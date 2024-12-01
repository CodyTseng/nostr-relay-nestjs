# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCodyTseng%2Fnostr-relay-nestjs?ref=badge_shield)

A high-performance Nostr relay implementation powered by [NestJS](https://nestjs.com/) and PostgreSQL.

## Quick Start

1. **Clone and Install:**
```bash
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git
cd nostr-relay-nestjs
npm install
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Run Migrations:**
```bash
npx ts-node scripts/migrate-to-latest.ts
```

4. **Start the Relay:**
```bash
npm run start:dev
```

Quick Deploy: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

## Documentation

📚 **Core Documentation**
- [Installation Guide](docs/installation.md) - Complete setup instructions
- [Deployment Guide](docs/deployment.md) - Production deployment walkthrough
- [Technical Specifications](docs/technical-specifications.md) - Implementation details and NIPs
- [Architecture Decisions](docs/architecture_decisions.md) - Key architectural choices

🔧 **Operations**
- [Security Guide](docs/security.md) - Security best practices
- [Monitoring Guide](docs/monitoring.md) - System monitoring
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues

👩‍💻 **Development**
- [Development Guide](docs/development.md) - Development workflow
- [Testing Guide](docs/testing.md) - Testing procedures and infrastructure
- [Working with AI](docs/working_with_ai.md) - AI-assisted development

## Deployment

⚠️ **IMPORTANT DEPLOYMENT SAFETY NOTICE**

The deployment process requires specific steps to ensure safe execution:

1. **Prepare for Deployment:**
   ```bash
   # CRITICAL: Copy deploy script to parent directory first
   cp deploy.sh ../deploy-nostr.sh
   
   # Move to parent directory
   cd ..
   
   # Make script executable
   chmod +x deploy-nostr.sh
   ```

2. **Execute Deployment:**
   ```bash
   # Run deployment from outside the project directory
   ./deploy-nostr.sh
   ```

   > ⚠️ **WARNING**: Never run the deploy script from within the project directory!
   > The deployment process removes and replaces the project directory,
   > which could interrupt the script if run from within.

3. **After Deployment:**
   ```bash
   # Optional: Remove the copied deploy script
   rm deploy-nostr.sh
   ```

### Why These Steps Matter

- **Safety**: Running from outside the target directory ensures the script continues executing even when the project directory is modified
- **Reliability**: Prevents script interruption during critical deployment steps
- **Security**: Maintains a clean deployment process with no self-copying scripts

For detailed deployment configuration and options, see our [Deployment Guide](docs/deployment.md).

## Features

### NIPs Support Status

🟢 Full implemented 🟡 Partially implemented 🔴 Not implemented

| NIP | Status | Description |
|-----|:------:|-------------|
| [01](https://github.com/nostr-protocol/nips/blob/master/01.md) | 🟢 | Basic protocol flow |
| [02](https://github.com/nostr-protocol/nips/blob/master/02.md) | 🟢 | Contact List |
| [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | 🟢 | Encrypted Direct Message |
| [05](https://github.com/nostr-protocol/nips/blob/master/05.md) | 🟢 | DNS Identifiers |
| [09](https://github.com/nostr-protocol/nips/blob/master/09.md) | 🔴 | Event Deletion |
| [11](https://github.com/nostr-protocol/nips/blob/master/11.md) | 🟢 | Relay Information |
| [13](https://github.com/nostr-protocol/nips/blob/master/13.md) | 🟢 | Proof of Work |
| [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | 🟢 | Report Events |
| [22](https://github.com/nostr-protocol/nips/blob/master/22.md) | 🟢 | Event Timestamps |
| [26](https://github.com/nostr-protocol/nips/blob/master/26.md) | 🟢 | Delegated Events |
| [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | 🟢 | Public Chat |
| [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | 🟢 | Group Chat |
| [40](https://github.com/nostr-protocol/nips/blob/master/40.md) | 🟢 | Expiration |
| [42](https://github.com/nostr-protocol/nips/blob/master/42.md) | 🟢 | Authentication |
| [45](https://github.com/nostr-protocol/nips/blob/master/45.md) | 🔴 | Counting |
| [50](https://github.com/nostr-protocol/nips/blob/master/50.md) | 🟢 | Search |

For detailed NIP implementations, see our [Technical Specifications](docs/technical-specifications.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
