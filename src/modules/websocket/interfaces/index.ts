export interface IConnectedClient {
  id: string;
  userId?: string;
  rooms: Set<string>;
  connectedAt: Date;
}
