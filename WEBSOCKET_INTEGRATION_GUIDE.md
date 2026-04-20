# WebSocket Integration Guide

This guide shows how to integrate WebSocket functionality into other services within your NestJS application.

## Injecting WebSocketService

The `WebSocketService` is exported from the `WebSocketModule` and can be injected into any service:

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class YourService {
  constructor(private webSocketService: WebSocketService) {}

  someMethod() {
    // Use WebSocket service here
  }
}
```

## Common Use Cases

### 1. Notify Users When New Booking is Created

```typescript
// bookings.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class BookingsService {
  constructor(private webSocketService: WebSocketService) {}

  async createBooking(bookingData: any, agencyId: string) {
    // Create booking...
    const booking = await this.saveBooking(bookingData);

    // Notify agency staff about new booking
    this.webSocketService.broadcastToRoom(
      `agency-${agencyId}`,
      'newBooking',
      {
        bookingId: booking.id,
        pilgrimName: booking.pilgrimName,
        packageType: booking.packageType,
        timestamp: new Date()
      }
    );

    return booking;
  }

  async updateBookingStatus(bookingId: string, status: string) {
    // Update status...
    const booking = await this.updateStatus(bookingId, status);

    // Notify about status change
    this.webSocketService.broadcastToRoom(
      `booking-${bookingId}`,
      'statusUpdated',
      {
        bookingId,
        status,
        timestamp: new Date()
      }
    );

    return booking;
  }
}
```

### 2. Real-time Chat Messages

```typescript
// chat.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class ChatService {
  constructor(private webSocketService: WebSocketService) {}

  async sendGroupMessage(groupId: string, message: string, userId: string) {
    // Save message to database...
    const savedMessage = await this.saveMessage(groupId, message, userId);

    // Broadcast to all users in the group
    this.webSocketService.broadcastToRoom(
      `chat-group-${groupId}`,
      'newMessage',
      {
        messageId: savedMessage.id,
        content: savedMessage.content,
        userId: savedMessage.userId,
        timestamp: savedMessage.createdAt
      }
    );

    return savedMessage;
  }

  async sendDirectMessage(fromUserId: string, toUserId: string, message: string) {
    // Save message...
    const savedMessage = await this.saveMessage(fromUserId, toUserId, message);

    // Send to specific user
    this.webSocketService.broadcastToUser(
      toUserId,
      'directMessage',
      {
        messageId: savedMessage.id,
        from: fromUserId,
        content: savedMessage.content,
        timestamp: savedMessage.createdAt
      }
    );

    return savedMessage;
  }
}
```

### 3. Admin Announcements to All Users

```typescript
// announcements.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class AnnouncementsService {
  constructor(private webSocketService: WebSocketService) {}

  async broadcastAnnouncement(title: string, message: string) {
    // Save announcement...
    const announcement = await this.saveAnnouncement(title, message);

    // Broadcast to ALL connected clients
    this.webSocketService.broadcastToAll(
      'announcement',
      {
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        timestamp: announcement.createdAt
      }
    );

    return announcement;
  }
}
```

### 4. Notify Specific User of Account Changes

```typescript
// profile.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class ProfileService {
  constructor(private webSocketService: WebSocketService) {}

  async updateProfile(userId: string, profileData: any) {
    // Update profile...
    const updatedProfile = await this.updateUserProfile(userId, profileData);

    // Notify user of profile update
    this.webSocketService.broadcastToUser(
      userId,
      'profileUpdated',
      {
        profile: updatedProfile,
        timestamp: new Date()
      }
    );

    return updatedProfile;
  }

  async verifyEmail(userId: string, email: string) {
    // Verify email...
    await this.markEmailAsVerified(userId, email);

    // Notify user
    this.webSocketService.broadcastToUser(
      userId,
      'notification',
      {
        title: 'Email Verified',
        message: `Your email ${email} has been verified`,
        type: 'success'
      }
    );
  }
}
```

### 5. Pilgrims Agency History Updates

```typescript
// pilgrim-agency-history.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class PilgrimAgencyHistoryService {
  constructor(private webSocketService: WebSocketService) {}

  async addToHistory(pilgrimId: string, agencyId: string, action: string) {
    // Save to history...
    const history = await this.saveHistory(pilgrimId, agencyId, action);

    // Notify agency about pilgrim activity
    this.webSocketService.broadcastToRoom(
      `agency-${agencyId}`,
      'pilgrimActivity',
      {
        pilgrimId,
        action,
        timestamp: history.createdAt
      }
    );

    return history;
  }
}
```

### 6. Visa Status Updates

```typescript
// visa.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class VisaService {
  constructor(private webSocketService: WebSocketService) {}

  async updateVisaStatus(visaId: string, pilgrimId: string, status: string) {
    // Update visa...
    const visa = await this.updateStatus(visaId, status);

    // Notify pilgrim about visa status
    this.webSocketService.broadcastToUser(
      pilgrimId,
      'visaStatusUpdated',
      {
        visaId,
        status,
        timestamp: new Date()
      }
    );

    return visa;
  }
}
```

### 7. Payment Updates

```typescript
// payments.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class PaymentsService {
  constructor(private webSocketService: WebSocketService) {}

  async processPayment(bookingId: string, userId: string, amount: number) {
    // Process payment...
    const payment = await this.savePayment(bookingId, amount);

    // Notify user
    this.webSocketService.broadcastToUser(
      userId,
      'paymentProcessed',
      {
        paymentId: payment.id,
        amount,
        status: 'success',
        timestamp: new Date()
      }
    );

    // Notify booking room
    this.webSocketService.broadcastToRoom(
      `booking-${bookingId}`,
      'paymentReceived',
      {
        paymentId: payment.id,
        amount,
        timestamp: new Date()
      }
    );

    return payment;
  }
}
```

## Best Practices

### 1. Use Meaningful Room Names

```typescript
// Good
`agency-${agencyId}`
`chat-group-${groupId}`
`booking-${bookingId}`
`user-${userId}`

