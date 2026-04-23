import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { IConnectedClient } from './interfaces';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private connectedClients: Map<string, IConnectedClient> = new Map();

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server {
    return this.server;
  }

  registerClient(socketId: string, userId?: string): void {
    const client: IConnectedClient = {
      id: socketId,
      userId,
      rooms: new Set(),
      connectedAt: new Date(),
    };
    this.connectedClients.set(socketId, client);
    this.logger.log(`Client registered: ${socketId}, userId: ${userId}`);
  }

  unregisterClient(socketId: string): void {
    this.connectedClients.delete(socketId);
    this.logger.log(`Client unregistered: ${socketId}`);
  }

  addClientToRoom(socketId: string, roomId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.rooms.add(roomId);
      this.logger.log(`Client ${socketId} added to room ${roomId}`);
    }
  }

  removeClientFromRoom(socketId: string, roomId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.rooms.delete(roomId);
      this.logger.log(`Client ${socketId} removed from room ${roomId}`);
    }
  }

  getConnectedClient(socketId: string): IConnectedClient | undefined {
    return this.connectedClients.get(socketId);
  }

  getConnectedClients(): Map<string, IConnectedClient> {
    return this.connectedClients;
  }

  getClientsByRoom(roomId: string): IConnectedClient[] {
    return Array.from(this.connectedClients.values()).filter((client) =>
      client.rooms.has(roomId),
    );
  }

  getClientsByUserId(userId: string): IConnectedClient[] {
    return Array.from(this.connectedClients.values()).filter(
      (client) => client.userId === userId,
    );
  }

  broadcastToRoom(roomId: string, event: string, data: any): void {
    if (this.server) {
      this.server.to(roomId).emit(event, data);
      this.logger.log(`Broadcast to room ${roomId}, event: ${event}`);
    }
  }

  broadcastToUser(userId: string, event: string, data: any): void {
    if (this.server) {
      const clients = this.getClientsByUserId(userId);
      console.log('Broadcasting to user', userId, 'clients:', clients.map(c => c.id));
      clients.forEach((client) => {
        this.server.to(client.id).emit(event, data);
      });
      this.logger.log(`Broadcast to user ${userId}, event: ${event}`);
    }
  }

  broadcastToAll(event: string, data: any): void {
    if (this.server) {
      this.server.emit(event, data);
      this.logger.log(`Broadcast to all clients, event: ${event}`);
    }
  }

  emitToClient(socketId: string, event: string, data: any): void {
    if (this.server) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Emit to client ${socketId}, event: ${event}`);
    }
  }
}
