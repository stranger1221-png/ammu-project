// GENVO — Dictionary page
import React, { useState, useMemo } from "react";
import { speak, getTenseForms } from "../../../lib/helpers";
import { CATEGORIES } from "../../../data/words";
import { FlashCardModal } from "../Modals";
import { aiLookup } from "../../../lib/ai";
import PronunciationCheck from "../PronunciationCheck";

export default function Dictionary({ allWords, customWords, onLearnt, onBookmark, learned, bookmarks, onAddCustom, onRemoveCustom, T }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [mode, setMode] = useState("formal");
  const [aiOpen, setAiOpen] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    let arr = allWords;
    if (cat !== "All") arr = arr.filter(w => (w.category || w.period || "").toLowerCase().includes(cat.toLowerCase()));
    if (q.trim()) {
      const ql = q.trim().toLowerCase();
      arr = arr.filter(w => w.word.toLowerCase().includes(ql) || (w.meanings?.formal || "").toLowerCase().includes(ql));
    }
    return arr;
  }, [allWords, cat, q]);

  const exactMissing = q.trim() && !allWords.some(w => w.word.toLowerCase() === q.trim().toLowerCase());

  const runAi = async () => {
    setAiLoading(true);
    try {
      const r = await aiLookup(q.trim());
      if (r?.data) {
        const wo = { ...r.data, id: `ai-${Date.now()}`, isAi: true, category: r.data.period || "AI" };
        setAiOpen(wo);
      }
    } catch (e) {
      // noop
    }
    setAiLoading(false);
  };

  const meaningModes = [
    { key: "formal", label: "Formal" },
    { key: "genZ", label: "Gen Z" },
    { key: "millennial", label: "Mill" },
    { key: "medieval", label: "Med" },
    { key: "victorian", label: "Vic" },
    { key: "oldEnglish", label: "OE" },
  ];

  return (
    <div data-testid="dictionary-page" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 24, color: T.text }}>Dictionary</div>
        <div style={{ color: T.muted, fontSize: 12 }}>{allWords.length} words</div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          data-testid="dict-search-input"
          placeholder="🔍 Search any word..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15 }}
        />
      </div>

      {exactMissing && (
        <div style={{ padding: 12, marginBottom: 12, borderRadius: 14, background: T.card, border: `1.5px dashed ${T.purple}55`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, color: T.text, fontSize: 14 }}>No exact match. Try AI?</div>
          <button data-testid="dict-ai-btn" onClick={runAi} disabled={aiLoading}
            style={{ padding: "8px 14px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13 }}>{aiLoading ? "..." : "🤖 Search with AI"}</button>
        </div>
      )}

      {/* Categories */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} data-testid={`dict-cat-${c}`}
            style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: cat === c ? `${T.purple}26` : T.card,
              color: cat === c ? T.purple : T.muted,
              border: `1px solid ${cat === c ? T.purple : T.border}`,
              whiteSpace: "nowrap" }}>{c}</button>
        ))}
      </div>

      {/* Word cards */}
      {filtered.map(w => {
        const exp = expandedId === w.id;
        const tenses = getTenseForms(w);
        const exampleKey = mode === "genZ" ? "genZ" : mode === "medieval" ? "medieval" : "formal";
        const example = w.examples?.[exampleKey] || w.examples?.formal;
        return (
          <div key={w.id} data-testid={`dict-card-${w.id}`}
            style={{ marginBottom: 10, padding: 14, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: exp ? T.shadow : "none" }}>
            <button onClick={() => setExpandedId(exp ? null : w.id)}
              data-testid={`dict-toggle-${w.id}`}
              style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>{w.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontStyle: "italic", fontWeight: 700, color: T.text }}>{w.word}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>/{w.pronunciation}/ · {w.difficulty}</div>
              </div>
              <div style={{ color: T.muted, fontSize: 18 }}>{exp ? "−" : "+"}</div>
            </button>

            {exp && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {meaningModes.map(m => (
                    <button key={m.key} onClick={() => setMode(m.key)} data-testid={`dict-mode-${w.id}-${m.key}`}
                      style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${mode === m.key ? T.purple : T.border}`,
                        background: mode === m.key ? `${T.purple}26` : "transparent",
                        color: mode === m.key ? T.purple : T.muted }}>{m.label}</button>
                  ))}
                </div>
                <div style={{ color: T.text, fontSize: 14, marginBottom: 10 }}>{w.meanings?.[mode] || w.meanings?.formal}</div>
                {example && <div style={{ fontStyle: "italic", color: T.muted, fontSize: 13, marginBottom: 10 }}>"{example}"</div>}
                {w.synonyms?.length > 0 && <div style={{ marginBottom: 6 }}>
                  {w.synonyms.map((s, i) => <span key={i} style={{ display: "inline-block", padding: "4px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${T.green}26`, color: T.green, marginRight: 5, marginBottom: 5, border: `1px solid ${T.green}55` }}>{s}</span>)}
                </div>}
                {w.antonyms?.length > 0 && <div style={{ marginBottom: 8 }}>
                  {w.antonyms.map((a, i) => <span key={i} style={{ display: "inline-block", padding: "4px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${T.red}26`, color: T.red, marginRight: 5, marginBottom: 5, border: `1px solid ${T.red}55` }}>{a}</span>)}
                </div>}

                <div style={{ padding: 10, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Tenses</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12 }}>
                    <div><div style={{ color: T.muted, fontSize: 10 }}>Past</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.past}</div></div>
                    <div><div style={{ color: T.muted, fontSize: 10 }}>Present</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.present}</div></div>
                    <div><div style={{ color: T.muted, fontSize: 10 }}>Future</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.future}</div></div>
                  </div>
                </div>

                {w.origin && <div style={{ color: T.muted, fontSize: 12, marginBottom: 4 }}><strong style={{ color: T.purple }}>Origin: </strong>{w.origin}</div>}
                {w.evolution?.length > 0 && <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>{w.evolution.join(" → ")}</div>}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  <button data-testid={`dict-hear-${w.id}`} onClick={() => speak(w.word)} style={{ width: 38, height: 38, borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 14 }}>🔊</button>
                  <button data-testid={`dict-slow-${w.id}`} onClick={() => speak(w.word, true)} style={{ width: 38, height: 38, borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 14 }}>🐢</button>
                  <button data-testid={`dict-bookmark-${w.id}`} onClick={() => onBookmark(w)} style={{ width: 38, height: 38, borderRadius: 999, background: bookmarks.includes(w.id) ? `${T.gold}26` : T.surface, border: `1px solid ${bookmarks.includes(w.id) ? T.gold : T.border}`, color: bookmarks.includes(w.id) ? T.gold : T.text, fontSize: 14 }}>📌</button>
                  <button data-testid={`dict-learnt-${w.id}`} onClick={() => onLearnt(w)} style={{ width: 38, height: 38, borderRadius: 999, background: learned.includes(w.id) ? `${T.green}26` : T.surface, border: `1px solid ${learned.includes(w.id) ? T.green : T.border}`, color: learned.includes(w.id) ? T.green : T.text, fontSize: 14 }}>{learned.includes(w.id) ? "✅" : "✓"}</button>
                </div>
                {/* Compact pronunciation check in expanded card */}
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🎤 PRONUNCIATION CHECK</div>
                  <PronunciationCheck word={w} T={T} compact={true} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: T.muted }}>No matches.</div>
      )}

      {/* AI words section */}
      {customWords.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>🤖 AI Words</div>
          {customWords.map(w => (
            <div key={w.id} data-testid={`custom-card-${w.id}`}
              style={{ marginBottom: 10, padding: 12, borderRadius: 16, background: T.card, border: `1.5px solid ${T.purple}55`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>{w.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 19, fontStyle: "italic", fontWeight: 700, color: T.text }}>{w.word}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{(w.meanings?.formal || w.meaning || "").slice(0, 80)}...</div>
              </div>
              <button data-testid={`custom-remove-${w.id}`} onClick={() => onRemoveCustom(w)}
                style={{ width: 34, height: 34, borderRadius: 999, background: `${T.red}1f`, border: `1px solid ${T.red}55`, color: T.red, fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {aiOpen && (
        <FlashCardModal
          word={aiOpen}
          T={T}
          isAi
          onClose={() => setAiOpen(null)}
          onLearnt={onLearnt}
          onBookmark={onBookmark}
          onAddCustom={(w) => { onAddCustom(w); setAiOpen(null); }}
        />
      )}
    </div>
  );
}
