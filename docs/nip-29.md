# NIP-29: Group Chat Events

This document describes the implementation of [NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) in our Nostr relay.

## Supported Event Kinds

| Event Kind | Description           |
|------------|-----------------------|
| 39000      | Group Creation       |
| 39001      | Group Metadata       |
| 39002      | Group Message        |
| 39003      | Group Member Approval|
| 39004      | Group Invite         |

## Configuration

The following environment variables can be configured for group chat functionality:

```env
GROUP_MAX_MEMBERS=100
GROUP_MAX_METADATA_LENGTH=10000
GROUP_MAX_MESSAGE_LENGTH=16384
GROUP_MESSAGE_RATE_LIMIT=60
GROUP_MESSAGE_RATE_PERIOD=60
```

## Event Validation

Group events are validated according to the NIP-29 specification:

1. **Group Creation (39000)**
   - Must include group public key
   - Can specify initial members and settings

2. **Group Metadata (39001)**
   - Must be signed by group admin
   - Contains group name, description, and settings

3. **Group Messages (39002)**
   - Must be from approved group members
   - Subject to message length and rate limits

4. **Member Approval (39003)**
   - Must be signed by group admin
   - Contains member public key and approval status

5. **Group Invites (39004)**
   - Must be from existing group member
   - Contains invite details and recipient

## Rate Limiting

Group messages are subject to rate limiting to prevent spam:
- Default: 60 messages per 60 seconds per user
- Configurable via environment variables
