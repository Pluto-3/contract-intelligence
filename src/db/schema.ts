import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  jsonb,
} from "drizzle-orm/pg-core";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  status: text("status").notNull().default("processing"),
  summary: text("summary"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const clauses = pgTable("clauses", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => contracts.id),
  type: text("type").notNull(),
  rawText: text("raw_text").notNull(),
  explanation: text("explanation").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaSessions = pgTable("qa_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => contracts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaMessages = pgTable("qa_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => qaSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  chunksUsed: jsonb("chunks_used"),
  confidence: text("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => qaMessages.id),
  rating: smallint("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});