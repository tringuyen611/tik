import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { WebcastPushConnection } from 'tiktok-live-connector';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  app.post('/api/game/start', async (req, res) => {
    try {
      const { roomId } = req.body;
      const gameState = await storage.createGameState({
        roomId,
        score: 0,
        active: true
      });
      res.json(gameState);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start game' });
    }
  });

  app.get('/api/game/:roomId', async (req, res) => {
    try {
      const gameState = await storage.getGameState(req.params.roomId);
      if (!gameState) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }
      res.json(gameState);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get game state' });
    }
  });

  wss.on('connection', (ws) => {
    let tiktokConnection: WebcastPushConnection | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'connect') {
          if (tiktokConnection) {
            tiktokConnection.disconnect();
          }

          tiktokConnection = new WebcastPushConnection(data.username);

          try {
            await tiktokConnection.connect();
            ws.send(JSON.stringify({ type: 'connected' }));

            tiktokConnection.on('chat', (data) => {
              ws.send(JSON.stringify({ type: 'chat', data }));
            });

            tiktokConnection.on('gift', (data) => {
              ws.send(JSON.stringify({ type: 'gift', data }));
            });

            tiktokConnection.on('like', (data) => {
              ws.send(JSON.stringify({ type: 'like', data }));
            });

            tiktokConnection.on('join', (data) => {
              ws.send(JSON.stringify({ type: 'join', data }));
            });
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', error: (err as Error).message }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      if (tiktokConnection) {
        tiktokConnection.disconnect();
      }
    });
  });

  return httpServer;
}