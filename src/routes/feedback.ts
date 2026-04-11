import { Hono } from "hono";
import { db } from "../db/client.js";
import { feedback, qaMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = new Hono();

router.post("/:messageId", async (c) => {
  const messageId = c.req.param("messageId");
  const body = await c.req.json();
  const { rating, comment } = body;

  if (rating !== 0 && rating !== 1) {
    return c.json({ error: "rating must be 0 (not helpful) or 1 (helpful)" }, 400);
  }

  const [message] = await db
    .select({ id: qaMessages.id, role: qaMessages.role })
    .from(qaMessages)
    .where(eq(qaMessages.id, messageId));

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  if (message.role !== "assistant") {
    return c.json({ error: "Feedback can only be given on assistant messages" }, 400);
  }

  const existing = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.messageId, messageId));

  if (existing[0]) {
    await db
      .update(feedback)
      .set({ rating, comment: comment ?? null })
      .where(eq(feedback.messageId, messageId));

    return c.json({ updated: true, messageId, rating });
  }

  await db.insert(feedback).values({
    messageId,
    rating,
    comment: comment ?? null,
  });

  return c.json({ created: true, messageId, rating });
});

export default router;