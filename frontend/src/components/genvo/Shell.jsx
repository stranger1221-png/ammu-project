// GENVO — Shell: Header, BottomNav, SearchFAB+SearchModal, EditAccountModal, RewardModal, XPToast
import React, { useState, useEffect } from "react";
import { aiLookup } from "../../lib/ai";
import { speak } from "../../lib/helpers";

const ICONS = ["🦊", "🐼", "🦁", "🐸", "🦋", "🌸", "🔥", "⚡", "🎯", "🌙", "👑", "🎨", "🚀", "🌊", "🦉", "🍀", "🎭", "🏆"];

// ===== Header =====
export const Header = ({ user, isDark, setIsDark, xp, onAvatarClick, onPaletteClick, T }) => {
  const level = Math.floor(xp / 100) + 1;
  const fill = xp % 100;
  return (
    <div
      data-testid="genvo-header"
      style={{
        position: "sticky", top: 0, zIndex: 30,
        background: `${T.bg}d9`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* GENVO icon — 🌻 */}
        <div
          aria-label="GENVO logo"
          data-testid="header-logo"
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, lineHeight: 1,
          }}
        >🌻</div>
        <div
          style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700, fontStyle: "italic",
            background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 0.5,
          }}
        >GENVO</div>
      </div>

      {/* XP bar */}
      <div style={{ flex: 1, marginLeft: 8, marginRight: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>
          <span>LVL {level}</span>
          <span data-testid="header-xp">{xp} XP</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: T.border, overflow: "hidden" }}>
          <div style={{
            width: `${fill}%`, height: "100%",
            background: `linear-gradient(90deg, ${T.purple}, ${T.pink})`,
            transition: "width 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
          }} />
        </div>
      </div>

      {/* Palette picker */}
      {onPaletteClick && (
        <button
          onClick={onPaletteClick}
          data-testid="palette-toggle-btn"
          aria-label="Choose color palette"
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: T.card, border: `1px solid ${T.border}`,
            color: T.text, fontSize: 16,
          }}
        >🎨</button>
      )}

      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        data-testid="theme-toggle-btn"
        aria-label="Toggle theme"
        style={{
          width: 38, height: 38, borderRadius: 999,
          background: T.card, border: `1px solid ${T.border}`,
          color: T.text, fontSize: 16,
        }}
      >{isDark ? "☀️" : "🌙"}</button>

      {/* Avatar */}
      <button
        onClick={onAvatarClick}
        data-testid="header-avatar-btn"
        aria-label="Edit account"
        style={{
          width: 38, height: 38, borderRadius: 999,
          background: T.card, border: `2px solid ${T.purple}`,
          fontSize: 18,
        }}
      >{user?.icon || "🦊"}</button>
    </div>
  );
};

