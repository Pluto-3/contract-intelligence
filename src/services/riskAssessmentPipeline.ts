import { db } from "../db/client.js";
import { clauses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { assessAllClauses } from "./risk.js";

export async function runRiskAssessment(contractId: string): Promise<void> {
    console.log(`[RISK PIPELINE] Starting risk assessment for contract ${contractId}`);

    const rows = await db
        .select()
        .from(clauses)
        .where(eq(clauses.contractId, contractId));

    if (rows.length === 0) {
        console.log(`[RISK PIPELINE] No clauses found for contract ${contractId}`);
        return;
    }

    const extracted = rows.map(r => ({
        id: r.id,
        text: r.rawText,
    }));

    await assessAllClauses(contractId, extracted);
    console.log(`[RISK PIPELINE] Completed risk assessment for contract ${contractId}`);
}