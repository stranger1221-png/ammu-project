// GENVO — Story Builder page
import React, { useState } from "react";
import { aiStory } from "../../../lib/ai";
import { speak } from "../../../lib/helpers";
import { FlashCardModal } from "../Modals";

const THEMES = ["fantasy", "mystery", "romance", "sci-fi", "medieval", "comedy", "horror", "mythology"];

export default function Story({ allWords, onLearnt, onBookmark, onAddCustom, learned, bookmarks, T }) {
  const [theme, setTheme] = useState("fantasy");
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState("");
  const [vocab, setVocab] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState("");
  const [openCard, setOpenCard] = useState(null);
  const [openIsAi, setOpenIsAi] = useState(false);

  const generate = async () => {
    if (!word.trim()) return;
    setLoading(true); setError(""); setStory(""); setVocab([]); setWordCount(0);
    try {
      const r = await aiStory(theme, word.trim());
      if (r?.story) {
        setStory(r.story);
        setVocab(r.vocab || []);
        setWordCount(r.word_count || 0);
      } else {
        setError("✨ The story spirits are resting... Please try again!");
      }
    } catch (e) {
      setError("✨ The story spirits are resting... Please try again!");
    }
    setLoading(false);
  };

  const openVocab = (v) => {
    const found = allWords.find(x => x.word.toLowerCase() === (v.word || "").toLowerCase());
    if (found) {
      setOpenCard(found);
      setOpenIsAi(false);
    } else {
      // Build temporary
      const tmp = {
        id: `vocab-${v.word}-${Date.now()}`,
        word: v.word,
        emoji: v.emoji || "✨",
        pronunciation: v.pronunciation || "",
        difficulty: "Medium",
        period: "Story",
        category: "AI",
        meanings: { formal: v.meaning, genZ: v.meaning, millennial: v.meaning, medieval: v.meaning, victorian: v.meaning, oldEnglish: v.meaning },
        synonyms: [],
        antonyms: [],
        examples: { formal: "" },
        evolution: [],
        isAi: true,
      };
      setOpenCard(tmp);
      setOpenIsAi(true);
    }
  };

  return (
    <div data-testid="story-page" style={{ padding: "16px 16px 130px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 24, color: T.text, marginBottom: 12 }}>Story Builder ✍️</div>

      {/* Theme pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {THEMES.map(t => (
          <button key={t} onClick={() => setTheme(t)} data-testid={`theme-${t}`}
            style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: theme === t ? `${T.purple}26` : T.card,
              color: theme === t ? T.purple : T.muted,
              border: `1px solid ${theme === t ? T.purple : T.border}`,
              whiteSpace: "nowrap", textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          data-testid="story-word-input"
          placeholder="Enter a word..."
          value={word}
          onChange={(e) => setWord(e.target.value)}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15 }}
        />
        <button data-testid="story-generate-btn" onClick={generate} disabled={loading || !word.trim()}
          style={{ padding: "11px 16px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13, opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "✍️ Generate"}
        </button>
      </div>

      {loading && (
        <div data-testid="story-loading" className="genvo-pulse" style={{ padding: 18, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, color: T.muted, textAlign: "center" }}>
          ✍️ Writing your story...
        </div>
      )}

      {error && <div data-testid="story-error" style={{ padding: 14, borderRadius: 14, background: `${T.red}1f`, color: T.red, marginBottom: 12 }}>{error}</div>}

      {story && !loading && (
        <>
          <div style={{ padding: 18, borderRadius: 22, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>📖 Story</div>
              <div data-testid="story-wordcount" style={{ fontSize: 12, color: T.muted }}>📝 {wordCount} words</div>
            </div>
            <div data-testid="story-text" style={{
              fontFamily: "'Crimson Pro', serif", fontSize: 16, lineHeight: 1.9, color: T.text,
              whiteSpace: "pre-wrap",
            }}>{story}</div>
          </div>

          {vocab.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>✨ New Words in This Story</div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                {vocab.map((v, i) => (
                  <button key={i} data-testid={`vocab-card-${i}`} onClick={() => openVocab(v)}
                    style={{ minWidth: 180, padding: 14, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, textAlign: "left", boxShadow: T.shadow, flexShrink: 0 }}>
                    <div style={{ fontSize: 26 }}>{v.emoji || "✨"}</div>
                    <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, fontStyle: "italic", fontWeight: 700, marginTop: 4 }}>{v.word}</div>
                    {v.pronunciation && <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>/{v.pronunciation}/</div>}
                    <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.meaning}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 999, fontSize: 11, color: T.purple, background: `${T.purple}26`, border: `1px solid ${T.purple}55` }} onClick={(e) => { e.stopPropagation(); speak(v.word); }}>🔊 Hear</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button data-testid="story-regenerate-btn" onClick={generate} disabled={loading}
            style={{ marginTop: 16, padding: "10px 18px", borderRadius: 999, background: T.surface, color: T.text, border: `1px solid ${T.border}`, fontWeight: 700 }}>
            🔄 Generate Another
          </button>
        </>
      )}

      {openCard && (
        <FlashCardModal
          word={openCard}
          T={T}
          isAi={openIsAi}
          onClose={() => setOpenCard(null)}
          onLearnt={onLearnt}
          onBookmark={onBookmark}
          onAddCustom={openIsAi ? (w) => { onAddCustom(w); setOpenCard(null); } : null}
          learned={learned.includes(openCard.id)}
          bookmarked={bookmarks.includes(openCard.id)}
        />
      )}
    </div>
  );
}
