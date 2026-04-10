import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  setupDefaultListeners() {
    // Lead events
    this.socket.on('lead:created', (data) => {
      this.emit('lead:created', data);
    });

    this.socket.on('lead:updated', (data) => {
      this.emit('lead:updated', data);
    });

    this.socket.on('lead:status_updated', (data) => {
      this.emit('lead:status_updated', data);
    });

    this.socket.on('lead:contacted', (data) => {
      this.emit('lead:contacted', data);
    });

    this.socket.on('lead:reassigned', (data) => {
      this.emit('lead:reassigned', data);
    });

    this.socket.on('lead:auto_reassigned', (data) => {
      this.emit('lead:auto_reassigned', data);
    });

    // Stats events
    this.socket.on('stats:updated', () => {
      this.emit('stats:updated');
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  joinRoom(room) {
    if (this.socket) {
      this.socket.emit('join-room', room);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export default new SocketService();
