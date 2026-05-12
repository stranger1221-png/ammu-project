// GENVO — Practice page with 4 game modes
import React, { useState, useRef, useMemo } from "react";
import { speak, generateMistakeBreakdown } from "../../../lib/helpers";
import { WordExplanationBlock } from "../Modals";
import { FlashCardModal } from "../Modals";
import PronunciationCheck from "../PronunciationCheck";

const MODES = [
  { key: "find", icon: "🔍", label: "Find the Word", desc: "Spell it letter by letter" },
  { key: "blank", icon: "✍️", label: "Fill in the Blank", desc: "Complete the sentence" },
  { key: "pron", icon: "🎤", label: "Pronunciation Check", desc: "Say it out loud" },
  { key: "cross", icon: "🔠", label: "Crossword", desc: "Mini grid challenge" },
];

export default function Practice({ allWords, learned, bookmarks, onLearnt, onBookmark, addXp, T }) {
  const [step, setStep] = useState("pickWord"); // pickWord -> pickMode -> play
  const [selectedWord, setSelectedWord] = useState(null);
  const [mode, setMode] = useState(null);

  // Order: learnt first, then unlearnt
  const orderedWords = useMemo(() => {
    const learnedSet = new Set(learned);
    const learnedOnes = allWords.filter(w => learnedSet.has(w.id));
    const others = allWords.filter(w => !learnedSet.has(w.id));
    return [...learnedOnes, ...others];
  }, [allWords, learned]);

  if (step === "pickWord") {
    return (
      <div data-testid="practice-pick-word" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 24, color: T.text, marginBottom: 4 }}>Practice 🎮</div>
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 14 }}>Pick a word to practice</div>
        {orderedWords.slice(0, 60).map(w => (
          <button key={w.id} data-testid={`pick-word-${w.id}`} onClick={() => { setSelectedWord(w); setStep("pickMode"); }}
            style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 14px", borderRadius: 14, background: T.card, border: `1px solid ${learned.includes(w.id) ? T.green : T.border}`, color: T.text, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>{w.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 19, fontStyle: "italic", fontWeight: 700 }}>{w.word}</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.meanings?.formal?.slice(0, 70)}</div>
            </div>
            <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: `${T.purple}26`, color: T.purple }}>{w.difficulty}</span>
            {learned.includes(w.id) && <span style={{ color: T.green, fontSize: 14 }}>✅</span>}
          </button>
        ))}
      </div>
    );
  }

  if (step === "pickMode") {
    return (
      <div data-testid="practice-pick-mode" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto" }}>
        <button data-testid="practice-back-word" onClick={() => setStep("pickWord")}
          style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 999, background: T.card, color: T.muted, border: `1px solid ${T.border}`, fontSize: 12 }}>← Change word</button>
        <div style={{ padding: 14, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 30 }}>{selectedWord.emoji}</div>
          <div>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontStyle: "italic", fontWeight: 700, color: T.text }}>{selectedWord.word}</div>
            <div style={{ color: T.muted, fontSize: 12 }}>/{selectedWord.pronunciation}/</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Choose a Mode</div>
        {MODES.map(m => (
          <button key={m.key} data-testid={`practice-mode-${m.key}`} onClick={() => { setMode(m.key); setStep("play"); }}
            style={{ width: "100%", marginBottom: 10, padding: 16, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, textAlign: "left", display: "flex", alignItems: "center", gap: 14, boxShadow: T.shadow }}>
            <div style={{ fontSize: 30 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{m.label}</div>
              <div style={{ color: T.muted, fontSize: 12 }}>{m.desc}</div>
            </div>
            <div style={{ color: T.muted }}>→</div>
          </button>
        ))}
      </div>
    );
  }

  // Play mode
  return (
    <div data-testid="practice-play" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto" }}>
      <button data-testid="practice-back-mode" onClick={() => setStep("pickMode")}
        style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 999, background: T.card, color: T.muted, border: `1px solid ${T.border}`, fontSize: 12 }}>← Change mode</button>
      {mode === "find" && <FindGame word={selectedWord} T={T} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned} bookmarks={bookmarks} addXp={addXp} />}
      {mode === "blank" && <BlankGame word={selectedWord} T={T} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned} bookmarks={bookmarks} addXp={addXp} />}
      {mode === "pron" && <PronGame word={selectedWord} T={T} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned} bookmarks={bookmarks} addXp={addXp} />}
      {mode === "cross" && <CrossGame word={selectedWord} allWords={allWords} T={T} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned} bookmarks={bookmarks} addXp={addXp} />}
    </div>
  );
}

