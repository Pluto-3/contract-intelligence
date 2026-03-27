import { useState, useRef } from "react";
import { uploadContract, getContractStatus } from "../api/index";

interface Props {
  onUploadComplete: (contractId: string) => void;
}

export default function UploadView({ onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setStatus("uploading");
    setError(null);
    try {
      const { contractId } = await uploadContract(file);
      setStatus("processing");
      const poll = setInterval(async () => {
        const res = await getContractStatus(contractId);
        if (res.status === "ready") {
          clearInterval(poll);
          onUploadComplete(contractId);
        } else if (res.status === "failed") {
          clearInterval(poll);
          setStatus("error");
          setError("Processing failed. Please try again.");
        }
      }, 3000);
    } catch {
      setStatus("error");
      setError("Upload failed. Make sure the server is running.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111", marginBottom: "0.4rem" }}>Upload a Contract</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>PDF or DOCX. Digital documents only — scanned PDFs are not supported.</p>
      </div>

      <div
        onClick={() => status === "idle" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#6366f1" : "#d1d5db"}`,
          borderRadius: 12,
          padding: "4rem 2rem",
          textAlign: "center",
          cursor: status === "idle" ? "pointer" : "default",
          background: dragging ? "#f5f3ff" : "white",
          transition: "all 0.15s",
        }}
      >
        {status === "idle" && (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📄</div>
            <div style={{ fontWeight: 600, color: "#111", marginBottom: "0.3rem" }}>Drop your contract here</div>
            <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>or click to browse files</div>
            <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </>
        )}
        {status === "uploading" && (
          <div style={{ color: "#6366f1", fontWeight: 600 }}>⏳ Uploading and extracting text...</div>
        )}
        {status === "processing" && (
          <div>
            <div style={{ color: "#6366f1", fontWeight: 600, marginBottom: "0.5rem" }}>🔍 Analyzing contract...</div>
            <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>This usually takes 30–60 seconds</div>
          </div>
        )}
        {status === "error" && (
          <div style={{ color: "#dc2626", fontWeight: 600 }}>⚠️ {error}</div>
        )}
      </div>

      {status === "idle" && (
        <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { icon: "📝", title: "Plain Language Summary", desc: "Understand what the contract actually says" },
            { icon: "🔍", title: "Clause Extraction", desc: "Key clauses identified and explained" },
            { icon: "💬", title: "Ask Questions", desc: "Get grounded answers from the contract" },
          ].map((f) => (
            <div key={f.title} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", marginBottom: "0.25rem" }}>{f.title}</div>
              <div style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}