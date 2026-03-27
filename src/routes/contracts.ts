import { Hono } from "hono";
import { db } from "../db/client.js";
import { contracts, clauses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { eq, sql } from "drizzle-orm"

const router = new Hono();

// GET /api/contracts — list all
router.get("/", async (c) => {
  const all = await db
    .select({
      id: contracts.id,
      filename: contracts.filename,
      fileType: contracts.fileType,
      status: contracts.status,
      uploadedAt: contracts.uploadedAt,
      processedAt: contracts.processedAt,
    })
    .from(contracts)
    .orderBy(contracts.uploadedAt);

  return c.json({ contracts: all });
});

// GET /api/contracts/:id — single contract with clauses
router.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id));

  if (!contract) {
    return c.json({ error: "Contract not found" }, 404);
  }

  const contractClauses = await db
    .select()
    .from(clauses)
    .where(eq(clauses.contractId, id));

  return c.json({ contract, clauses: contractClauses });
});

// GET /api/contracts/:id/status — polling endpoint
router.get("/:id/status", async (c) => {
  const id = c.req.param("id");

  const [contract] = await db
    .select({
      id: contracts.id,
      status: contracts.status,
      processedAt: contracts.processedAt,
    })
    .from(contracts)
    .where(eq(contracts.id, id));

  if (!contract) {
    return c.json({ error: "Contract not found" }, 404);
  }

  return c.json(contract);
});

router.get("/stats/accuracy", async (c) => {
  const result = await db.execute(
    sql`
      SELECT
        COUNT(f.id) AS total_rated,
        SUM(f.rating) AS total_helpful,
        ROUND(AVG(f.rating) * 100, 1) AS accuracy_pct,
        COUNT(CASE WHEN m.confidence = 'high' THEN 1 END) AS high_confidence_count,
        ROUND(AVG(CASE WHEN m.confidence = 'high' THEN f.rating END) * 100, 1) AS high_confidence_accuracy,
        COUNT(CASE WHEN m.confidence = 'medium' THEN 1 END) AS medium_confidence_count,
        ROUND(AVG(CASE WHEN m.confidence = 'medium' THEN f.rating END) * 100, 1) AS medium_confidence_accuracy,
        COUNT(CASE WHEN m.confidence = 'low' THEN 1 END) AS low_confidence_count,
        ROUND(AVG(CASE WHEN m.confidence = 'low' THEN f.rating END) * 100, 1) AS low_confidence_accuracy
      FROM feedback f
      JOIN qa_messages m ON f.message_id = m.id
    `
  );

  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
  const stats = rows[0] ?? null;

  if (!stats) {
    return c.json({ message: "No feedback data yet", total_rated: 0 });
  }

  return c.json(stats);
});

export default router;