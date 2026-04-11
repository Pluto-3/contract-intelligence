import { db } from "../db/client.js";
import { clauseRisks } from "../db/schema.js";
import { generate } from "./ollama.js";
import type { RiskTier, RiskCategory, Confidence, ClauseRisk } from "../types/index.js";

interface ExtractedClause {
    id: string;
    text: string;
}

function parseRiskResponse(raw: string): { tier: RiskTier; category: RiskCategory; reason: string; confidence: Confidence } {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    const validTiers: RiskTier[] = ["low", "medium", "high", "critical"];
    const validCategories: RiskCategory[] = ["liability", "termination", "payment", "jurisdiction", "confidentiality"];
    const validConfidence: Confidence[] = ["low", "medium", "high"];

    try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return {
            tier: validTiers.includes(parsed.tier) ? parsed.tier : "medium",
            category: validCategories.includes(parsed.category) ? parsed.category : "liability",
            reason: typeof parsed.reason === "string" ? parsed.reason : "Unable to determine reason.",
            confidence: validConfidence.includes(parsed.confidence) ? parsed.confidence : "low",
        };
    } catch {
        return { tier: "medium", category: "liability", reason: "Could not parse LLM response.", confidence: "low" };
    }
}

export async function assessClauseRisk(contractId: string, clause: ExtractedClause): Promise<ClauseRisk> {
    const prompt = `You are a contract risk analyst. Analyze this clause and respond ONLY in valid JSON with no extra text.

Clause: ${clause.text}

Respond with exactly this structure:
{
  "tier": "low" | "medium" | "high" | "critical",
  "category": "liability" | "termination" | "payment" | "jurisdiction" | "confidentiality",
  "reason": "one sentence explanation",
  "confidence": "low" | "medium" | "high"
}

Rules:
- tier = critical only if the clause creates unlimited liability or immediate termination with no recourse
- tier = high if the clause heavily favors one party
- tier = medium if the clause is standard but has notable risk
- tier = low if the clause is routine and balanced
- confidence = low if the clause is ambiguous or incomplete`;

    console.log(`[RISK] Assessing clause ${clause.id}`);
    const raw = await generate(prompt);
    const result = parseRiskResponse(raw);

    await db.insert(clauseRisks).values({
        contractId,
        clauseId: clause.id,
        tier: result.tier,
        category: result.category,
        reason: result.reason,
        confidence: result.confidence,
    });

    console.log(`[RISK] ${clause.id} → ${result.tier} (${result.category})`);
    return { clauseId: clause.id, ...result };
}

export async function assessAllClauses(contractId: string, clauses: ExtractedClause[]): Promise<ClauseRisk[]> {
    const results: ClauseRisk[] = [];
    for (const clause of clauses) {
        const risk = await assessClauseRisk(contractId, clause);
        results.push(risk);
    }
    return results;
}