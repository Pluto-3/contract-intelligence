import { db } from "../db/client.js";
import { clauseRisks } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { RiskTier, RiskCategory, ClauseRisk, ContractRiskSummary } from "../types/index.js";

const TIER_RANK: Record<RiskTier, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
};

function highestTier(tiers: RiskTier[]): RiskTier {
    return tiers.reduce((max, t) => TIER_RANK[t] > TIER_RANK[max] ? t : max, "low" as RiskTier);
}

export async function computeRiskSummary(contractId: string): Promise<Omit<ContractRiskSummary, "links">> {
    const rows = await db
        .select()
        .from(clauseRisks)
        .where(eq(clauseRisks.contractId, contractId));

    if (rows.length === 0) {
        return { overall: "low", breakdown: {}, clauses: [] };
    }

    const clauses: ClauseRisk[] = rows.map(r => ({
        clauseId: r.clauseId,
        tier: r.tier as RiskTier,
        category: r.category as RiskCategory,
        reason: r.reason,
        confidence: r.confidence as "low" | "medium" | "high",
    }));

    const overall = highestTier(clauses.map(c => c.tier));

    const categoryMap: Map<RiskCategory, RiskTier[]> = new Map();
    for (const c of clauses) {
        if (!categoryMap.has(c.category)) categoryMap.set(c.category, []);
        categoryMap.get(c.category)!.push(c.tier);
    }

    const breakdown: Partial<Record<RiskCategory, RiskTier>> = {};
    for (const [cat, tiers] of categoryMap) {
        breakdown[cat] = highestTier(tiers);
    }

    return { overall, breakdown, clauses };
}