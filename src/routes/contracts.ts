import { Hono } from "hono";
import { db } from "../db/client.js";
import { contracts, clauses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { eq } from "drizzle-orm";

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

export default router;