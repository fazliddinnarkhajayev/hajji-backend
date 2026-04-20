# WebSocket Implementation Guide

This guide covers the WebSocket implementation for the Hajji Backend using NestJS and Socket.IO.

## Overview

The WebSocket implementation provides real-time communication between the server and connected clients. It supports:

- Room-based messaging
- User-specific notifications
- Broadcast messaging
- Client connection tracking
- Ping/pong heartbeat

## Installation

WebSocket dependencies have been installed:

- `@nestjs/websockets` - NestJS WebSocket adapter
- `@nestjs/platform-socket.io` - Socket.IO adapter for NestJS
- `socket.io` - Socket.IO library

## Architecture

### Components

1. **WebSocketGateway** (`websocket.gateway.ts`)
   - Main gateway handling WebSocket connections and events
   - Implements `OnGatewayInit`, `OnGatewayConnection`, `OnGatewayDisconnect`

2. **WebSocketService** (`websocket.service.ts`)
   - Service layer managing client connections and rooms
   - Provides methods for broadcasting and messaging

3. **DTOs**
   - `MessageDto` - Message payload structure
   - `NotificationDto` - Notification payload structure

## Usage

### Client Connection

Connect with optional userId query parameter:

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    userId: 'user123'
  }
});

// Listen for connection
socket.on('connection', (data) => {
  console.log(data.message);
});
```

### Available Events

#### 1. Join Room

```typescript
socket.emit('joinRoom', { roomId: 'room-1' }, (response) => {
  console.log(response);
});

// Listen for user joined event
socket.on('userJoined', (data) => {
  console.log(`User joined. Total in room: ${data.totalInRoom}`);
});
```

#### 2. Leave Room

```typescript
socket.emit('leaveRoom', { roomId: 'room-1' }, (response) => {
  console.log(response);
});

// Listen for user left event
socket.on('userLeft', (data) => {
  console.log(`User left. Total in room: ${data.totalInRoom}`);
});
```

#### 3. Send Message to Room

```typescript
socket.emit('sendMessage', {
  content: 'Hello, everyone!',
  roomId: 'room-1'
}, (response) => {
  console.log(response);
});

// Listen for incoming messages
socket.on('message', (data) => {
  console.log(`${data.userId}: ${data.content}`);
});
```

#### 4. Send Broadcast Message

```typescript
socket.emit('sendMessage', {
  content: 'Hello, world!'
  // No roomId = broadcast to all
}, (response) => {
  console.log(response);
});
```

#### 5. Send Notification

```typescript
socket.emit('sendNotification', {
  title: 'Important',
  message: 'You have a new message',
  type: 'info',
  userId: 'user123' // Optional - send to specific user
}, (response) => {
  console.log(response);
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log(`${data.title}: ${data.message}`);
});
```

#### 6. Ping/Pong Heartbeat

```typescript
socket.emit('ping', {}, (response) => {
  console.log('Server responded:', response);
});

socket.on('pong', (data) => {
  console.log('Pong received:', data);
});
```

#### 7. Get Connected Clients

```typescript
socket.emit('getConnectedClients', {}, (response) => {
  console.log(`Connected clients: ${response.clientCount}`);
  console.log(response.clients);
});

socket.on('connectedClients', (data) => {
  console.log(data.clients);
});
```

## WebSocketService API

The WebSocketService is exported from the WebSocketModule and can be injected into other services:

```typescript
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class YourService {
  constructor(private webSocketService: WebSocketService) {}

  // Broadcast to all clients in a room
  notifyRoom(roomId: string, event: string, data: any) {
    this.webSocketService.broadcastToRoom(roomId, event, data);
  }

  // Broadcast to specific user
  notifyUser(userId: string, event: string, data: any) {
    this.webSocketService.broadcastToUser(userId, event, data);
  }

  // Broadcast to all connected clients
  notifyAll(event: string, data: any) {
    this.webSocketService.broadcastToAll(event, data);
  }

  // Send to specific socket
  notifyClient(socketId: string, event: string, data: any) {
    this.webSocketService.emitToClient(socketId, event, data);
  }

  // Get client info
  getClient(socketId: string) {
    return this.webSocketService.getConnectedClient(socketId);
  }

  // Get all connected clients
  getAllClients() {
    return this.webSocketService.getConnectedClients();
  }

  // Get clients in a room
  getClientsByRoom(roomId: string) {
    return this.webSocketService.getClientsByRoom(roomId);
  }

  // Get clients by user ID
  getClientsByUserId(userId: string) {
    return this.webSocketService.getClientsByUserId(userId);
  }
}
```

## Configuration

### CORS Settings

The WebSocket gateway is configured with:

```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
```

Modify the CORS settings in `websocket.gateway.ts` if needed.

### Port

WebSocket runs on the same port as the HTTP server (default: 3000).

## Real-time Use Cases

### 1. Pilgrims Chat/Messaging

```typescript
// User joins a pilgrim group chat
socket.emit('joinRoom', { roomId: 'pilgrims-group-123' });

// Send message to group
socket.emit('sendMessage', {
  content: 'Is anyone visiting the Kaaba tomorrow?',
  roomId: 'pilgrims-group-123'
});
```

### 2. Admin Notifications

```typescript
// Admin sends notification to pilgrim
webSocketService.broadcastToUser('pilgrim-user-123', 'notification', {
  title: 'Visa Approved',
  message: 'Your visa has been approved',
  type: 'success'
});
```

### 3. Live Updates

```typescript
// Update booking status in real-time
webSocketService.broadcastToRoom('bookings-room-123', 'bookingUpdated', {
  bookingId: '123',
  status: 'confirmed',
  timestamp: new Date()
});
```

### 4. Agency Status Updates

```typescript
// Notify agency staff of new bookings
webSocketService.broadcastToUser('agency-staff-123', 'newBooking', {
  pilgrimName: 'Ahmed Ali',
  bookingId: '456',
  packageType: 'Umrah'
});
```

## Testing

### Using WebSocket Client Libraries

#### JavaScript/TypeScript

```bash
npm install socket.io-client
```

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.emit('ping');
```

#### Python

```bash
pip install python-socketio python-engineio
```

```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('Connected')

@sio.on('pong')
def on_pong(data):
    print('Pong:', data)

sio.connect('http://localhost:3000')
sio.emit('ping')
```

## Error Handling

Invalid payloads will throw `BadRequestException`:

```typescript
// Missing roomId
socket.emit('joinRoom', {}, (error) => {
  console.error(error); // BadRequestException: roomId is required
});
```

## Performance Considerations

1. **Room Management**: Clients are tracked in rooms using Socket.IO's native rooms
2. **Client Tracking**: Connection data is stored in a Map for quick lookups
3. **Memory**: Monitor connected clients in production environments
4. **Broadcasting**: Use targeted broadcasts instead of broadcasting to all clients when possible

## Next Steps

1. Integrate WebSocket events with pilgrim chats/groups
2. Add authentication layer to WebSocket connections
3. Implement message persistence for chat history
4. Add typing indicators
5. Add file/image sharing capabilities
6. Implement message read receipts

## Troubleshooting

### WebSocket Connection Issues

1. Ensure the server is running
2. Check CORS settings match your frontend origin
3. Verify the port is accessible
4. Check browser console for errors

### Missing Events

1. Verify client is listening to the correct event name
2. Check that the server is emitting the event
3. Ensure the socket connection is active

### Performance Issues

1. Monitor the number of connected clients
2. Use room-based broadcasting instead of global broadcasts
3. Consider implementing message queueing for high-volume scenarios
