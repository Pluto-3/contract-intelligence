import { useState } from "react";
import UploadView from "./components/UploadView";
import ContractView from "./components/ContractView";
import ChatView from "./components/ChatView";

type View = "upload" | "contract" | "chat";

export default function App() {
  const [view, setView] = useState<View>("upload");
  const [contractId, setContractId] = useState<string | null>(null);

  const handleUploadComplete = (id: string) => {
    setContractId(id);
    setView("contract");
  };

  const handleBack = () => {
    if (view === "chat") setView("contract");
    else {
      setView("upload");
      setContractId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111" }}>Contract Intelligence</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {view !== "upload" && (
            <button onClick={handleBack} style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.85rem", color: "#374151" }}>
              ← Back
            </button>
          )}
          {view === "contract" && contractId && (
            <button onClick={() => setView("chat")} style={{ background: "#111", color: "white", border: "none", borderRadius: 6, padding: "0.35rem 0.9rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              Ask Questions
            </button>
          )}
        </div>
      </header>

      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.6rem 2rem", fontSize: "0.8rem", color: "#92400e", textAlign: "center" }}>
        ⚠️ This is not legal advice. Always consult a qualified lawyer before acting on any contract information.
      </div>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {view === "upload" && <UploadView onUploadComplete={handleUploadComplete} />}
        {view === "contract" && contractId && <ContractView contractId={contractId} onStartChat={() => setView("chat")} />}
        {view === "chat" && contractId && <ChatView contractId={contractId} />}
      </main>
    </div>
  );
}