/**
 * WebSocket Client Example (JavaScript)
 * 
 * This file demonstrates how to use the WebSocket server from the client side.
 * Usage in your React/Vue/Angular frontend:
 * 
 * 1. Install socket.io-client:
 *    npm install socket.io-client
 * 
 * 2. Import and use in your component:
 *    import io from 'socket.io-client';
 * 
 * 3. Copy the code below into your frontend component
 */

// Initialize socket connection with userId
const socket = io('http://localhost:3000', {
  query: {
    userId: 'user123' // Pass user ID from auth
  }
});

// ============ CONNECTION EVENTS ============

socket.on('connection', (data) => {
  console.log('Connected to WebSocket server:', data.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// ============ ROOM MANAGEMENT ============

// Join a room
function joinRoom(roomId) {
  socket.emit('joinRoom', { roomId }, (response) => {
    console.log('Join room response:', response);
  });
}

// Leave a room
function leaveRoom(roomId) {
  socket.emit('leaveRoom', { roomId }, (response) => {
    console.log('Leave room response:', response);
  });
}

// Listen for user joined notifications
socket.on('userJoined', (data) => {
  console.log(`User ${data.userId} joined. Total in room: ${data.totalInRoom}`);
});

// Listen for user left notifications
socket.on('userLeft', (data) => {
  console.log(`User left. Total in room: ${data.totalInRoom}`);
});

// ============ MESSAGING ============

// Send message to a room
function sendMessageToRoom(roomId, content) {
  socket.emit('sendMessage', {
    content,
    roomId
  }, (response) => {
    console.log('Message sent:', response);
  });
}

// Send broadcast message
function broadcastMessage(content) {
  socket.emit('sendMessage', {
    content
    // No roomId = broadcast to all
  }, (response) => {
    console.log('Message broadcast:', response);
  });
}

// Listen for incoming messages
socket.on('message', (data) => {
  console.log(`Message from ${data.userId}:`, data.content);
  console.log('Timestamp:', data.timestamp);
  // Update your UI here
});

// ============ NOTIFICATIONS ============

// Send notification
function sendNotification(title, message, userId = null) {
  socket.emit('sendNotification', {
    title,
    message,
    type: 'info', // 'info', 'warning', 'error', 'success'
    userId // Optional - leave null for broadcast
  }, (response) => {
    console.log('Notification sent:', response);
  });
}

// Listen for notifications
socket.on('notification', (data) => {
  console.log(`Notification: ${data.title} - ${data.message}`);
  // Show toast/alert in your UI
});

// ============ HEARTBEAT ============

// Send ping to check connection
function sendPing() {
  socket.emit('ping', {}, (response) => {
    console.log('Pong response:', response);
  });
}

// Listen for pong
socket.on('pong', (data) => {
  console.log('Server is alive:', data);
});

// Setup periodic ping (every 30 seconds)
setInterval(() => {
  if (socket.connected) {
    sendPing();
  }
}, 30000);

// ============ CLIENT INFORMATION ============

// Get all connected clients
function getConnectedClients() {
  socket.emit('getConnectedClients', {}, (response) => {
    console.log('Connected clients:', response.clients);
    console.log('Total count:', response.clientCount);
  });
}

// Listen for connected clients update
socket.on('connectedClients', (data) => {
  console.log(`${data.clientCount} clients connected`);
});

// ============ EXAMPLE USAGE ============

// Example: Pilgrim Group Chat
function setupPilgrimChat(pilgrimGroupId) {
  // Join the group room
  joinRoom(`pilgrim-group-${pilgrimGroupId}`);

  // Send a message
  sendMessageToRoom(`pilgrim-group-${pilgrimGroupId}`, 'Hello, pilgrims!');

  // Listen for new messages in the chat
  socket.on('message', (data) => {
    if (data.roomId === `pilgrim-group-${pilgrimGroupId}`) {
      // Update chat UI with new message
      console.log('New chat message:', data);
    }
  });
}

// Example: Booking Status Updates
function watchBookingUpdates(bookingId) {
  joinRoom(`booking-${bookingId}`);

  socket.on('bookingUpdated', (data) => {
    console.log('Booking status updated:', data);
    // Update booking details in UI
  });
}

// Example: Real-time Location Updates
function broadcastLocationUpdate(latitude, longitude) {
  socket.emit('sendMessage', {
    content: JSON.stringify({ lat: latitude, lng: longitude }),
    roomId: 'location-updates'
  });
}

// ============ DISCONNECT ============

function disconnect() {
  socket.disconnect();
}

// Export for use in other modules (if using modules)
// export { socket, joinRoom, leaveRoom, sendMessageToRoom, ... }
