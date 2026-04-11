export type RiskTier = "low" | "medium" | "high" | "critical";

export type RiskCategory =
    | "liability"
    | "termination"
    | "payment"
    | "jurisdiction"
    | "confidentiality";

export type Confidence = "low" | "medium" | "high";

export interface ClauseRisk {
    clauseId: string;
    tier: RiskTier;
    category: RiskCategory;
    reason: string;
    confidence: Confidence;
}

export interface ClauseAction {
    clauseId: string;
    issue: string;
    recommendation: string;
    rewrite?: string;
    confidence: Confidence;
}

export interface ClauseLink {
    clauseAId: string;
    clauseBId: string;
    relationship: string;
}

export interface ScenarioResult {
    scenario: string;
    outcome: string;
    riskLevel: RiskTier;
    explanation: string;
}

export interface ContractRiskSummary {
    overall: RiskTier;
    breakdown: Partial<Record<RiskCategory, RiskTier>>;
    clauses: ClauseRisk[];
    links: ClauseLink[];
}