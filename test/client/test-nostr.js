import { Relay } from 'nostr-tools';

async function testRelay() {
    console.log('Testing relay connection...');
    
    try {
        const relay = await Relay.connect('wss://relay.maiqr.app');
        console.log('Connected to relay!');
        
        // Subscribe to a simple filter
        const sub = relay.subscribe([
            {
                kinds: [1],
                limit: 1
            }
        ], {
            onevent(event) {
                console.log('Received event:', event);
            },
            oneose() {
                console.log('End of stored events');
                relay.close();
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

testRelay();
