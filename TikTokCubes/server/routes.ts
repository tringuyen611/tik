import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tiktokLiveServer } from "./tiktok-live";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server for TikTok Live events
  tiktokLiveServer.setup(httpServer);

  return httpServer;
}