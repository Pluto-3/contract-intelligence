import { useEffect, useRef, useState } from "react";
import { askQuestion, getSession, submitFeedback } from "../api/index";
import type { Message } from "../types/index";

interface Props {
  contractId: string;
}

const confidenceConfig: Record<string, { color: string; label: string }> = {
  high: { color: "#16a34a", label: "High confidence" },
  medium: { color: "#d97706", label: "Review directly" },
  low: { color: "#dc2626", label: "Not found in contract" },
};

export default function ChatView({ contractId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rated, setRated] = useState<Record<string, 0 | 1>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSession(contractId).then(({ messages }) => setMessages(messages));
  }, [contractId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    const tempUser: Message = {
      id: crypto.randomUUID(),
      sessionId: "",
      role: "user",
      content: q,
      confidence: null,
      chunksUsed: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser]);

    try {
      await askQuestion(contractId, q);
      const { messages } = await getSession(contractId);
      setMessages(messages);
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        sessionId: "",
        role: "assistant",
        content: "Something went wrong. Please try again.",
        confidence: null,
        chunksUsed: null,
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: 0 | 1) => {
    await submitFeedback(messageId, rating);
    setRated((prev) => ({ ...prev, [messageId]: rating }));
  };

  const visibleMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", minHeight: 400 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "1rem" }}>
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "3rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💬</div>
            <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: "0.4rem" }}>Ask anything about this contract</div>
            <div style={{ fontSize: "0.85rem" }}>Answers are grounded in the contract text only</div>
          </div>
        )}

        {visibleMessages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "user" ? (
              <div style={{ background: "#111", color: "white", borderRadius: "18px 18px 4px 18px", padding: "0.7rem 1.1rem", maxWidth: "72%", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "4px 18px 18px 18px", padding: "0.9rem 1.1rem", fontSize: "0.9rem", lineHeight: 1.7, color: "#1f2937", whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "0.25rem" }}>
                  {msg.confidence && confidenceConfig[msg.confidence] && (
                    <span style={{ fontSize: "0.75rem", color: confidenceConfig[msg.confidence].color, fontWeight: 600 }}>
                      ● {confidenceConfig[msg.confidence].label}
                    </span>
                  )}
                  {msg.id && rated[msg.id] === undefined && msg.confidence !== null && (
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button onClick={() => handleFeedback(msg.id, 1)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.15rem 0.45rem", cursor: "pointer", fontSize: "0.8rem", color: "#6b7280" }}>👍</button>
                      <button onClick={() => handleFeedback(msg.id, 0)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.15rem 0.45rem", cursor: "pointer", fontSize: "0.8rem", color: "#6b7280" }}>👎</button>
                    </div>
                  )}
                  {rated[msg.id] !== undefined && (
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{rated[msg.id] === 1 ? "✓ Helpful" : "✓ Noted"}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "4px 18px 18px 18px", padding: "0.9rem 1.1rem", color: "#9ca3af", fontSize: "0.85rem" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ paddingTop: "1rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.6rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
          placeholder="Ask a question about this contract..."
          disabled={loading}
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.9rem", outline: "none", background: "white", color: "#111" }}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? "#d1d5db" : "#111", color: "white", border: "none", borderRadius: 10, padding: "0.7rem 1.2rem", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "background 0.15s" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}