// ===== BottomNav =====
export const BottomNav = ({ page, setPage, T }) => {
  const items = [
    { key: "flashcards", label: "Cards", icon: "🃏" },
    { key: "dictionary", label: "Dict", icon: "📖" },
    { key: "practice", label: "Play", icon: "🎮" },
    { key: "story", label: "Story", icon: "📜" },
    { key: "tutor", label: "Hoot", icon: "🦉" },
    { key: "dashboard", label: "Stats", icon: "🏆" },
  ];
  return (
    <div
      data-testid="bottom-nav"
      style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        width: "calc(100% - 24px)", maxWidth: 520, height: 68,
        borderRadius: 999,
        background: `${T.surface}e0`,
        backdropFilter: "blur(20px)",
        border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "0 8px", zIndex: 99999,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
        isolation: "isolate",
      }}
    >
      {items.map((it) => {
        const active = page === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setPage(it.key)}
            data-testid={`bottom-nav-${it.key}`}
            aria-label={it.label}
            style={{
              flex: 1, height: 50, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              borderRadius: 999,
              background: active ? `${T.purple}22` : "transparent",
              transition: "background 0.2s ease",
            }}
          >
            <span style={{ fontSize: 18, filter: active ? "none" : "grayscale(0.3)" }}>{it.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: active ? T.purple : T.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ===== SearchFAB =====
export const SearchFAB = ({ onClick, T }) => (
  <button
    onClick={onClick}
    data-testid="search-fab"
    aria-label="Open universal search"
    className="genvo-pulse"
    style={{
      position: "fixed", bottom: 102, right: 18, zIndex: 99998,
      width: 54, height: 54, borderRadius: 999,
      background: T.green, color: "#fff", fontSize: 22,
      border: `2px solid ${T.surface}`,
      boxShadow: "0 6px 18px rgba(46,204,154,0.4)",
    }}
  >🔍</button>
);

// ===== SearchModal =====
export const SearchModal = ({ open, onClose, onSelectWord, allWords, T, onAddCustom }) => {
  const [q, setQ] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setQ(""); setAiResult(null); setError(""); } }, [open]);

  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const matches = ql ? allWords.filter(x => x.word.toLowerCase().includes(ql)).slice(0, 12) : [];
  const exactMatch = ql ? allWords.find(x => x.word.toLowerCase() === ql) : null;

  const runAi = async () => {
    setLoading(true); setError("");
    try {
      const r = await aiLookup(q.trim());
      if (r?.data) {
        const wordObj = {
          ...r.data,
          id: `ai-${Date.now()}`,
          isAi: true,
          category: r.data.period || "AI",
        };
        setAiResult(wordObj);
      } else setError("AI returned no data.");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "AI lookup failed.");
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} data-testid="search-modal-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 100000, background: T.overlay, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        className="genvo-fade-in"
        data-testid="search-modal"
        style={{ width: "100%", maxWidth: 540, marginTop: 36, background: T.surface,
          borderRadius: 24, border: `2px solid ${T.border}`, padding: 18, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>🔍</div>
          <input
            data-testid="search-input"
            autoFocus
            placeholder="Search any word..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setAiResult(null); }}
            style={{ flex: 1, padding: "12px 14px", borderRadius: 14,
              background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 16 }}
          />
          <button onClick={onClose} data-testid="search-close-btn"
            style={{ width: 38, height: 38, borderRadius: 999, background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 16 }}>✕</button>
        </div>

        {ql && matches.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>In Library</div>
            {matches.map(m => (
              <button key={m.id} data-testid={`search-result-${m.id}`}
                onClick={() => { onSelectWord(m); onClose(); }}
                style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, color: T.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
                <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 18, fontStyle: "italic", fontWeight: 600 }}>{m.word}</span>
                <span style={{ marginLeft: "auto", color: T.muted, fontSize: 12 }}>{m.difficulty}</span>
              </button>
            ))}
          </div>
        )}

        {ql && !exactMatch && !aiResult && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: T.card, border: `1.5px dashed ${T.border}`, textAlign: "center" }}>
            <div style={{ color: T.text, marginBottom: 10 }}>No exact match for <strong>"{q}"</strong>.</div>
            <button
              onClick={runAi}
              data-testid="ai-lookup-btn"
              disabled={loading}
              style={{ padding: "10px 18px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 14 }}
            >{loading ? "🤖 Thinking..." : "🤖 Search with AI"}</button>
            {error && <div style={{ color: T.red, marginTop: 8, fontSize: 13 }}>{error}</div>}
          </div>
        )}

        {aiResult && (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: T.card, border: `2px solid ${T.purple}55` }}>
            <div style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, background: `${T.purple}26`, color: T.purple, fontSize: 10, fontWeight: 800, marginBottom: 8 }}>🤖 AI GENERATED</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 36 }}>{aiResult.emoji || "✨"}</div>
              <div>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 26, fontWeight: 700, fontStyle: "italic", color: T.text }}>{aiResult.word}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>/{aiResult.pronunciation}/ · {aiResult.difficulty}</div>
              </div>
            </div>
            <div style={{ color: T.text, marginTop: 10, fontSize: 14 }}>{aiResult.meanings?.formal}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={() => speak(aiResult.word)} data-testid="ai-result-hear" style={{ padding: "6px 12px", borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13 }}>🔊 Hear</button>
              <button onClick={() => { onSelectWord(aiResult); onClose(); }} data-testid="ai-result-open" style={{ padding: "6px 12px", borderRadius: 999, background: T.purple, color: "#fff", fontSize: 13, fontWeight: 700 }}>Open Card</button>
              <button onClick={() => { onAddCustom(aiResult); }} data-testid="ai-result-add" style={{ padding: "6px 12px", borderRadius: 999, background: `${T.green}26`, color: T.green, border: `1px solid ${T.green}55`, fontSize: 13, fontWeight: 700 }}>➕ Add to My Words</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== EditAccountModal =====
