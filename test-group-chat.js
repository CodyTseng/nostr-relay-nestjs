const WebSocket = require('ws');
const { generatePrivateKey, getPublicKey, signEvent, getEventHash } = require('nostr-tools');

const relay = new WebSocket('wss://relay.maiqr.app');

// Generate a test keypair
const sk = generatePrivateKey();
const pk = getPublicKey(sk);

console.log('Using pubkey:', pk);

relay.on('open', () => {
    console.log('Connected to relay');
    
    // Create a group
    const groupEvent = {
        kind: 39000,
        content: "Test Group",
        tags: [
            ["g", "test-group-1"],
            ["name", "Test Group"],
            ["about", "A test group for our relay"]
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pk
    };

    // Sign the event
    groupEvent.id = getEventHash(groupEvent);
    groupEvent.sig = signEvent(groupEvent, sk);

    // Send the event
    relay.send(JSON.stringify(["EVENT", groupEvent]));
    console.log('Sent group creation event');

    // Subscribe to group events
    relay.send(JSON.stringify([
        "REQ",
        "test-sub",
        {
            kinds: [39000, 39001, 39002, 39003, 39004],
            "#g": ["test-group-1"]
        }
    ]));
});

relay.on('message', (data) => {
    console.log('Received:', data.toString());
});

relay.on('error', (error) => {
    console.error('WebSocket error:', error);
});

// Keep the connection alive for a bit
setTimeout(() => {
    relay.close();
    process.exit(0);
}, 5000);
