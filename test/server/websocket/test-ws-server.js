const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server started on port 8080');

// Handle new connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send welcome message
    ws.send(JSON.stringify(['NOTICE', 'Welcome to test server']));

    // Handle incoming messages
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        
        // Echo the message back
        ws.send(message.toString());
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
