// Simple JSON-aware WebSocket client for app-level events
const URL = (process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws');

class WSClient {
  constructor() {
    this.url = URL;
    this.ws = null;
    this.listeners = new Set();
    this.shouldConnect = true;
    this.reconnectDelay = 1000;
    this.connect();
  }

  connect() {
    if (!this.shouldConnect) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('WS connect failed:', e.message);
      setTimeout(() => this.connect(), this.reconnectDelay);
      return;
    }

    this.ws.onopen = () => {
      console.log('App WS connected to', this.url);
    };

    this.ws.onmessage = (evt) => {
      const data = evt.data;
      // Try parse JSON, otherwise ignore (this prevents interfering with HMR messages)
      try {
        const parsed = JSON.parse(data);
        this.listeners.forEach(l => l(parsed));
      } catch (e) {
        // Not JSON — ignore
        // console.debug('WS ignored non-JSON message');
      }
    };

    this.ws.onclose = (ev) => {
      console.log('App WS closed', ev.code, ev.reason);
      this.ws = null;
      if (this.shouldConnect) setTimeout(() => this.connect(), this.reconnectDelay);
    };

    this.ws.onerror = (err) => {
      console.error('App WS error', err && err.message);
      // Errors will lead to close and reconnect
    };
  }

  send(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close() {
    this.shouldConnect = false;
    if (this.ws) this.ws.close(1000, 'client closing');
  }
}

const client = new WSClient();
export default client;
