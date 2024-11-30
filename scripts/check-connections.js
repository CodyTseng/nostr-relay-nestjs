#!/usr/bin/env node

import WebSocket from 'ws';

// Connect to the relay server
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  // Send a special admin command to get connection info
  ws.send(JSON.stringify(['ADMIN', 'GET_CONNECTIONS']));
});

ws.on('message', (data) => {
  try {
    const response = JSON.parse(data.toString());
    if (response[0] === 'CONNECTIONS') {
      console.log('Current WebSocket Connections:');
      console.log('----------------------------');
      console.log(`Total Connections: ${response[1].total}`);
      console.log(`Active Connections: ${response[1].active}`);
      console.log(`Authenticated Connections: ${response[1].authenticated}`);
      
      if (response[1].connections) {
        console.log('\nConnection Details:');
        response[1].connections.forEach(conn => {
          console.log(`- ID: ${conn.id}`);
          console.log(`  Authenticated: ${conn.authenticated}`);
          console.log(`  Connected Since: ${new Date(conn.connectedAt).toLocaleString()}`);
          console.log('  ---');
        });
      }
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  process.exit(1);
});
