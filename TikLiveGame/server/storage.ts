import { gameStates, gameObjects, type GameState, type InsertGameState, type GameObject, type InsertGameObject } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGameState(state: InsertGameState): Promise<GameState>;
  getGameState(roomId: string): Promise<GameState | undefined>;
  updateGameScore(roomId: string, score: number): Promise<GameState>;
  addGameObject(object: InsertGameObject): Promise<GameObject>;
  getGameObjects(gameStateId: number): Promise<GameObject[]>;
  clearGameObjects(gameStateId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createGameState(state: InsertGameState): Promise<GameState> {
    const [gameState] = await db
      .insert(gameStates)
      .values(state)
      .returning();
    return gameState;
  }

  async getGameState(roomId: string): Promise<GameState | undefined> {
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.roomId, roomId));
    return gameState;
  }

  async updateGameScore(roomId: string, score: number): Promise<GameState> {
    const [gameState] = await db
      .update(gameStates)
      .set({ score })
      .where(eq(gameStates.roomId, roomId))
      .returning();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    return gameState;
  }

  async addGameObject(object: InsertGameObject): Promise<GameObject> {
    const [gameObject] = await db
      .insert(gameObjects)
      .values(object)
      .returning();
    return gameObject;
  }

  async getGameObjects(gameStateId: number): Promise<GameObject[]> {
    return db
      .select()
      .from(gameObjects)
      .where(eq(gameObjects.gameStateId, gameStateId));
  }

  async clearGameObjects(gameStateId: number): Promise<void> {
    await db
      .delete(gameObjects)
      .where(eq(gameObjects.gameStateId, gameStateId));
  }
}

export const storage = new DatabaseStorage();