import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const viewers = pgTable("viewers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertViewerSchema = createInsertSchema(viewers).pick({
  username: true,
});

export type InsertViewer = z.infer<typeof insertViewerSchema>;
export type Viewer = typeof viewers.$inferSelect;
