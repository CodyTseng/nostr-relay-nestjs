const WebSocket = require('ws');
const crypto = require('crypto');

console.log('Attempting to connect to relay...');

// Generate WebSocket key
const wsKey = crypto.randomBytes(16).toString('base64');

const ws = new WebSocket('wss://relay.maiqr.app', ['nostr'], {
    rejectUnauthorized: false,
    headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': wsKey,
        'Sec-WebSocket-Version': '13',
        'Origin': 'https://relay.maiqr.app'
    }
});

// Connection opened
ws.on('open', () => {
    console.log('Connected successfully!');
    
    // Send a REQ message to test subscription
    const req = JSON.stringify(["REQ", "test-sub", { "kinds": [1], "limit": 5 }]);
    console.log('Sending:', req);
    ws.send(req);
});

// Listen for messages
ws.on('message', (data) => {
    console.log('Received:', data.toString());
});

// Handle errors
ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (error.message) {
        console.error('Error message:', error.message);
    }
    if (error.code) {
        console.error('Error code:', error.code);
    }
});

// Connection closed
ws.on('close', (code, reason) => {
    console.log('Connection closed:', {
        code: code,
        reason: reason.toString()
    });
});

// Set a timeout to close the connection after 10 seconds
setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
}, 10000);
