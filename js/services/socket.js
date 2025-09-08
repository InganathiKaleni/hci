/**
 * EdUTEND System - Socket Service
 * 
 * @fileoverview Handles real-time communication with the backend using Socket.IO
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = SOCKET_CONFIG.RECONNECTION.MAX_ATTEMPTS;
    this.reconnectDelay = SOCKET_CONFIG.RECONNECTION.DELAY;
    this.eventHandlers = new Map();
    this.connectionHandlers = new Map();
    
    this.init();
  }

  init() {
    // Initialize socket connection when authentication is available
    this.setupConnectionHandlers();
    
    // Auto-connect if token exists
    if (localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)) {
      this.connect();
    }
  }

  /**
   * Set up connection event handlers
   */
  setupConnectionHandlers() {
    // Listen for authentication events
    document.addEventListener('auth:login', () => this.connect());
    document.addEventListener('auth:logout', () => this.disconnect());
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        console.warn('No authentication token available for socket connection');
        return;
      }

      // Create socket connection with authentication
      this.socket = io(SOCKET_CONFIG.URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupSocketEventHandlers();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('Socket.IO connected successfully');
      
      // Emit connection event
      this.emitCustomEvent('socket:connected');

    } catch (error) {
      console.error('Failed to connect to Socket.IO server:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up Socket.IO event handlers
   */
  setupSocketEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Socket connected with ID:', this.socket.id);
      this.emitCustomEvent('socket:connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Socket disconnected:', reason);
      this.emitCustomEvent('socket:disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleConnectionError(error);
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      console.log('Socket authentication successful:', data);
      this.emitCustomEvent('socket:auth:success', data);
    });

    this.socket.on('auth:error', (error) => {
      console.error('Socket authentication failed:', error);
      this.emitCustomEvent('socket:auth:error', error);
      
      // Clear tokens and redirect to login if authentication fails
      if (error.code === 'AUTH_FAILED') {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = 'index.html';
      }
    });

    // QR Code events
    this.socket.on(SOCKET_CONFIG.EVENTS.QR_GENERATED, (data) => {
      console.log('QR Code generated:', data);
      this.emitCustomEvent('qr:generated', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.QR_EXPIRED, (data) => {
      console.log('QR Code expired:', data);
      this.emitCustomEvent('qr:expired', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.QR_SCANNED, (data) => {
      console.log('QR Code scanned:', data);
      this.emitCustomEvent('qr:scanned', data);
    });

    // Attendance events
    this.socket.on(SOCKET_CONFIG.EVENTS.ATTENDANCE_MARKED, (data) => {
      console.log('Attendance marked:', data);
      this.emitCustomEvent('attendance:marked', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.ATTENDANCE_UPDATED, (data) => {
      console.log('Attendance updated:', data);
      this.emitCustomEvent('attendance:updated', data);
    });

    // Course events
    this.socket.on(SOCKET_CONFIG.EVENTS.COURSE_CREATED, (data) => {
      console.log('Course created:', data);
      this.emitCustomEvent('course:created', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.COURSE_UPDATED, (data) => {
      console.log('Course updated:', data);
      this.emitCustomEvent('course:updated', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.COURSE_DELETED, (data) => {
      console.log('Course deleted:', data);
      this.emitCustomEvent('course:deleted', data);
    });

    // User events
    this.socket.on(SOCKET_CONFIG.EVENTS.USER_JOINED, (data) => {
      console.log('User joined:', data);
      this.emitCustomEvent('user:joined', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.USER_LEFT, (data) => {
      console.log('User left:', data);
      this.emitCustomEvent('user:left', data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.USER_UPDATED, (data) => {
      console.log('User updated:', data);
      this.emitCustomEvent('user:updated', data);
    });

    // System events
    this.socket.on(SOCKET_CONFIG.EVENTS.SYSTEM_NOTIFICATION, (data) => {
      console.log('System notification:', data);
      this.emitCustomEvent('system:notification', data);
      this.showNotification(data);
    });

    this.socket.on(SOCKET_CONFIG.EVENTS.ERROR_OCCURRED, (error) => {
      console.error('System error:', error);
      this.emitCustomEvent('system:error', error);
    });
  }

  /**
   * Handle connection errors
   * @param {Error} error - Connection error
   */
  handleConnectionError(error) {
    this.isConnected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emitCustomEvent('socket:max_reconnect_attempts');
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
      this.emitCustomEvent('socket:disconnected');
    }
  }

  /**
   * Emit event to Socket.IO server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Join a room/channel
   * @param {string} room - Room name
   */
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { room });
      console.log('Joined room:', room);
    }
  }

  /**
   * Leave a room/channel
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { room });
      console.log('Left room:', room);
    }
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit custom event to document for other parts of the app
   * @param {string} eventName - Custom event name
   * @param {*} data - Event data
   */
  emitCustomEvent(eventName, data = {}) {
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Show notification to user
   * @param {Object} notification - Notification data
   */
  showNotification(notification) {
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = 'socket-notification';
    notificationEl.innerHTML = `
      <div class="notification-content">
        <span class="notification-title">${notification.title || 'Notification'}</span>
        <span class="notification-message">${notification.message || ''}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // Add styles
    notificationEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Add close functionality
    const closeBtn = notificationEl.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notificationEl.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificationEl.remove(), 300);
      }
    }, 5000);

    // Add to document
    document.body.appendChild(notificationEl);

    // Add CSS animations if not already present
    if (!document.querySelector('#socket-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'socket-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get socket ID
   * @returns {string|null} Socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.disconnect();
    this.eventHandlers.clear();
    this.connectionHandlers.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketService;
} else {
  window.SocketService = SocketService;
}
