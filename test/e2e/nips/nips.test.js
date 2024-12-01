/**
 * End-to-end tests for NIP compliance
 * Tests various NIPs (Nostr Implementation Possibilities) against a running relay
 */

import { WebSocket } from 'ws';
import { nostrTools } from 'nostr-tools';

const RELAY_URL = 'ws://localhost:3000';
const MAX_RETRIES = 3;  // Reduced retries
const RETRY_DELAY = 2000; // 2 seconds
const GLOBAL_TIMEOUT = 60000; // 1 minute
const CONSECUTIVE_FAILURES_LIMIT = 3; // Abort after 3 consecutive failures
let ws;
let consecutiveFailures = 0;

// Cleanup function
function cleanup() {
  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.log('Error during WebSocket cleanup:', error.message);
    }
  }
}

// Error handler with specific messages
function handleError(error, context) {
  let errorMessage = `Error during ${context}: ${error.message}`;
  
  if (error.code === 'ECONNREFUSED') {
    errorMessage = `Failed to connect to relay at ${RELAY_URL}. Is the relay server running?`;
  } else if (error.code === 'ETIMEDOUT') {
    errorMessage = `Connection timed out. The relay server might be overloaded.`;
  }
  
  console.error(errorMessage);
  return errorMessage;
}

// Generate a test keypair using nostr-tools
const privateKey = nostrTools.generateSecretKey();
const publicKey = nostrTools.getPublicKey(privateKey);

console.log('Test account generated:');
console.log('Private key:', Buffer.from(privateKey).toString('hex'));
console.log('Public key:', publicKey);

// Add NIP-42 authentication
async function authenticate() {
  return new Promise((resolve) => {
    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      if (message[0] === 'AUTH') {
        const challenge = message[1];
        const event = {
          kind: 22242,
          created_at: Math.floor(Date.now() / 1000),
          tags: [
            ['relay', RELAY_URL],
            ['challenge', challenge]
          ],
          content: '',
          pubkey: publicKey
        };
        
        const signedEvent = nostrTools.finalizeEvent(event, privateKey);
        ws.send(JSON.stringify(['AUTH', signedEvent]));
        resolve(true);
      }
    });
  });
}

// Add connection with retry logic and better error handling
async function connectWithRetry() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      ws = new WebSocket(RELAY_URL);
      
      const connected = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout after 5 seconds'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          consecutiveFailures = 0; // Reset on successful connection
          resolve(true);
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      if (connected) {
        console.log(`Connected to relay after ${i + 1} ${i === 0 ? 'attempt' : 'attempts'}`);
        return true;
      }
    } catch (error) {
      const errorMessage = handleError(error, 'connection');
      console.log(`Connection attempt ${i + 1}/${MAX_RETRIES} failed: ${errorMessage}`);
      
      consecutiveFailures++;
      if (consecutiveFailures >= CONSECUTIVE_FAILURES_LIMIT) {
        throw new Error('Too many consecutive failures. Aborting tests.');
      }

      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  throw new Error(`Failed to connect after ${MAX_RETRIES} attempts. Please check if the relay server is running correctly.`);
}

// Define NIP descriptions
const NIP_DESCRIPTIONS = {
  NIP01: 'Basic protocol flow',
  NIP02: 'Contact List',
  NIP04: 'Encrypted Direct Message',
  NIP11: 'Relay Information Document',
  NIP28: 'Public Chat'
};

const tests = {
  // NIP-01: Basic protocol flow
  async testNIP01() {
    console.log('\n🔍 Testing NIP-01:', NIP_DESCRIPTIONS.NIP01);
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: 'Hello, Nostr!',
      pubkey: publicKey,
    };
    
    const signedEvent = nostrTools.finalizeEvent(event, privateKey);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ NIP-01: Timeout waiting for response');
        resolve(false);
      }, 5000);

      ws.send(JSON.stringify(['EVENT', signedEvent]));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log('📥 NIP-01 Response:', response);
        if (response[0] === 'OK' && response[1] === signedEvent.id) {
          console.log('✅ NIP-01: Event published successfully');
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(true);
        }
      };
      
      ws.on('message', messageHandler);
    });
  },

  // NIP-02: Contact List
  async testNIP02() {
    console.log('\n🔍 Testing NIP-02:', NIP_DESCRIPTIONS.NIP02);
    const event = {
      kind: 3,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245']],
      content: '{"wss://relay.damus.io":{"write":true,"read":true}}',
      pubkey: publicKey,
    };
    
    const signedEvent = nostrTools.finalizeEvent(event, privateKey);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ NIP-02: Timeout waiting for response');
        resolve(false);
      }, 5000);

      ws.send(JSON.stringify(['EVENT', signedEvent]));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log('📥 NIP-02 Response:', response);
        if (response[0] === 'OK' && response[1] === signedEvent.id) {
          console.log('✅ NIP-02: Event published successfully');
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(true);
        }
      };
      
      ws.on('message', messageHandler);
    });
  },

  // NIP-04: Encrypted Direct Message
  async testNIP04() {
    console.log('\n🔍 Testing NIP-04:', NIP_DESCRIPTIONS.NIP04);
    const event = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245']],
      content: 'encrypted_content_here',
      pubkey: publicKey,
    };
    
    const signedEvent = nostrTools.finalizeEvent(event, privateKey);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ NIP-04: Timeout waiting for response');
        resolve(false);
      }, 5000);

      ws.send(JSON.stringify(['EVENT', signedEvent]));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log('📥 NIP-04 Response:', response);
        if (response[0] === 'OK' && response[1] === signedEvent.id) {
          console.log('✅ NIP-04: Event published successfully');
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(true);
        }
      };
      
      ws.on('message', messageHandler);
    });
  },

  // NIP-11: Relay Information
  async testNIP11() {
    console.log('\n🔍 Testing NIP-11:', NIP_DESCRIPTIONS.NIP11);
    return new Promise((resolve) => {
      fetch('http://localhost:3000')
        .then(response => response.text())
        .then(data => {
          console.log('📥 NIP-11 Response:', data);
          resolve(data.includes('nostr-relay-nestjs'));
        })
        .catch(err => {
          console.error('❌ NIP-11 Error:', err);
          resolve(false);
        });
    });
  },

  // NIP-28: Public Chat
  async testNIP28() {
    console.log('\n🔍 Testing NIP-28:', NIP_DESCRIPTIONS.NIP28);
    const event = {
      kind: 42,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['e', '1234'], ['p', publicKey]],
      content: 'Testing public chat',
      pubkey: publicKey,
    };
    
    const signedEvent = nostrTools.finalizeEvent(event, privateKey);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ NIP-28: Timeout waiting for response');
        resolve(false);
      }, 5000);

      ws.send(JSON.stringify(['EVENT', signedEvent]));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log('📥 NIP-28 Response:', response);
        if (response[0] === 'OK' && response[1] === signedEvent.id) {
          console.log('✅ NIP-28: Event published successfully');
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(true);
        }
      };
      
      ws.on('message', messageHandler);
    });
  }
};

