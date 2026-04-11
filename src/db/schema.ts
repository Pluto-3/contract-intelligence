import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
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

export const riskTierEnum = pgEnum("risk_tier", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const riskCategoryEnum = pgEnum("risk_category", [
  "liability",
  "termination",
  "payment",
  "jurisdiction",
  "confidentiality",
]);

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "low",
  "medium",
  "high",
]);

export const clauseRisks = pgTable("clause_risks", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull(),
  clauseId: text("clause_id").notNull(),
  tier: riskTierEnum("tier").notNull(),
  category: riskCategoryEnum("category").notNull(),
  reason: text("reason").notNull(),
  confidence: confidenceLevelEnum("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clauseActions = pgTable("clause_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull(),
  clauseId: text("clause_id").notNull(),
  issue: text("issue").notNull(),
  recommendation: text("recommendation").notNull(),
  rewrite: text("rewrite"),
  confidence: confidenceLevelEnum("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clauseLinks = pgTable("clause_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull(),
  clauseAId: text("clause_a_id").notNull(),
  clauseBId: text("clause_b_id").notNull(),
  relationship: text("relationship").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scenarioResults = pgTable("scenario_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull(),
  scenario: text("scenario").notNull(),
  outcome: text("outcome").notNull(),
  riskLevel: riskTierEnum("risk_level").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});