// Avoid
'room1'
'data'
'updates'
```

### 2. Always Include Timestamps

```typescript
this.webSocketService.broadcastToRoom(
  roomId,
  'event',
  {
    // ... other data
    timestamp: new Date() // Always include this
  }
);
```

### 3. Error Handling

```typescript
async updateBooking(bookingId: string, data: any) {
  try {
    const booking = await this.update(bookingId, data);
    
    // Notify about success
    this.webSocketService.broadcastToRoom(
      `booking-${bookingId}`,
      'updateSuccess',
      { booking }
    );
    
    return booking;
  } catch (error) {
    // Notify about error
    this.webSocketService.broadcastToRoom(
      `booking-${bookingId}`,
      'updateError',
      { error: error.message }
    );
    throw error;
  }
}
```

### 4. Performance Considerations

```typescript
// Instead of broadcasting to all...
// this.webSocketService.broadcastToAll('event', data);

// Target specific users/rooms...
this.webSocketService.broadcastToRoom(
  `agency-${agencyId}`,
  'event',
  data
);

// Or to specific user
this.webSocketService.broadcastToUser(
  userId,
  'event',
  data
);
```

## Testing WebSocket Events

You can test WebSocket events using tools like:

1. **Postman** (with WebSocket support)
2. **Socket.io-client** in a Node.js script
3. **Chrome DevTools** (with socket.io debugging)
4. **Browser console** with socket.io-client library

Example test with Node.js:

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  query: { userId: 'test-user' }
});

socket.on('connection', (data) => {
  console.log('Connected:', data);
  
  // Test joining room
  socket.emit('joinRoom', { roomId: 'test-room' });
  
  // Test sending message
  socket.emit('sendMessage', {
    content: 'Hello from test',
    roomId: 'test-room'
  });
  
  // Listen for responses
  socket.on('message', (data) => {
    console.log('Received message:', data);
  });
});
```

## Troubleshooting

### WebSocket Service Not Injected

Ensure the `WebSocketModule` is imported in your module:

```typescript
@Module({
  imports: [WebSocketModule], // Add this
  providers: [YourService]
})
export class YourModule {}
```

### Events Not Being Received

1. Check that client is listening to the correct event name
2. Verify room names match exactly
3. Ensure socket connection is active

### Memory Issues with Many Connections

1. Implement connection limits
2. Remove old/inactive rooms
3. Monitor connected clients regularly

```typescript
// Clean up inactive clients periodically
setInterval(() => {
  const clients = this.webSocketService.getConnectedClients();
  const now = Date.now();
  
  clients.forEach((client, socketId) => {
    const connectedTime = now - client.connectedAt.getTime();
    if (connectedTime > 24 * 60 * 60 * 1000) { // 24 hours
      // Handle long-lived connections
    }
  });
}, 60000); // Check every minute
```
