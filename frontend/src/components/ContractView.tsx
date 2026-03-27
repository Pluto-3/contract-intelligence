import { useEffect, useState } from "react";
import { getContract } from "../api/index";
import type { Contract, Clause } from "../types/index";

interface Props {
  contractId: string;
  onStartChat: () => void;
}

const riskConfig: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

export default function ContractView({ contractId, onStartChat }: Props) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContract(contractId).then(({ contract, clauses }) => {
      setContract(contract);
      setClauses(clauses);
      setLoading(false);
    });
  }, [contractId]);

  if (loading) return <div style={{ color: "#6b7280", padding: "2rem 0" }}>Loading contract...</div>;
  if (!contract) return <div style={{ color: "#dc2626" }}>Contract not found.</div>;

  const highRisk = clauses.filter((c) => c.riskLevel === "high");
  const otherClauses = clauses.filter((c) => c.riskLevel !== "high");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#111" }}>{contract.filename}</h2>
            <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Processed {new Date(contract.processedAt!).toLocaleString()}
            </div>
          </div>
          <button onClick={onStartChat} style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "0.6rem 1.2rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap" }}>
            💬 Ask Questions
          </button>
        </div>

        {contract.summary && (
          <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f7f7f8", borderRadius: 8, lineHeight: 1.7, color: "#374151", fontSize: "0.9rem" }}>
            {contract.summary}
          </div>
        )}
      </div>

      {highRisk.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
            ⚠️ High Risk Clauses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {highRisk.map((clause) => <ClauseCard key={clause.id} clause={clause} />)}
          </div>
        </div>
      )}

      {otherClauses.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
            Extracted Clauses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {otherClauses.map((clause) => <ClauseCard key={clause.id} clause={clause} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ClauseCard({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = riskConfig[clause.riskLevel];

  return (
    <div style={{ background: "white", border: `1px solid #e5e7eb`, borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
            {clause.riskLevel}
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111", textTransform: "capitalize" }}>{clause.type}</span>
        </div>
        <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid #f3f4f6" }}>
          <div style={{ background: "#f7f7f8", borderRadius: 6, padding: "0.75rem", marginBottom: "0.75rem", marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem" }}>Original Text</div>
            <div style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, fontStyle: "italic" }}>"{clause.rawText}"</div>
          </div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem" }}>What this means</div>
          <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.7 }}>{clause.explanation}</div>
        </div>
      )}
    </div>
  );
}