// ============== Find the Word ==============
const FindGame = ({ word, T, onLearnt, onBookmark, learned, bookmarks, addXp }) => {
  const targetRaw = word.word;
  const target = targetRaw.replace(/\s+/g, "").toUpperCase();
  const [letters, setLetters] = useState(Array(target.length).fill(""));
  const [hintLevel, setHintLevel] = useState(0);
  const [verified, setVerified] = useState(null); // null | 'correct' | 'wrong'
  const [showCard, setShowCard] = useState(false);
  const refs = useRef([]);

  const setAt = (i, v) => {
    const ch = (v || "").toUpperCase().replace(/[^A-Z]/, "");
    const next = [...letters];
    next[i] = ch.slice(-1);
    setLetters(next);
    if (ch && i < target.length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (e, i) => {
    if (e.key === "Backspace" && !letters[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const check = () => {
    const guess = letters.join("");
    if (guess === target) {
      setVerified("correct");
      addXp(hintLevel === 0 ? 25 : 10, "Find the Word");
    } else {
      setVerified("wrong");
    }
  };

  const reset = () => {
    setLetters(Array(target.length).fill(""));
    setHintLevel(0);
    setVerified(null);
    setShowCard(false);
  };

  const hints = [
    `Synonym: ${word.synonyms?.[0] || "—"}`,
    `Antonym: ${word.antonyms?.[0] || "—"}`,
    `Example: ${(word.examples?.formal || "").replace(new RegExp(word.word, "gi"), "_____")}`,
    `Meaning: ${(word.meanings?.formal || "").slice(0, 90)}...`,
  ];

  return (
    <div>
      <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 4 }}>🔍 Find the Word</div>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>{target.length} letters</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {letters.map((l, i) => {
          let bg = T.card, border = T.border;
          if (verified) {
            if (l && l === target[i]) { bg = `${T.green}26`; border = T.green; }
            else if (l) { bg = `${T.red}26`; border = T.red; }
          }
          return (
            <input
              key={i}
              ref={(r) => (refs.current[i] = r)}
              data-testid={`find-letter-${i}`}
              value={l}
              maxLength={1}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => handleKey(e, i)}
              disabled={verified === "correct"}
              style={{
                width: 44, height: 52, fontSize: 22, fontWeight: 800, textAlign: "center",
                color: T.text, background: bg, border: `2px solid ${border}`, borderRadius: 12,
                fontFamily: "'Crimson Pro', serif",
              }}
            />
          );
        })}
      </div>

      {!verified && (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <button data-testid="find-check-btn" onClick={check} disabled={letters.some(l => !l)}
              style={{ padding: "10px 18px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, opacity: letters.some(l => !l) ? 0.5 : 1 }}>Check</button>
            <button data-testid="find-hint-btn" onClick={() => setHintLevel(Math.min(hintLevel + 1, 4))} disabled={hintLevel >= 4}
              style={{ padding: "10px 18px", borderRadius: 999, background: T.card, color: T.text, border: `1px solid ${T.border}`, fontWeight: 700, opacity: hintLevel >= 4 ? 0.5 : 1 }}>💡 Hint ({hintLevel}/4)</button>
            <button data-testid="find-hear-btn" onClick={() => speak(word.word)} style={{ width: 44, height: 44, borderRadius: 999, background: T.card, border: `1px solid ${T.border}`, color: T.text }}>🔊</button>
          </div>
          {hintLevel > 0 && (
            <div data-testid="find-hints" style={{ padding: 12, borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, marginBottom: 14 }}>
              {hints.slice(0, hintLevel).map((h, i) => (
                <div key={i} style={{ color: T.muted, fontSize: 13, marginBottom: 4 }}>{i + 1}. {h}</div>
              ))}
            </div>
          )}
        </>
      )}

      {verified && (
        <div data-testid="find-verification" style={{ padding: 16, borderRadius: 18, background: T.card, border: `2px solid ${verified === "correct" ? T.green : T.red}`, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, color: verified === "correct" ? T.green : T.red, fontSize: 18, marginBottom: 8 }}>
            {verified === "correct" ? "✅ Well done!" : "❌ Not quite!"}
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Your answer</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {letters.map((l, i) => (
                <div key={i} style={{ width: 32, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: T.text,
                  background: l && l === target[i] ? `${T.green}26` : `${T.red}26`,
                  border: `1.5px solid ${l && l === target[i] ? T.green : T.red}` }}>{l || "·"}</div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Correct answer</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {target.split("").map((l, i) => (
                <div key={i} style={{ width: 32, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: T.green, background: `${T.green}26`, border: `1.5px solid ${T.green}` }}>{l}</div>
              ))}
            </div>
          </div>

          {verified === "wrong" && (() => {
            const breakdown = generateMistakeBreakdown(letters.join(""), target, word) || [];
            return breakdown.length > 0 ? (
              <div style={{ padding: 10, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: T.red, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>❗ Mistake Breakdown</div>
                {breakdown.map((b, i) => <div key={i} style={{ color: T.text, fontSize: 12, marginBottom: 2 }}>• {b}</div>)}
              </div>
            ) : null;
          })()}

          <WordExplanationBlock word={word} T={T} />

          <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
            <button data-testid="find-show-card-btn" onClick={() => setShowCard(true)}
              style={{ padding: "9px 14px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13 }}>Open Card</button>
            <button data-testid="find-next-btn" onClick={reset}
              style={{ padding: "9px 14px", borderRadius: 999, background: T.card, color: T.text, border: `1px solid ${T.border}`, fontWeight: 700, fontSize: 13 }}>Try Again →</button>
          </div>
        </div>
      )}

      {showCard && <FlashCardModal word={word} T={T} onClose={() => setShowCard(false)} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned.includes(word.id)} bookmarked={bookmarks.includes(word.id)} />}
    </div>
  );
};

// ============== Fill in the Blank ==============
const BlankGame = ({ word, T, onLearnt, onBookmark, learned, bookmarks, addXp }) => {
  const example = word.examples?.formal || `She used "${word.word}" perfectly.`;
  const sentence = example.replace(new RegExp(word.word, "gi"), "_____");
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(null);
  const [tries, setTries] = useState(0);
  const [showCard, setShowCard] = useState(false);

  const check = () => {
    const t = tries + 1;
    setTries(t);
    if (input.trim().toLowerCase() === word.word.toLowerCase()) {
      setVerified("correct");
      addXp(t === 1 ? 15 : 5, "Fill in the Blank");
    } else {
      setVerified("wrong");
    }
  };

  const reset = () => { setInput(""); setVerified(null); };

  return (
    <div>
      <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 12 }}>✍️ Fill in the Blank</div>
      <div style={{ padding: 16, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, fontStyle: "italic", color: T.text, fontSize: 16, lineHeight: 1.5, marginBottom: 14, fontFamily: "'Crimson Pro', serif" }}>
        "{sentence}"
      </div>
      <input
        data-testid="blank-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type the missing word..."
        disabled={verified === "correct"}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 16, marginBottom: 12 }}
      />
      {!verified && (
        <button data-testid="blank-check-btn" onClick={check} disabled={!input.trim()}
          style={{ padding: "10px 18px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, opacity: !input.trim() ? 0.5 : 1 }}>Check</button>
      )}
      {verified && (
        <div data-testid="blank-verification" style={{ padding: 16, borderRadius: 18, background: T.card, border: `2px solid ${verified === "correct" ? T.green : T.red}` }}>
          <div style={{ fontWeight: 800, color: verified === "correct" ? T.green : T.red, fontSize: 18, marginBottom: 8 }}>
            {verified === "correct" ? `✅ Correct! +${tries === 1 ? 15 : 5} XP` : "❌ Not quite!"}
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted }}>Your answer</div>
            <div style={{ color: verified === "correct" ? T.green : T.red, fontWeight: 700, fontFamily: "'Crimson Pro', serif", fontSize: 18, fontStyle: "italic" }}>{input}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.muted }}>Correct answer</div>
            <div style={{ color: T.gold, fontWeight: 700, fontFamily: "'Crimson Pro', serif", fontSize: 18, fontStyle: "italic" }}>{word.word}</div>
          </div>
          {verified === "wrong" && (() => {
            const b = generateMistakeBreakdown(input, word.word, word) || [];
            return b.length ? (
              <div style={{ padding: 10, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: T.red, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>❗ Mistake Breakdown</div>
                {b.map((x, i) => <div key={i} style={{ color: T.text, fontSize: 12, marginBottom: 2 }}>• {x}</div>)}
              </div>
            ) : null;
          })()}
          <WordExplanationBlock word={word} T={T} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
            <button data-testid="blank-show-card-btn" onClick={() => setShowCard(true)} style={{ padding: "9px 14px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13 }}>Open Card</button>
            <button data-testid="blank-next-btn" onClick={reset} style={{ padding: "9px 14px", borderRadius: 999, background: T.card, color: T.text, border: `1px solid ${T.border}`, fontWeight: 700, fontSize: 13 }}>{verified === "correct" ? "Next →" : "Try Again →"}</button>
          </div>
        </div>
      )}
      {showCard && <FlashCardModal word={word} T={T} onClose={() => setShowCard(false)} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned.includes(word.id)} bookmarked={bookmarks.includes(word.id)} />}
    </div>
  );
};

// ============== Pronunciation Check ==============
const PronGame = ({ word, T, onLearnt, onBookmark, learned, bookmarks, addXp }) => {
  const [showCard, setShowCard] = useState(false);

  const handleAccepted = (w, xp) => {
    addXp(xp, "Pronunciation");
  };

  return (
    <div>
      <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 16 }}>🎤 Pronunciation Check</div>
      <PronunciationCheck
        word={word}
        T={T}
        compact={false}
        onScore={(s) => { /* score already handled in onAccepted */ }}
        onAccepted={handleAccepted}
        onLearnt={onLearnt}
        onBookmark={onBookmark}
        onNext={() => setShowCard(true)}
      />
      {showCard && <FlashCardModal word={word} T={T} onClose={() => setShowCard(false)} onLearnt={onLearnt} onBookmark={onBookmark} learned={learned.includes(word.id)} bookmarked={bookmarks.includes(word.id)} />}
    </div>
  );
};

// ============== Crossword (mini) ==============
const CrossGame = ({ word, allWords, T, onLearnt, onBookmark, learned, bookmarks, addXp }) => {
  // Build a tiny crossword: 1 word horizontally + 2-3 short words intersecting where letters match.
  const buildPuzzle = () => {
    const main = (word.word || "").toUpperCase().replace(/\s+/g, "");
    const pool = allWords.filter(w => w.id !== word.id && /^[A-Za-z]+$/.test(w.word) && w.word.length >= 3 && w.word.length <= 7);
    const picked = [];
    for (const candidate of pool) {
      const cw = candidate.word.toUpperCase();
      // Find an intersection with main word
      for (let mi = 0; mi < main.length; mi++) {
        for (let ci = 0; ci < cw.length; ci++) {
          if (main[mi] === cw[ci]) {
            picked.push({ word: cw, dir: "down", row: -ci, col: mi, def: candidate });
            break;
          }
        }
        if (picked.length >= 3) break;
      }
      if (picked.length >= 3) break;
    }
    // Normalize so the smallest row is 0
    const minRow = Math.min(0, ...picked.map(p => p.row));
    const main_row = -minRow;
    const cells = {};
    // Place main horizontally at main_row
    for (let i = 0; i < main.length; i++) {
      cells[`${main_row},${i}`] = { ans: main[i], wIds: ["main"] };
    }
    const placed = [{ id: "main", word: main, dir: "across", row: main_row, col: 0, def: word }];
    picked.forEach((p, idx) => {
      const id = `d${idx}`;
      const startRow = p.row - minRow;
      for (let i = 0; i < p.word.length; i++) {
        const k = `${startRow + i},${p.col}`;
        if (cells[k]) cells[k].wIds.push(id);
        else cells[k] = { ans: p.word[i], wIds: [id] };
      }
      placed.push({ id, word: p.word, dir: "down", row: startRow, col: p.col, def: p.def });
    });
    // Compute grid bounds
    const rows = Object.keys(cells).map(k => parseInt(k.split(",")[0]));
    const cols = Object.keys(cells).map(k => parseInt(k.split(",")[1]));
    const maxR = Math.max(...rows), maxC = Math.max(...cols);
    return { cells, placed, rows: maxR + 1, cols: maxC + 1 };
  };

  const [puzzle] = useState(buildPuzzle());
  const [user, setUser] = useState({}); // key 'r,c' -> letter
  const [completed, setCompleted] = useState({}); // word id -> 'correct' | 'wrong-tries'
  const [activeId, setActiveId] = useState(puzzle.placed[0].id);
  const [done, setDone] = useState(false);
  const [bonusGiven, setBonusGiven] = useState(false);
  const [revealCard, setRevealCard] = useState(null);

  const cellLetter = (r, c) => user[`${r},${c}`] || "";
  const isHighlighted = (r, c) => {
    const cell = puzzle.cells[`${r},${c}`];
    if (!cell) return false;
    return cell.wIds.includes(activeId);
  };
  const setCell = (r, c, v) => {
    const ch = (v || "").toUpperCase().replace(/[^A-Z]/, "").slice(-1);
    setUser({ ...user, [`${r},${c}`]: ch });
  };

  const checkWord = (entry) => {
    const tries = (completed[entry.id] || 0);
    let allCorrect = true;
    if (entry.dir === "across") {
      for (let i = 0; i < entry.word.length; i++) {
        if (cellLetter(entry.row, entry.col + i) !== entry.word[i]) { allCorrect = false; break; }
      }
    } else {
      for (let i = 0; i < entry.word.length; i++) {
        if (cellLetter(entry.row + i, entry.col) !== entry.word[i]) { allCorrect = false; break; }
      }
    }
    if (allCorrect) {
      setCompleted({ ...completed, [entry.id]: "correct" });
      addXp(tries === 0 ? 15 : 5, `Crossword: ${entry.word}`);
      setRevealCard(entry.def);
    } else {
      setCompleted({ ...completed, [entry.id]: (typeof tries === "number" ? tries + 1 : 1) });
    }
  };

  const finishAll = () => {
    const all = puzzle.placed.every(p => completed[p.id] === "correct");
    if (all && !bonusGiven) {
      addXp(60, "Crossword Complete (all correct)");
      setBonusGiven(true);
    } else if (!bonusGiven) {
      const correctCount = puzzle.placed.filter(p => completed[p.id] === "correct").length;
      if (correctCount > 0) addXp(30, "Crossword (partial)");
      else addXp(10, "Crossword (participation)");
      setBonusGiven(true);
    }
    setDone(true);
  };

  return (
    <div>
      <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 12 }}>🔠 Crossword</div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${puzzle.cols}, 36px)`, gap: 3, justifyContent: "center", marginBottom: 16 }}>
        {Array.from({ length: puzzle.rows * puzzle.cols }).map((_, idx) => {
          const r = Math.floor(idx / puzzle.cols), c = idx % puzzle.cols;
          const cell = puzzle.cells[`${r},${c}`];
          if (!cell) return <div key={idx} style={{ width: 36, height: 36, background: "transparent" }} />;
          const correct = completed[activeId] === "correct" && isHighlighted(r, c);
          const locked = puzzle.placed.some(p => completed[p.id] === "correct" && cell.wIds.includes(p.id));
          return (
            <input
              key={idx}
              data-testid={`cw-cell-${r}-${c}`}
              maxLength={1}
              value={cellLetter(r, c)}
              onChange={(e) => setCell(r, c, e.target.value)}
              disabled={locked}
              style={{
                width: 36, height: 36, textAlign: "center",
                fontSize: 16, fontWeight: 800, fontFamily: "'Crimson Pro', serif",
                background: locked ? `${T.green}26` : (isHighlighted(r, c) ? `${T.purple}1f` : T.card),
                border: `1.5px solid ${locked ? T.green : (isHighlighted(r, c) ? T.purple : T.border)}`,
                borderRadius: 6, color: T.text,
              }}
            />
          );
        })}
      </div>

      {/* Clues */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Clues</div>
        {puzzle.placed.map(p => (
          <button key={p.id} data-testid={`cw-clue-${p.id}`} onClick={() => setActiveId(p.id)}
            style={{ width: "100%", textAlign: "left", padding: 10, borderRadius: 12, marginBottom: 6, background: activeId === p.id ? `${T.purple}22` : T.card, border: `1px solid ${activeId === p.id ? T.purple : T.border}`, color: T.text }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: T.purple, marginRight: 6 }}>{p.dir === "across" ? "ACROSS" : "DOWN"}</span>
            <span style={{ color: completed[p.id] === "correct" ? T.green : T.text, fontSize: 13 }}>
              {(p.def.meanings?.formal || "").slice(0, 60)}...
            </span>
            {completed[p.id] === "correct" && <span style={{ marginLeft: 6, color: T.green }}>✅</span>}
            <button onClick={(e) => { e.stopPropagation(); checkWord(p); }} data-testid={`cw-check-${p.id}`}
              style={{ float: "right", padding: "3px 8px", borderRadius: 999, background: T.purple, color: "#fff", fontSize: 11, fontWeight: 700 }}>Check</button>
          </button>
        ))}
      </div>

      {!done && <button data-testid="cw-finish-btn" onClick={finishAll} style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 700 }}>Finish</button>}

      {done && (
        <div data-testid="cw-final" style={{ marginTop: 14, padding: 16, borderRadius: 18, background: T.card, border: `2px solid ${T.gold}` }}>
          <div style={{ fontFamily: "'Outfit'", fontSize: 18, fontWeight: 800, color: T.text }}>🎉 Crossword Complete!</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            Score: {puzzle.placed.filter(p => completed[p.id] === "correct").length}/{puzzle.placed.length} correct
          </div>
          {puzzle.placed.map(p => (
            <div key={p.id} style={{ marginTop: 6, color: completed[p.id] === "correct" ? T.green : T.red, fontSize: 13 }}>
              {completed[p.id] === "correct" ? "✅" : "❌"} <strong>{p.word}</strong> — {(p.def.meanings?.formal || "").slice(0, 80)}
            </div>
          ))}
        </div>
      )}

      {revealCard && (
        <div onClick={() => setRevealCard(null)} className="genvo-fade-in"
          style={{ position: "fixed", inset: 0, zIndex: 100000, background: T.overlay, backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 540, background: T.surface, padding: 18, borderRadius: "28px 28px 0 0", border: `2px solid ${T.green}`, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ color: T.green, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>✅ {revealCard.word} correct! +XP</div>
            <WordExplanationBlock word={revealCard} T={T} />
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              <button data-testid="cw-continue-btn" onClick={() => setRevealCard(null)}
                style={{ padding: "9px 14px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 13 }}>Continue Crossword →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
