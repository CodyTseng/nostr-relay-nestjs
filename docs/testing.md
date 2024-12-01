# Testing Guide

This guide covers the testing infrastructure and procedures for the Nostr relay server.

## Test Categories

### NIP Compliance Tests

Our comprehensive test suite verifies compliance with Nostr Implementation Possibilities (NIPs). These tests ensure our relay correctly implements the Nostr protocol specifications.

#### Implemented NIP Tests
- NIP-01: Basic protocol flow
- NIP-02: Contact List
- NIP-04: Encrypted Direct Message
- NIP-11: Relay Information
- NIP-28: Public Chat
- NIP-42: Authentication

For detailed NIP implementations, see our [Technical Specifications](technical-specifications.md#nip-implementations).

### WebSocket Tests

We maintain both client-side and server-side WebSocket tests to ensure robust connection handling:

#### Client Tests
- Connection establishment and maintenance
- Message sending and receiving
- Protocol-specific message formatting
- Error handling and recovery

#### Server Tests
- Client connection management
- Message routing and processing
- Connection cleanup
- Load handling

## Test Structure

### Directory Organization

```
test/
├── client/
│   ├── test-nostr.js     # Tests using nostr-tools
│   └── test-relay.js     # Raw WebSocket client tests
└── server/
    ├── websocket/
    │   └── test-ws-server.js
    └── e2e/
        └── nips/
            └── nips.test.js
```

## Running Tests

### Client-Side Testing

Test the relay from a client perspective:

```bash
# Test using nostr-tools
node test/client/test-nostr.js

# Test raw WebSocket connection
node test/client/test-relay.js
```

### Server-Side Testing

Verify server functionality:

```bash
# Test WebSocket server
node test/server/websocket/test-ws-server.js

# Run NIP compliance tests
npm run test:e2e:nips
```

## Best Practices

1. **Run Full Suite Before Deployment**
   ```bash
   npm run test:all
   ```

2. **Test Specific NIPs**
   ```bash
   npm run test:nips -- --nip=1  # Test NIP-01
   ```

3. **Monitor Test Coverage**
   - Keep coverage above 80%
   - Focus on critical path testing
   - Include edge cases

## Adding New Tests

When adding new functionality:

1. **NIP Implementation Tests**
   - Add to `test/e2e/nips/`
   - Follow existing NIP test patterns
   - Include both success and failure cases

2. **WebSocket Tests**
   - Add client tests if adding client-facing features
   - Add server tests for new server functionality
   - Test both normal operation and error conditions

## Continuous Integration

Our CI pipeline automatically runs all tests on:
- Pull requests
- Merges to main branch
- Release tags

See our [Deployment Guide](deployment.md) for more details on the CI/CD process.
