# Tests

This directory contains all test files for the Nostr relay server.

## Directory Structure

### Client Tests (`/client`)
Tests that verify the relay from a client perspective:
- `test-nostr.js` - Tests relay connection using nostr-tools
- `test-relay.js` - Tests raw WebSocket client connection

### Server Tests (`/server`)
Tests that verify server functionality:
- `/websocket/test-ws-server.js` - Tests basic WebSocket server functionality
- `/e2e/nips/nips.test.js` - End-to-end tests for NIP compliance

## Running Tests

### Client Tests
```bash
# Test using nostr-tools
node test/client/test-nostr.js

# Test raw WebSocket connection
node test/client/test-relay.js
```

### Server Tests
```bash
# Test WebSocket server
node test/server/websocket/test-ws-server.js

# Run NIP compliance tests
npm run test:e2e:nips
```

## Test Categories

### NIP Compliance Tests
The NIP compliance tests verify that our relay properly implements various Nostr Implementation Possibilities (NIPs). Currently tested NIPs include:

- NIP-01: Basic protocol flow
- NIP-02: Contact List
- NIP-04: Encrypted Direct Message
- NIP-11: Relay Information
- NIP-28: Public Chat
- NIP-42: Authentication

### WebSocket Tests
Basic tests to verify WebSocket functionality from both client and server perspectives:
- Client connection and message handling
- Server setup and client management
- Protocol-specific message formatting