export const EditAccountModal = ({ open, user, onClose, onSave, onLogout, T }) => {
  const [name, setName] = useState(user?.name || "");
  const [icon, setIcon] = useState(user?.icon || "🦊");
  useEffect(() => { if (open) { setName(user?.name || ""); setIcon(user?.icon || "🦊"); } }, [open, user]);

  if (!open) return null;
  return (
    <div onClick={onClose} data-testid="edit-account-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 100000, background: T.overlay, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="genvo-pop" data-testid="edit-account-modal"
        style={{ width: "100%", maxWidth: 460, background: T.surface, borderRadius: 24, border: `2px solid ${T.border}`, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: T.card, border: `2px solid ${T.purple}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{icon}</div>
        </div>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Pick Icon</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {ICONS.map((ic, i) => (
            <button key={i} onClick={() => setIcon(ic)} data-testid={`icon-pick-${i}`}
              style={{ height: 52, borderRadius: 14, background: icon === ic ? `${T.purple}26` : T.card, border: `2px solid ${icon === ic ? T.purple : T.border}`, fontSize: 24 }}>{ic}</button>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Name</div>
          <input data-testid="edit-name-input" value={name} onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Email</div>
          <input data-testid="edit-email-input" value={user?.email || ""} disabled
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: T.card, border: `1.5px solid ${T.border}`, color: T.muted, fontSize: 15, opacity: 0.65 }} />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button data-testid="edit-save-btn" onClick={() => { onSave({ name, icon }); }}
            style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 700, fontSize: 14 }}>Save Changes</button>
          <button data-testid="edit-cancel-btn" onClick={onClose}
            style={{ padding: "12px 14px", borderRadius: 14, background: T.card, color: T.text, fontWeight: 700, fontSize: 14, border: `1px solid ${T.border}` }}>Cancel</button>
        </div>
        <button data-testid="edit-logout-btn" onClick={onLogout}
          style={{ width: "100%", marginTop: 12, padding: "12px 14px", borderRadius: 14, background: `${T.red}1f`, color: T.red, border: `1.5px solid ${T.red}66`, fontWeight: 700, fontSize: 14 }}>Log Out</button>
      </div>
    </div>
  );
};

// ===== RewardModal =====
export const RewardModal = ({ open, milestone, onClose, T }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} data-testid="reward-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 100001, background: T.overlay, backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} data-testid="reward-modal" className="genvo-pop"
        style={{ width: "100%", maxWidth: 380, background: T.surface, borderRadius: 28, border: `3px solid ${T.gold}`, padding: 26, textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 8 }}>🏆</div>
        <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 26, fontWeight: 700, color: T.text, fontStyle: "italic" }}>Milestone Unlocked!</div>
        <div style={{ color: T.muted, fontSize: 15, marginTop: 6 }}>You've learnt <strong style={{ color: T.gold }}>{milestone}</strong> words!</div>
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 999, display: "inline-block", background: `${T.gold}22`, color: T.gold, fontWeight: 800, border: `1px solid ${T.gold}66` }}>+50 BONUS XP</div>
        <div style={{ marginTop: 14, color: T.text, fontSize: 14 }}>Keep Learning! 🚀</div>
        <button onClick={onClose} data-testid="reward-close-btn"
          style={{ marginTop: 18, padding: "10px 22px", borderRadius: 999, background: T.purple, color: "#fff", fontWeight: 700 }}>Continue</button>
      </div>
    </div>
  );
};

// ===== XPToast =====
export const XPToast = ({ toasts, T }) => (
  <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100002, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
    {toasts.map((t) => (
      <div key={t.id} data-testid={`xp-toast-${t.id}`} className="genvo-slide-down"
        style={{ background: T.green, color: "#fff", padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontSize: 14, boxShadow: "0 6px 18px rgba(46,204,154,0.4)" }}>
        ⚡ +{t.amount} XP {t.label ? `· ${t.label}` : ""}
      </div>
    ))}
  </div>
);
