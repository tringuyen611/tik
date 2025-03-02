import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameStates = pgTable("game_states", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull().unique(),
  score: integer("score").notNull().default(0),
  active: boolean("active").notNull().default(true)
});

export const insertGameStateSchema = createInsertSchema(gameStates).pick({
  roomId: true,
  score: true,
  active: true
});

export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameStates.$inferSelect;

export const gameObjects = pgTable("game_objects", {
  id: serial("id").primaryKey(),
  gameStateId: integer("game_state_id").notNull(),
  type: text("type").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  z: integer("z").notNull()
});

export const insertGameObjectSchema = createInsertSchema(gameObjects).pick({
  gameStateId: true,
  type: true,
  x: true,
  y: true,
  z: true
});

export type InsertGameObject = z.infer<typeof insertGameObjectSchema>;
export type GameObject = typeof gameObjects.$inferSelect;
