# NIP-29: Group Chat Events

This guide covers the implementation of NIP-29 (Group Chat Events) in our Nostr relay.

## Overview

NIP-29 extends Nostr's capabilities to support group chats through specific event kinds and tags.

### Event Kinds

- `41`: Group Creation
- `42`: Group Metadata
- `43`: Group Members/Admins
- `44`: Group Message

## Implementation Details

### Group Creation (Kind 41)

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

### Group Metadata (Kind 42)

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

### Group Members/Admins (Kind 43)

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

### Group Message (Kind 44)

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

## Usage Examples

### Creating a Group

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

### Sending a Group Message

```javascript
const event = {
  kind: 44,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['g', 'test-group-id']
  ],
  content: 'Hello group members!',
  pubkey: publicKey,
};

const signedEvent = nostrTools.finalizeEvent(event, privateKey);
ws.send(JSON.stringify(['EVENT', signedEvent]));
```

### Subscribing to Group Messages

```javascript
const subscription = ['REQ', 'group-sub', {
  kinds: [44],
  '#g': ['test-group-id']
}];

ws.send(JSON.stringify(subscription));
```

## Validation Rules

1. **Group Creation (Kind 41)**
   - Must have a unique group ID
   - Must have a name tag
   - Creator becomes first admin

2. **Group Metadata (Kind 42)**
   - Must reference existing group
   - Only admins can update

3. **Members/Admins (Kind 43)**
   - Must reference existing group
   - Only admins can modify
   - Must maintain at least one admin

4. **Messages (Kind 44)**
   - Must reference existing group
   - Sender must be member/admin
   - Optional reply and mention tags

## Error Handling

### Common Errors

1. **Group Not Found**
```javascript
{
  "error": "group_not_found",
  "message": "Group with ID {group-id} does not exist"
}
```

2. **Permission Denied**
```javascript
{
  "error": "permission_denied",
  "message": "User is not admin/member of the group"
}
```

3. **Invalid Event**
```javascript
{
  "error": "invalid_event",
  "message": "Missing required tags for group event"
}
```

## Testing

Use our test script to verify NIP-29 implementation:

```bash
node test-nips.js
```

The test script verifies:
1. Group creation
2. Metadata updates
3. Member management
4. Message sending/receiving
