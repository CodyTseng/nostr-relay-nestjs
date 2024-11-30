# Connection Handling in Nostr Relay

This document outlines the connection handling architecture and important implementation details of our Nostr relay server.

## Architecture Overview

The connection handling is split across several components:

1. `ConnectionManagerService`: Central service for managing WebSocket connections
2. `NostrRelayService`: Handles Nostr-specific message processing and relay operations
3. `EnhancedWebSocket`: Extended WebSocket interface with Nostr-specific properties

## Key Components

### ConnectionManagerService

The `ConnectionManagerService` maintains a Map of all active WebSocket connections. Each connection is stored with:
- A unique identifier
- Authentication status
- Connection timestamp
- Associated public key (if authenticated)

```typescript
Map<string, EnhancedWebSocket>
```

### EnhancedWebSocket Properties

Each WebSocket connection is enhanced with additional properties:
- `id`: Unique identifier for the connection
- `authenticated`: Boolean flag indicating authentication status
- `pubkey`: Public key of the authenticated user (if any)
- `challenge`: Authentication challenge string
- `connectedAt`: Timestamp of connection establishment

## Important Implementation Details

### Throttling

The relay implements request throttling using `@nostr-relay/throttler`:
- Default rate limit: 100 requests per minute
- Configurable through `throttlerConfig.EVENT.limit` and `throttlerConfig.EVENT.ttl`
- Applied globally across all connections

### Connection Lifecycle

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

### Library Integration Notes

#### @nostr-relay/core

The core relay library provides base functionality but requires careful type handling:
- Message validation
- Event processing
- Subscription management

#### @nostr-relay/throttler

Important considerations when using the throttler:
- Type definitions may not match exactly (requires `as any` cast)
- Configuration must be passed as `{ ttl: number, limit: number }`
- Throttler must be registered with relay instance

## Best Practices

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

## Common Issues and Solutions

1. **Type Mismatches**
   ```typescript
   // Problem: ThrottlerOptions type mismatch
   // Solution: Use type assertion
   this.throttler = new Throttler({ ttl, limit } as any);
   ```

2. **Connection Map Iteration**
   ```typescript
   // Problem: Array.from() type inference
   // Solution: Use entries() and destructuring
   const connectionEntries = Array.from(connections.entries());
   connectionEntries.map(([_, client]) => ({ ... }));
   ```

## Future Improvements

1. Consider implementing connection pooling for better resource management
2. Add more granular throttling options per client
3. Implement connection metrics and monitoring
4. Add support for connection draining during deployments
