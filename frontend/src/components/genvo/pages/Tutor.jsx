// GENVO — AI Tutor (Hoot the owl)
import React, { useState, useRef, useEffect } from "react";
import { aiTutor } from "../../../lib/ai";

const SUGGESTIONS = ["What does rizz mean?", "Explain sonder", "Word of the day", "Test me!"];

export default function Tutor({ T }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hoot hoot! 🦉 I'm Hoot, your vocab tutor. Ask me about a word, its origin, or how it evolved over time." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const newMsgs = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const r = await aiTutor(msg, newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content })));
      setMessages([...newMsgs, { role: "assistant", content: r?.reply || "Hoot couldn't think of an answer right now!" }]);
    } catch (e) {
      setMessages([...newMsgs, { role: "assistant", content: "Hoot's feathers got tangled. Try again? 🦉" }]);
    }
    setLoading(false);
  };

  return (
    <div data-testid="tutor-page" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 90px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div className="genvo-bounce" style={{ fontSize: 36 }}>🦉</div>
        <div>
          <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 22, color: T.text }}>Hoot</div>
          <div style={{ color: T.muted, fontSize: 12 }}>Your vocab tutor</div>
        </div>
      </div>

      <div ref={scrollRef} data-testid="tutor-messages" style={{ flex: 1, overflowY: "auto", padding: 4 }}>
        {messages.map((m, i) => (
          <div key={i} data-testid={`tutor-msg-${i}`} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: 18,
              background: m.role === "user" ? T.purple : T.card,
              color: m.role === "user" ? "#fff" : T.text,
              border: m.role === "user" ? "none" : `1px solid ${T.border}`,
              fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div data-testid="tutor-loading" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: 18, background: T.card, color: T.muted, border: `1px solid ${T.border}` }}>🦉 Hoot is thinking...</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} data-testid={`tutor-suggest-${i}`} onClick={() => send(s)} disabled={loading}
            style={{ padding: "6px 11px", borderRadius: 999, background: T.card, border: `1px solid ${T.border}`, color: T.muted, fontSize: 12, fontWeight: 600 }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          data-testid="tutor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask Hoot anything..."
          disabled={loading}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15 }}
        />
        <button data-testid="tutor-send-btn" onClick={() => send()} disabled={loading || !input.trim()}
          style={{ padding: "11px 16px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>Send</button>
      </div>
    </div>
  );
}
