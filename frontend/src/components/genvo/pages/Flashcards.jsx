// GENVO — Flashcards page
import React, { useState, useMemo } from "react";
import { speak } from "../../../lib/helpers";
import { FlashCardModal } from "../Modals";
import PronunciationCheck from "../PronunciationCheck";

const FilterPills = ({ filter, setFilter, bookmarks, learned, allCount, T }) => {
  const opts = [
    { k: "all",    label: "All",    count: allCount,         icon: "🌐" },
    { k: "saved",  label: "Saved",  count: bookmarks.length, icon: "📌" },
    { k: "learnt", label: "Learnt", count: learned.length,   icon: "✅" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }} data-testid="fc-filter-pills">
      {opts.map(o => {
        const active = filter === o.k;
        return (
          <button
            key={o.k}
            data-testid={`fc-filter-${o.k}`}
            onClick={() => setFilter(o.k)}
            style={{
              flex: 1, padding: "8px 6px", borderRadius: 12,
              fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
              border: `1.5px solid ${active ? T.purple : T.border}`,
              background: active ? `${T.purple}26` : T.card,
              color: active ? T.purple : T.muted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <span>{o.icon}</span>
            <span>{o.label}</span>
            <span style={{
              padding: "1px 7px", borderRadius: 999, fontSize: 10,
              background: active ? T.purple : T.surface,
              color: active ? "#fff" : T.muted,
            }}>{o.count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default function Flashcards({ allWords, learned, bookmarks, onLearnt, onBookmark, T }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState("formal");
  const [openModal, setOpenModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all | saved | learnt

  const list = useMemo(() => {
    if (!allWords?.length) return [];
    if (filter === "saved") return allWords.filter(w => bookmarks.includes(w.id));
    if (filter === "learnt") return allWords.filter(w => learned.includes(w.id));
    return allWords;
  }, [allWords, filter, bookmarks, learned]);

  // If filter changes and idx is now past the end, reset.
  if (idx >= list.length && list.length > 0) {
    setIdx(0);
    setFlipped(false);
  }

  if (!allWords?.length) {
    return <div style={{ padding: 20, color: T.muted, textAlign: "center" }}>Loading words...</div>;
  }

  // Empty state for the chosen filter
  if (!list.length) {
    return (
      <div data-testid="flashcards-page" style={{ padding: "16px 16px 130px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 24, color: T.text }}>Flashcards</div>
        </div>
        <FilterPills filter={filter} setFilter={setFilter} bookmarks={bookmarks} learned={learned} allCount={allWords.length} T={T} />
        <div style={{ marginTop: 20, padding: 24, borderRadius: 22, background: T.card, border: `1.5px dashed ${T.border}`, textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{filter === "saved" ? "📌" : "🌱"}</div>
          <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 18, color: T.text }}>
            {filter === "saved" ? "No saved words yet" : "No learnt words yet"}
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            {filter === "saved"
              ? "Tap the 📌 button on any flashcard to save it."
              : "Tap ✓ on a flashcard to mark it learnt."}
          </div>
          <button data-testid="fc-filter-back-all" onClick={() => setFilter("all")}
            style={{ marginTop: 14, padding: "9px 16px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13 }}>
            Browse all words →
          </button>
        </div>
      </div>
    );
  }

  const word = list[idx % list.length];
  const wod = list[new Date().getDate() % list.length];
  const learnedCount = learned.length;
  const nextRewardAt = [10, 20, 30, 40, 50].find((m) => learnedCount < m) || 60;
  const isLearned = learned.includes(word.id);
  const isBookmarked = bookmarks.includes(word.id);

  const meaningModes = [
    { key: "formal", label: "Formal" },
    { key: "genZ", label: "Gen Z" },
    { key: "millennial", label: "Mill" },
    { key: "medieval", label: "Med" },
  ];
  const meaning = word.meanings?.[mode] || word.meanings?.formal || "—";
  const exampleKey = mode === "genZ" ? "genZ" : mode === "medieval" ? "medieval" : "formal";
  const example = word.examples?.[exampleKey] || word.examples?.formal;

  return (
    <div data-testid="flashcards-page" style={{ padding: "16px 16px 130px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 24, color: T.text }}>Flashcards</div>
        <div style={{ color: T.muted, fontSize: 13 }} data-testid="flashcard-counter">{idx + 1} / {list.length}</div>
      </div>

      {/* Filter (All / Saved / Learnt) */}
      <FilterPills filter={filter} setFilter={setFilter} bookmarks={bookmarks} learned={learned} allCount={allWords.length} T={T} />

      {/* Mode pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {meaningModes.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            data-testid={`fc-mode-${m.key}`}
            style={{
              padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: `1px solid ${mode === m.key ? T.purple : T.border}`,
              background: mode === m.key ? `${T.purple}26` : "transparent",
              color: mode === m.key ? T.purple : T.muted,
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* Card */}
      <div className="flip-3d" style={{ height: 420, cursor: "pointer" }} onClick={() => setFlipped(!flipped)}>
        <div className={`flip-inner ${flipped ? "is-flipped" : ""}`} style={{ position: "relative", width: "100%", height: "100%" }}>
          <div className="flip-face" data-testid="flashcard-front" style={{
            position: "absolute", inset: 0, background: T.card, borderRadius: 28,
            border: `2px solid ${T.border}`, boxShadow: T.shadow,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center",
          }}>
            <div style={{ fontSize: 64 }}>{word.emoji}</div>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 52, fontStyle: "italic", fontWeight: 700, color: T.text, marginTop: 8 }}>{word.word}</div>
            <div style={{ color: T.muted, marginTop: 6 }}>/{word.pronunciation}/</div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${T.purple}26`, color: T.purple, border: `1px solid ${T.purple}55` }}>{word.difficulty}</span>
              <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${T.gold}26`, color: T.gold, border: `1px solid ${T.gold}55` }}>{word.period}</span>
            </div>
            <div style={{ color: T.muted, marginTop: 18, fontSize: 12 }}>tap to reveal ✨</div>
          </div>
          <div className="flip-face flip-back" data-testid="flashcard-back" style={{
            position: "absolute", inset: 0, background: T.card, borderRadius: 28,
            border: `2px solid ${T.border}`, boxShadow: T.shadow, padding: 20, overflowY: "auto",
          }}>
            <div style={{ color: T.text, fontSize: 17, lineHeight: 1.5, marginBottom: 12 }}>{meaning}</div>
            {example && <div style={{ fontStyle: "italic", color: T.muted, marginBottom: 12, fontSize: 14 }}>"{example}"</div>}
            {word.synonyms?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {word.synonyms.map((s, i) => (
                  <span key={i} style={{ display: "inline-block", padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${T.green}26`, color: T.green, border: `1px solid ${T.green}55`, marginRight: 6, marginBottom: 6 }}>{s}</span>
                ))}
              </div>
            )}
            {word.antonyms?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {word.antonyms.map((a, i) => (
                  <span key={i} style={{ display: "inline-block", padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${T.red}26`, color: T.red, border: `1px solid ${T.red}55`, marginRight: 6, marginBottom: 6 }}>{a}</span>
                ))}
              </div>
            )}
            {word.evolution?.length > 0 && (
              <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>{word.evolution.join(" → ")}</div>
            )}
            {/* Compact pronunciation check on the back face */}
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🎤 PRONUNCIATION CHECK</div>
              <PronunciationCheck word={word} T={T} compact={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
        <button data-testid="fc-hear-btn" onClick={() => speak(word.word)} style={{ width: 46, height: 46, borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 17 }}>🔊</button>
        <button data-testid="fc-slow-btn" onClick={() => speak(word.word, true)} style={{ width: 46, height: 46, borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 17 }}>🐢</button>
        <button data-testid="fc-flip-btn" onClick={() => setFlipped(!flipped)} style={{ width: 46, height: 46, borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 17 }}>🔁</button>
        <button data-testid="fc-bookmark-btn" onClick={() => onBookmark(word)} style={{ width: 46, height: 46, borderRadius: 999, background: isBookmarked ? `${T.gold}26` : T.surface, border: `1px solid ${isBookmarked ? T.gold : T.border}`, color: isBookmarked ? T.gold : T.text, fontSize: 17 }}>📌</button>
        <button data-testid="fc-learnt-btn" onClick={() => onLearnt(word)} style={{ width: 46, height: 46, borderRadius: 999, background: isLearned ? `${T.green}26` : T.surface, border: `1px solid ${isLearned ? T.green : T.border}`, color: isLearned ? T.green : T.text, fontSize: 17 }}>{isLearned ? "✅" : "✓"}</button>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
        <button data-testid="fc-prev-btn" onClick={() => { setIdx((idx - 1 + list.length) % list.length); setFlipped(false); }}
          style={{ padding: "10px 18px", borderRadius: 999, background: T.card, border: `1px solid ${T.border}`, color: T.text, fontWeight: 700 }}>← Prev</button>
        <button data-testid="fc-next-btn" onClick={() => { setIdx((idx + 1) % list.length); setFlipped(false); }}
          style={{ padding: "10px 18px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700 }}>Next →</button>
      </div>

      <div style={{ textAlign: "center", marginTop: 14, color: T.muted, fontSize: 13 }} data-testid="fc-progress">
        Learnt: {learnedCount} · 🎁 Next reward at {nextRewardAt}
      </div>

      {/* Word of the Day */}
      <div style={{ marginTop: 22, padding: 16, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>🌟 Word of the Day</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32 }}>{wod.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 24, fontStyle: "italic", fontWeight: 700, color: T.text }}>{wod.word}</div>
            <div style={{ color: T.muted, fontSize: 13 }}>{wod.meanings?.formal?.slice(0, 90)}...</div>
          </div>
          <button data-testid="wod-open-btn" onClick={() => setOpenModal(true)}
            style={{ padding: "8px 12px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 12 }}>Open</button>
        </div>
      </div>

      {openModal && (
        <FlashCardModal
          word={wod}
          T={T}
          onClose={() => setOpenModal(false)}
          onLearnt={onLearnt}
          onBookmark={onBookmark}
          learned={learned.includes(wod.id)}
          bookmarked={bookmarks.includes(wod.id)}
        />
      )}
    </div>
  );
}
