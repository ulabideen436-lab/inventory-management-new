import WebSocket from 'ws';

const URL = process.env.WS_PUBLISH_URL || 'ws://127.0.0.1:3001/ws';

class WSPublisher {
  constructor() {
    this.url = URL;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.queue = [];
    this.connected = false;
    // Temporarily disable auto-connection for debugging
    // this.connect();
    console.log('WSPublisher initialized but not connecting to', this.url);
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.on('open', () => {
        console.log('WS publisher connected to', this.url);
        this.connected = true;
        // flush queued messages
        while (this.queue.length > 0) {
          const obj = this.queue.shift();
          try { this.ws.send(JSON.stringify(obj)); } catch (e) { console.error('WS publisher flush send failed', e.message); }
        }
      });
      this.ws.on('close', () => { console.log('WS publisher closed, reconnecting'); this.connected = false; setTimeout(() => this.connect(), this.reconnectDelay); });
      this.ws.on('error', (err) => { console.error('WS publisher error', err && err.message); });
    } catch (e) {
      console.error('WS publisher connect failed:', e.message);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  send(obj) {
    // WebSocket temporarily disabled for debugging
    console.log('WS publisher (disabled) would send:', obj && obj.event ? obj.event : 'payload');
    return true;
  }
}

const publisher = new WSPublisher();
export default publisher;