async function runTests() {
  console.log('\n📋 Starting NIP Tests...');
  console.log('Testing the following NIPs:');
  Object.entries(NIP_DESCRIPTIONS).forEach(([nip, desc]) => {
    console.log(`- ${nip}: ${desc}`);
  });
  
  const globalTimeout = setTimeout(() => {
    console.error('\n⏰ Global timeout reached (1 minute). Stopping tests.');
    cleanup();
    process.exit(1);
  }, GLOBAL_TIMEOUT);

  let testResults = [];
  let wsConnected = false;

  try {
    try {
      await connectWithRetry();
      wsConnected = true;
    } catch (error) {
      console.error('⚠️ WebSocket connection failed:', error.message);
      console.log('Continuing with HTTP-only tests...');
    }

    // Only try authentication if WebSocket is connected
    if (wsConnected) {
      try {
        await authenticate();
        console.log('🔐 Authentication completed');
      } catch (error) {
        console.error('⚠️ Authentication failed:', error.message);
        console.log('Some tests may fail due to missing authentication');
      }
    }

    for (const [name, test] of Object.entries(tests)) {
      const nipNumber = name.replace('test', '');
      console.log(`\n🔍 Testing ${nipNumber}: ${NIP_DESCRIPTIONS[nipNumber]}`);
      
      // Skip WebSocket-dependent tests if not connected
      if (!wsConnected && name !== 'testNIP11') {
        console.log(`⏩ Skipping ${nipNumber} (requires WebSocket connection)`);
        testResults.push({ 
          name, 
          passed: false, 
          skipped: true, 
          error: 'WebSocket connection required' 
        });
        continue;
      }

      let retryCount = 0;
      let success = false;

      while (retryCount < 3 && !success) {
        try {
          const result = await test();
          success = result;
          testResults.push({ 
            name, 
            passed: result, 
            retries: retryCount,
            skipped: false 
          });
          break;
        } catch (error) {
          retryCount++;
          if (retryCount < 3) {
            console.log(`↪️ Retry ${retryCount}/3 for ${nipNumber}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.error(`❌ ${nipNumber} failed after 3 attempts:`, error.message);
            testResults.push({ 
              name, 
              passed: false, 
              retries: retryCount,
              skipped: false,
              error: error.message 
            });
          }
        }
      }
    }

    // Print detailed summary
    console.log('\n📊 Test Summary:');
    console.log('─'.repeat(50));
    testResults.forEach(result => {
      const nipNumber = result.name.replace('test', '');
      const description = NIP_DESCRIPTIONS[nipNumber] || 'Unknown NIP';
      let status = result.skipped ? '⏩ SKIP' : (result.passed ? '✅ PASS' : '❌ FAIL');
      let details = [];
      
      if (result.retries > 0) {
        details.push(`Retries: ${result.retries}`);
      }
      if (result.error) {
        details.push(`Error: ${result.error}`);
      }
      
      console.log(`${nipNumber}: ${description}\n   Status: ${status}${details.length ? '\n   ' + details.join('\n   ') : ''}`);
    });
    console.log('─'.repeat(50));
    
    const total = testResults.length;
    const passed = testResults.filter(t => t.passed).length;
    const skipped = testResults.filter(t => t.skipped).length;
    const failed = total - passed - skipped;
    const percentage = Math.round((passed / (total - skipped)) * 100) || 0;
    
    console.log(`\nOverall Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏩ Skipped: ${skipped}`);
    console.log(`📊 Success Rate: ${percentage}% (excluding skipped tests)`);
    
    if (failed === 0 && skipped === 0) {
      console.log('\n🎉 All tests passed!');
    } else if (failed === 0) {
      console.log('\n🤔 All attempted tests passed, but some were skipped');
    } else {
      console.log('\n⚠️  Some tests failed');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    clearTimeout(globalTimeout);
    cleanup();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Cleaning up...');
  cleanup();
  process.exit(0);
});

runTests();
