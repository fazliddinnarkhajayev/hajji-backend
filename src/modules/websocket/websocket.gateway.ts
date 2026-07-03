import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { MessageDto, NotificationDto } from './dto';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';

@WSGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.webSocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
    console.log('🚀 WebSocket Server Initialized - Ready to accept connections');
  }

  // Auth happens here, not per-event: a connection without a valid JWT is
  // rejected outright, so every other handler in this gateway (and userId
  // registered in WebSocketService) can trust the connection is who it claims
  // to be — no client-supplied userId is trusted anymore.
  async handleConnection(client: Socket): Promise<void> {
    const token = (client.handshake.auth?.token as string | undefined) ?? (client.handshake.query?.token as string | undefined);

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without a token — disconnecting`);
      client.disconnect(true);
      return;
    }

    let payload: JwtPayload;
    try {
      const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET') || 'change_me_access';
      payload = this.jwtService.verify<JwtPayload>(token, { secret });
    } catch (error) {
      this.logger.warn(`Client ${client.id} sent an invalid/expired token — disconnecting. ${error.message}`);
      client.disconnect(true);
      return;
    }

    const userId = payload.user_id;
    this.webSocketService.registerClient(client.id, userId);
    const totalClients = this.webSocketService.getConnectedClients().size;
    this.logger.log(
      `Client connected: ${client.id}, userId: ${userId}, total clients: ${totalClients}`,
    );
    console.log(`✅ User Connected - ID: ${userId} | Socket: ${client.id} | Total Connected: ${totalClients}`);
    client.emit('connection', { message: 'Connected to WebSocket server' });
  }

  handleDisconnect(client: Socket): void {
    this.webSocketService.unregisterClient(client.id);
    this.logger.log(
      `Client disconnected: ${client.id}, total clients: ${this.webSocketService.getConnectedClients().size}`,
    );
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    client: Socket,
    payload: { roomId: string },
  ): { event: string; message: string } {
    const { roomId } = payload;

    if (!roomId) {
      throw new BadRequestException('roomId is required');
    }

    client.join(roomId);
    this.webSocketService.addClientToRoom(client.id, roomId);

    const roomClients = this.webSocketService.getClientsByRoom(roomId);
    this.server.to(roomId).emit('userJoined', {
      userId: this.webSocketService.getConnectedClient(client.id)?.userId,
      totalInRoom: roomClients.length,
      timestamp: new Date(),
    });

    this.logger.log(
      `Client ${client.id} joined room ${roomId}, total in room: ${roomClients.length}`,
    );

    return { event: 'joinedRoom', message: `Joined room: ${roomId}` };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    client: Socket,
    payload: { roomId: string },
  ): { event: string; message: string } {
    const { roomId } = payload;

    if (!roomId) {
      throw new BadRequestException('roomId is required');
    }

    client.leave(roomId);
    this.webSocketService.removeClientFromRoom(client.id, roomId);

    const roomClients = this.webSocketService.getClientsByRoom(roomId);
    this.server.to(roomId).emit('userLeft', {
      userId: this.webSocketService.getConnectedClient(client.id)?.userId,
      totalInRoom: roomClients.length,
      timestamp: new Date(),
    });

    this.logger.log(`Client ${client.id} left room ${roomId}`);

    return { event: 'leftRoom', message: `Left room: ${roomId}` };
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    client: Socket,
    payload: MessageDto,
  ): { event: string; data: any } {
    const clientData = this.webSocketService.getConnectedClient(client.id);
    const message = {
      ...payload,
      userId: clientData?.userId || payload.userId,
      timestamp: new Date(),
      socketId: client.id,
    };

    if (payload.roomId) {
      this.server.to(payload.roomId).emit('message', message);
      this.logger.log(`Message sent to room ${payload.roomId}`);
    } else {
      this.server.emit('message', message);
      this.logger.log('Message broadcast to all clients');
    }

    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('sendNotification')
  handleSendNotification(
    client: Socket,
    payload: NotificationDto,
  ): { event: string; data: any } {
    const notification = {
      ...payload,
      timestamp: new Date(),
      socketId: client.id,
    };

    if (payload.userId) {
      this.webSocketService.broadcastToUser(
        payload.userId,
        'notification',
        notification,
      );
      this.logger.log(`Notification sent to user ${payload.userId}`);
    } else {
      this.server.emit('notification', notification);
      this.logger.log('Notification broadcast to all clients');
    }

    return { event: 'notificationSent', data: notification };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): { event: string; message: string; timestamp: Date } {
    const response = {
      event: 'pong',
      message: 'pong',
      timestamp: new Date(),
    };
    client.emit('pong', response);
    return response;
  }

  @SubscribeMessage('getConnectedClients')
  handleGetConnectedClients(): {
    event: string;
    clientCount: number;
    clients: any[];
  } {
    const clients = Array.from(
      this.webSocketService.getConnectedClients().values(),
    ).map((client) => ({
      id: client.id,
      userId: client.userId,
      roomCount: client.rooms.size,
      connectedAt: client.connectedAt,
    }));

    return {
      event: 'connectedClients',
      clientCount: clients.length,
      clients,
    };
  }
}
