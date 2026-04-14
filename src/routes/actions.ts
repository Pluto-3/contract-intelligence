import { Hono } from "hono";
import {db} from "../db/client.js";
import {clauseActions, clauseRisks} from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const router  = new Hono();

router.get("/:id/actions", async (c) => {
    const contractId = c.req.param("id");

    try {
        const risks = await db
            .select()
            .from(clauseRisks)
            .where(eq(clauseRisks.contractId, contractId));

        const tierRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

        const actions = await db
            .select()
            .from(clauseActions)
            .where(eq(clauseActions.contractId, contractId));

        const sorted = actions.sort((a, b) => {
            const riskA = risks.find(r => r.clauseId === a.clauseId);
            const riskB = risks.find(r => r.clauseId === b.clauseId);
            const rankA = tierRank[riskA?.tier ?? "low"] ?? 1;
            const rankB = tierRank[riskB?.tier ?? "low"] ?? 1;
            return rankB -rankA;
        });

        return c.json(sorted.map(a => ({
            clauseId: a.clauseId,
            issue: a.issue,
            recommendation: a.recommendation,
            rewrite: a.rewrite,
            confidence: a.confidence,
        })));
    } catch (err: any) {
        console.error("[ACTIONS ROUTE]", err);
        return c.json({error: "Failed to retrieve actions", detail: err.messsage }, 500);
    }
});

export default router;