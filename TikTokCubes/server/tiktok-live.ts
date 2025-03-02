import { WebcastPushConnection } from 'tiktok-live-connector';
import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

interface TikTokEvent {
  type: 'join' | 'like' | 'follow' | 'share';
  username: string;
  timestamp: number;
}

export class TikTokLiveServer {
  private connections: Map<string, WebSocket> = new Map();
  private tiktokConnection: WebcastPushConnection | null = null;

  setup(server: Server) {
    const wss = new WebSocketServer({ 
      server,
      path: '/tiktok-live'  // Use a specific path to avoid conflicts
    });

    console.log('TikTok Live WebSocket server initialized');

    wss.on('connection', (ws) => {
      const clientId = Math.random().toString(36).substring(7);
      this.connections.set(clientId, ws);
      console.log(`Client ${clientId} connected`);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`Received message from client ${clientId}:`, data);

          if (data.type === 'connect') {
            try {
              await this.connectToTikTok(data.username);
              ws.send(JSON.stringify({ type: 'connected' }));
              console.log(`Connected to TikTok live stream: ${data.username}`);
            } catch (error) {
              console.error('Failed to connect to TikTok:', error);
              ws.send(JSON.stringify({ 
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to connect to TikTok live stream'
              }));
            }
          } else if (data.type === 'disconnect') {
            await this.disconnectFromTikTok();
            ws.send(JSON.stringify({ type: 'disconnected' }));
            console.log(`Disconnected from TikTok live stream`);
          }
        } catch (err) {
          console.error('Error processing message:', err);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: err instanceof Error ? err.message : 'Unknown error' 
          }));
        }
      });

      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        this.connections.delete(clientId);
        if (this.connections.size === 0) {
          this.disconnectFromTikTok();
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
  }

  private async connectToTikTok(username: string) {
    if (this.tiktokConnection) {
      await this.disconnectFromTikTok();
    }

    try {
      this.tiktokConnection = new WebcastPushConnection(username);
      await this.tiktokConnection.connect();
      console.log(`Connected to ${username}'s live stream`);

      // Handle join events
      this.tiktokConnection.on('member', (data) => {
        this.broadcast({
          type: 'join',
          username: data.nickname,
          timestamp: Date.now()
        });
      });

      // Handle like events
      this.tiktokConnection.on('like', (data) => {
        this.broadcast({
          type: 'like',
          username: data.nickname,
          timestamp: Date.now()
        });
      });

      // Handle follow events
      this.tiktokConnection.on('follow', (data) => {
        this.broadcast({
          type: 'follow',
          username: data.nickname,
          timestamp: Date.now()
        });
      });

      // Handle share events
      this.tiktokConnection.on('share', (data) => {
        this.broadcast({
          type: 'share',
          username: data.nickname,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error('Failed to connect to TikTok:', error);
      throw error;
    }
  }

  private async disconnectFromTikTok() {
    if (this.tiktokConnection) {
      try {
        await this.tiktokConnection.disconnect();
        console.log('Disconnected from TikTok live stream');
      } catch (error) {
        console.error('Error disconnecting from TikTok:', error);
      } finally {
        this.tiktokConnection = null;
      }
    }
  }

  private broadcast(event: TikTokEvent) {
    const message = JSON.stringify(event);
    console.log('Broadcasting event:', event);
    this.connections.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        console.log(`Client ${clientId} connection not open, removing`);
        this.connections.delete(clientId);
      }
    });
  }
}

export const tiktokLiveServer = new TikTokLiveServer();