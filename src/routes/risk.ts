import { Hono } from "hono";
import { computeRiskSummary } from "../services/riskSummary.js";
import { clauseLinks } from "../db/schema.js";
import { db } from "../db/client.js";
import { eq } from "drizzle-orm";

const router = new Hono();

router.get("/:id/risk", async (c) => {
    const contractId = c.req.param("id");

    try {
        const summary = await computeRiskSummary(contractId);

        const links = await db
            .select()
            .from(clauseLinks)
            .where(eq(clauseLinks.contractId, contractId));

        return c.json({
            ...summary,
            links: links.map(l => ({
                clauseAId: l.clauseAId,
                clauseBId: l.clauseBId,
                relationship: l.relationship,
            })),
        });
    } catch (err: any) {
        console.error("[RISK ROUTE]", err);
        return c.json({ error: "Failed to retrieve risk summary", detail: err.message }, 500);
    }
});

export default router;