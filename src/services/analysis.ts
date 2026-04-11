import { chat } from "./ollama.js";
import { db } from "../db/client.js";
import { contracts, clauses } from "../db/schema.js";
import { eq } from "drizzle-orm";

const SYSTEM_PROMPT = `You are a JSON API. You only output valid JSON. You never write explanations, markdown, or any text outside the JSON object. If you cannot complete a field, use an empty string or empty array. Always respond with only a JSON object.`;

const buildPrompt = (contractText: string): string => {
  return `Output a JSON object analyzing this contract. Use exactly this structure, no other text:

{
  "summary": "2-3 sentence plain language summary",
  "key_points": ["point 1", "point 2"],
  "clauses": [
    {
      "type": "payment|termination|liability|obligation|restriction|confidentiality|dispute|other",
      "raw_text": "exact text from contract",
      "explanation": "plain language explanation",
      "risk_level": "low|medium|high"
    }
  ],
  "risks": ["risk 1", "risk 2"]
}

CONTRACT:
${contractText.slice(0, 3000)}`;
};

export const analyzeContract = async (
  contractId: string,
  contractText: string
): Promise<void> => {
  console.log(`[ANALYSIS] Starting analysis for contract ${contractId}`);

  const prompt = buildPrompt(contractText);
  const raw = await chat(prompt, SYSTEM_PROMPT);

  console.log(`[ANALYSIS] Raw response received, parsing...`);
  console.log(`[ANALYSIS] First 300 chars:`, raw.slice(0, 300));

  let parsed: any;

  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON object found in response");
    }

    parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch {
    throw new Error(`Failed to parse analysis JSON: ${raw.slice(0, 200)}`);
  }

  await db
    .update(contracts)
    .set({ summary: parsed.summary ?? null })
    .where(eq(contracts.id, contractId));

  const clauseRows = (parsed.clauses ?? []).map((c: any) => ({
    contractId,
    type: c.type ?? "other",
    rawText: c.raw_text ?? "",
    explanation: c.explanation ?? "",
    riskLevel: c.risk_level ?? "low",
  }));

  if (clauseRows.length > 0) {
    await db.insert(clauses).values(clauseRows);
  }

};