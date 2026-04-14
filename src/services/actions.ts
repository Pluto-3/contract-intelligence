import { db } from "../db/client.js";
import { clauseActions } from "../db/schema.js";
import { generate } from "./ollama.js";
import type { ClauseRisk, ClauseAction } from "../types/index.js";

interface ClauseWithText {
    id: string;
    text: string;
}

function parseActionResponse(raw: string): { issue: string; recommendation: string; rewrite?: string; confidence: "low" | "medium" | "high" } {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return {
            issue: typeof parsed.issue === "string" ? parsed.issue : "Issue could not be determined.",
            recommendation: typeof parsed.recommendation === "string" ? parsed.recommendation : "Seek legal advice.",
            rewrite: typeof parsed.rewrite === "string" ? parsed.rewrite : undefined,
            confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
        };
    } catch {
        return { issue: "Could not parse LLM response.", recommendation: "Seek legal advice.", confidence: "low" };
    }
}

export async function generateClauseAction(contractId: string, clause: ClauseWithText, risk: ClauseRisk): Promise<ClauseAction> {
    const prompt = `You are a contract review assistant. A clause has been flagged as ${risk.tier} risk.

Clause: ${clause.text}
Risk reason: ${risk.reason}

Respond ONLY in valid JSON with no extra text:
{
  "issue": "what specifically is wrong with this clause",
  "recommendation": "what the signing party should do or request",
  "rewrite": "a safer version of this clause written in plain legal language",
  "confidence": "low" | "medium" | "high"
}

Rules:
- Be specific. Do not give generic advice.
- rewrite must be a complete clause, not a description of one.
- confidence = low if the clause was ambiguous and the rewrite is speculative.`;

    console.log(`[ACTION] Generating action for clause ${clause.id}`);
    const raw = await generate(prompt);
    const result = parseActionResponse(raw);

    await db.insert(clauseActions).values({
        contractId,
        clauseId: clause.id,
        issue: result.issue,
        recommendation: result.recommendation,
        rewrite: result.rewrite ?? null,
        confidence: result.confidence,
    });

    console.log(`[ACTION] Done for clause ${clause.id}`);
    return { clauseId: clause.id, ...result };
}

export async function generateAllActions(contractId: string, clauses: ClauseWithText[], risks: ClauseRisk[]): Promise<ClauseAction[]> {
    const results: ClauseAction[] = [];
    const eligibleTiers = ["medium", "high", "critical"];

    for (const risk of risks) {
        if (!eligibleTiers.includes(risk.tier)) continue;
        const clause = clauses.find(c => c.id === risk.clauseId);
        if (!clause) continue;
        const action = await generateClauseAction(contractId, clause, risk);
        results.push(action);
    }

    return results;
}