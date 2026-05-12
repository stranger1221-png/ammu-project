// GENVO — Shared modals: WordExplanationBlock + FlashCardModal
import React, { useState } from "react";
import { speak, getTenseForms } from "../../lib/helpers";
import PronunciationCheck from "./PronunciationCheck";

const Pill = ({ children, color, T }) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      background: `${color}26`,
      color,
      border: `1px solid ${color}55`,
      marginRight: 6,
      marginBottom: 6,
    }}
  >
    {children}
  </span>
);

const IconBtn = ({ children, onClick, color, T, label, testid }) => (
  <button
    onClick={onClick}
    aria-label={label}
    data-testid={testid}
    style={{
      width: 46,
      height: 46,
      borderRadius: 999,
      background: T.surface,
      border: `1.5px solid ${T.border}`,
      color: color || T.text,
      fontSize: 18,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.18s ease, background 0.18s ease",
    }}
    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    {children}
  </button>
);

// ============== WordExplanationBlock ==============
export const WordExplanationBlock = ({ word, T, onLearnt, onBookmark, learned, bookmarked }) => {
  if (!word) return null;
  const tenses = getTenseForms(word);

  return (
    <div
      data-testid="word-explanation-block"
      style={{
        padding: "18px 16px",
        borderRadius: 18,
        background: T.card,
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 38 }}>{word.emoji || "✨"}</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 30,
              fontWeight: 700,
              fontStyle: "italic",
              color: T.text,
              lineHeight: 1.1,
            }}
          >
            {word.word}
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            /{word.pronunciation || "—"}/ · {word.difficulty || "—"} · {word.period || "—"}
          </div>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: `1px dashed ${T.border}`, margin: "14px 0" }} />

      <div style={{ marginBottom: 10, color: T.text }}>
        <span style={{ fontWeight: 700, color: T.purple, marginRight: 8, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Meaning</span>
        <span style={{ fontSize: 15 }}>{word.meanings?.formal || word.meaning || "—"}</span>
      </div>

      {word.examples?.formal && (
        <div style={{ marginBottom: 10, color: T.muted }}>
          <span style={{ fontWeight: 700, color: T.purple, marginRight: 8, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>Example</span>
          <span style={{ fontStyle: "italic", color: T.text, fontSize: 15 }}>"{word.examples.formal}"</span>
        </div>
      )}

      {word.synonyms?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: T.muted, marginBottom: 6, fontWeight: 700 }}>Synonyms</div>
          {word.synonyms.map((s, i) => <Pill key={i} color={T.green} T={T}>{s}</Pill>)}
        </div>
      )}

      {word.antonyms?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: T.muted, marginBottom: 6, fontWeight: 700 }}>Antonyms</div>
          {word.antonyms.map((a, i) => <Pill key={i} color={T.red} T={T}>{a}</Pill>)}
        </div>
      )}

      <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: T.muted, marginBottom: 6, fontWeight: 700 }}>Tenses</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div><div style={{ fontSize: 11, color: T.muted }}>Past</div><div style={{ fontWeight: 600, color: T.text }}>{tenses.past}</div></div>
          <div><div style={{ fontSize: 11, color: T.muted }}>Present</div><div style={{ fontWeight: 600, color: T.text }}>{tenses.present}</div></div>
          <div><div style={{ fontSize: 11, color: T.muted }}>Future</div><div style={{ fontWeight: 600, color: T.text }}>{tenses.future}</div></div>
        </div>
      </div>

      {word.origin && (
        <div style={{ marginTop: 10, color: T.muted, fontSize: 13 }}>
          <strong style={{ color: T.purple }}>Origin: </strong>{word.origin}
        </div>
      )}

      {word.evolution?.length > 0 && (
        <div style={{ marginTop: 6, color: T.muted, fontSize: 13 }}>
          <strong style={{ color: T.purple }}>Evolution: </strong>{word.evolution.join(" → ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <IconBtn T={T} label="Hear" testid="web-hear-btn" onClick={() => speak(word.word)}>🔊</IconBtn>
        <IconBtn T={T} label="Slow" testid="web-slow-btn" onClick={() => speak(word.word, true)}>🐢</IconBtn>
        {onLearnt && <IconBtn T={T} color={learned ? T.green : T.text} label="Learnt" testid="web-learnt-btn" onClick={() => onLearnt(word)}>{learned ? "✅" : "✓"}</IconBtn>}
        {onBookmark && <IconBtn T={T} color={bookmarked ? T.gold : T.text} label="Bookmark" testid="web-bookmark-btn" onClick={() => onBookmark(word)}>📌</IconBtn>}
      </div>
    </div>
  );
};

// ============== FlashCardModal ==============
export const FlashCardModal = ({ word, onClose, onLearnt, onBookmark, onAddCustom, T, isAi, learned, bookmarked }) => {
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState("formal");
  if (!word) return null;
  const tenses = getTenseForms(word);

  const meaningModes = [
    { key: "formal", label: "Formal" },
    { key: "genZ", label: "Gen Z" },
    { key: "millennial", label: "Millennial" },
    { key: "medieval", label: "Medieval" },
  ];
  const meaning = word.meanings?.[mode] || word.meanings?.formal || word.meaning || "—";

  return (
    <div
      onClick={onClose}
      data-testid="flashcard-modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        background: T.overlay, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="genvo-slide-up"
        data-testid="flashcard-modal"
        style={{
          width: "100%", maxWidth: 540,
          background: T.surface,
          borderTop: `2px solid ${T.border}`,
          borderRadius: "28px 28px 0 0",
          padding: 18, paddingBottom: 28,
          maxHeight: "92vh", overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          data-testid="flashcard-close-btn"
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 40, height: 40, borderRadius: 999,
            background: T.card, border: `1px solid ${T.border}`,
            color: T.text, fontSize: 20,
          }}
        >✕</button>

        {isAi && (
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999,
            background: `${T.purple}26`, color: T.purple, fontSize: 11, fontWeight: 700,
            border: `1px solid ${T.purple}55`, marginBottom: 10 }}>
            🤖 AI Generated
          </div>
        )}

        {/* Card flip area */}
        <div className="flip-3d" style={{ height: 360, marginTop: 20, cursor: "pointer" }} onClick={() => setFlipped(!flipped)}>
          <div className={`flip-inner ${flipped ? "is-flipped" : ""}`} style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Front */}
            <div className="flip-face" style={{
              position: "absolute", inset: 0,
              background: T.card, borderRadius: 24,
              border: `2px solid ${T.border}`, boxShadow: T.shadow,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 22, textAlign: "center",
            }}>
              <div style={{ fontSize: 64 }}>{word.emoji || "✨"}</div>
              <div style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 48, fontWeight: 700, fontStyle: "italic",
                color: T.text, marginTop: 8, lineHeight: 1.05,
              }}>{word.word}</div>
              <div style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>/{word.pronunciation || "—"}/</div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: `${T.purple}26`, color: T.purple, border: `1px solid ${T.purple}55`,
                }}>{word.difficulty || "—"}</span>
                <span style={{
                  padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: `${T.gold}26`, color: T.gold, border: `1px solid ${T.gold}55`,
                }}>{word.period || word.category || "—"}</span>
              </div>
              <div style={{ color: T.muted, marginTop: 16, fontSize: 12 }}>tap to flip ✨</div>
            </div>
            {/* Back */}
            <div className="flip-face flip-back" style={{
              position: "absolute", inset: 0,
              background: T.card, borderRadius: 24,
              border: `2px solid ${T.border}`, boxShadow: T.shadow,
              padding: 18, overflowY: "auto",
            }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {meaningModes.map(m => (
                  <button
                    key={m.key}
                    onClick={(e) => { e.stopPropagation(); setMode(m.key); }}
                    data-testid={`mode-${m.key}-btn`}
                    style={{
                      padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${mode === m.key ? T.purple : T.border}`,
                      background: mode === m.key ? `${T.purple}26` : "transparent",
                      color: mode === m.key ? T.purple : T.muted,
                    }}
                  >{m.label}</button>
                ))}
              </div>
              <div style={{ color: T.text, fontSize: 16, lineHeight: 1.5, marginBottom: 12 }}>{meaning}</div>
              {word.examples?.[mode === "formal" ? "formal" : (mode === "genZ" ? "genZ" : "medieval")] && (
                <div style={{ fontStyle: "italic", color: T.muted, marginBottom: 12, fontSize: 14 }}>
                  "{word.examples[mode === "formal" ? "formal" : (mode === "genZ" ? "genZ" : "medieval")]}"
                </div>
              )}
              {word.synonyms?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {word.synonyms.map((s, i) => <Pill key={i} color={T.green} T={T}>{s}</Pill>)}
                </div>
              )}
              {word.antonyms?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {word.antonyms.map((a, i) => <Pill key={i} color={T.red} T={T}>{a}</Pill>)}
                </div>
              )}
              <div style={{ padding: 10, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 4 }}>Tenses</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
                  <div><div style={{ color: T.muted, fontSize: 10 }}>Past</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.past}</div></div>
                  <div><div style={{ color: T.muted, fontSize: 10 }}>Present</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.present}</div></div>
                  <div><div style={{ color: T.muted, fontSize: 10 }}>Future</div><div style={{ color: T.text, fontWeight: 600 }}>{tenses.future}</div></div>
                </div>
              </div>
              {word.evolution?.length > 0 && (
                <div style={{ marginTop: 10, color: T.muted, fontSize: 12 }}>
                  {word.evolution.join(" → ")}
                </div>
              )}
              {/* Compact pronunciation check on modal back face */}
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: T.card, border: `1px solid ${T.border}` }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🎤 PRONUNCIATION CHECK</div>
                <PronunciationCheck word={word} T={T} compact={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
          <IconBtn T={T} label="Hear" testid="fcm-hear-btn" onClick={() => speak(word.word)}>🔊</IconBtn>
          <IconBtn T={T} label="Slow" testid="fcm-slow-btn" onClick={() => speak(word.word, true)}>🐢</IconBtn>
          <IconBtn T={T} label="Flip" testid="fcm-flip-btn" onClick={() => setFlipped(!flipped)}>🔁</IconBtn>
          {onLearnt && <IconBtn T={T} color={learned ? T.green : T.text} label="Learnt" testid="fcm-learnt-btn" onClick={() => onLearnt(word)}>{learned ? "✅" : "✓"}</IconBtn>}
          {onBookmark && <IconBtn T={T} color={bookmarked ? T.gold : T.text} label="Bookmark" testid="fcm-bookmark-btn" onClick={() => onBookmark(word)}>📌</IconBtn>}
          {onAddCustom && isAi && <IconBtn T={T} color={T.purple} label="Add to My Words" testid="fcm-add-btn" onClick={() => onAddCustom(word)}>➕</IconBtn>}
        </div>
      </div>
    </div>
  );
};
