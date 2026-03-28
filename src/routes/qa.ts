import { Hono } from "hono";
import { askQuestion, getSession } from "../services/qa.js";
import { db } from "../db/client.js";
import { contracts } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { assertOllamaReachable } from "../services/ollama.js";
import { rateLimiter } from "hono-rate-limiter";

const limiter = rateLimiter({
    windowsMs: 60 * 1000,
    limit: 10,
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "local",
});

const sanitize = (str: string): string =>
    str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();

const router = new Hono();

router.post("/:id/ask", limiter, async (c) => {
  await assertOllamaReachable();

  const contractId = c.req.param("id");
  const body = await c.req.json();
  const question = sanitize(body.question ?? "");

  if (!question) {
    return c.json({ error: "question field is required" }, 400);
  }

  if (question.length > 500) {
    return c.json({ error: "question too long, max 500 characters" }, 400);
  }

  const [contract] = await db
    .select({ status: contracts.status })
    .from(contracts)
    .where(eq(contracts.id, contractId));

  if (!contract) {
    return c.json({ error: "Contract not found" }, 404);
  }

  if (contract.status !== "ready") {
    return c.json({ error: "Contract is not ready yet" }, 400);
  }

  const result = await askQuestion(contractId, question);

  return c.json({
    answer: result.answer,
    confidence: result.confidence,
    chunksUsed: result.chunksUsed,
    sessionId: result.sessionId,
  });
});

router.get("/:id/session", async (c) => {
  const contractId = c.req.param("id");

  const [contract] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.id, contractId));

  if (!contract) {
    return c.json({ error: "Contract not found" }, 404);
  }

  const session = await getSession(contractId);
  return c.json(session);
});

export default router;