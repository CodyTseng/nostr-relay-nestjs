# Technical Specifications

This document provides comprehensive technical specifications for our Nostr relay implementation, covering both core infrastructure and protocol-specific features.

## Table of Contents
- [Connection Architecture](#connection-architecture)
- [NIP Implementations](#nip-implementations)
  - [NIP-29: Group Chat Events](#nip-29-group-chat-events)
  - [Other NIPs...](#other-nips)

## Connection Architecture

### Overview

The connection handling architecture is split across several components:

1. `ConnectionManagerService`: Central service for managing WebSocket connections
2. `NostrRelayService`: Handles Nostr-specific message processing and relay operations
3. `EnhancedWebSocket`: Extended WebSocket interface with Nostr-specific properties

### Key Components

#### ConnectionManagerService

The `ConnectionManagerService` maintains a Map of all active WebSocket connections. Each connection is stored with:
- A unique identifier
- Authentication status
- Connection timestamp
- Associated public key (if authenticated)

```typescript
Map<string, EnhancedWebSocket>
```

#### EnhancedWebSocket Properties

Each WebSocket connection is enhanced with additional properties:
- `id`: Unique identifier for the connection
- `authenticated`: Boolean flag indicating authentication status
- `pubkey`: Public key of the authenticated user (if any)
- `challenge`: Authentication challenge string
- `connectedAt`: Timestamp of connection establishment

### Implementation Details

#### Throttling

The relay implements request throttling using `@nostr-relay/throttler`:
- Default rate limit: 100 requests per minute
- Configurable through `throttlerConfig.EVENT.limit` and `throttlerConfig.EVENT.ttl`
- Applied globally across all connections

#### Connection Lifecycle

1. **Connection Establishment**
   - New WebSocket connection received
   - Assigned unique ID
   - Added to ConnectionManager map
   - Initial properties set (unauthenticated)

2. **Authentication (Optional)**
   - Challenge issued to client
   - Client signs challenge
   - Verification of signature
   - Connection marked as authenticated
   - Public key associated with connection

3. **Connection Termination**
   - Connection removed from ConnectionManager map
   - Resources cleaned up
   - Stats updated

### Best Practices

1. **Connection Management**
   - Always use ConnectionManagerService for connection operations
   - Maintain accurate connection state
   - Clean up resources on connection close

2. **Error Handling**
   - Catch and log WebSocket errors
   - Send appropriate NOTICE messages to clients
   - Maintain connection state consistency

3. **Type Safety**
   - Use EnhancedWebSocket interface consistently
   - Handle type mismatches with external libraries carefully
   - Document any necessary type assertions

## NIP Implementations

### NIP-29: Group Chat Events

#### Overview

NIP-29 extends Nostr's capabilities to support group chats through specific event kinds and tags.

#### Event Kinds

- `41`: Group Creation
- `42`: Group Metadata
- `43`: Group Members/Admins
- `44`: Group Message

#### Implementation Details

##### Group Creation (Kind 41)

```javascript
{
  "kind": 41,
  "content": "",
  "tags": [
    ["g", "group-id"],
    ["name", "Group Name"],
    ["about", "Group Description"],
    ["picture", "https://example.com/group.jpg"]
  ]
}
```

##### Group Metadata (Kind 42)

```javascript
{
  "kind": 42,
  "content": "",
  "tags": [
    ["g", "group-id"],
    ["name", "Updated Group Name"],
    ["about", "Updated Description"]
  ]
}
```

##### Group Members/Admins (Kind 43)

```javascript
{
  "kind": 43,
  "content": "",
  "tags": [
    ["g", "group-id"],
    ["p", "member-pubkey-1", "admin"],
    ["p", "member-pubkey-2", "member"]
  ]
}
```

##### Group Message (Kind 44)

```javascript
{
  "kind": 44,
  "content": "Hello group!",
  "tags": [
    ["g", "group-id"],
    ["e", "reply-to-event-id"],
    ["p", "mentioned-pubkey"]
  ]
}
```

#### Usage Examples

##### Creating a Group

```javascript
const event = {
  kind: 41,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['g', 'test-group-id'],
    ['name', 'Test Group'],
    ['about', 'Test group for NIP-29']
  ],
  content: '',
  pubkey: publicKey,
};

const signedEvent = nostrTools.finalizeEvent(event, privateKey);
ws.send(JSON.stringify(['EVENT', signedEvent]));
```

##### Sending a Group Message

```javascript
const event = {
  kind: 44,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['g', 'test-group-id'],
    ['e', 'reply-to-event-id'],
  ],
  content: 'Hello group!',
  pubkey: publicKey,
};

const signedEvent = nostrTools.finalizeEvent(event, privateKey);
ws.send(JSON.stringify(['EVENT', signedEvent]));
```

### Other NIPs

[Additional NIP implementations will be documented here...]
