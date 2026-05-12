// GENVO — Dashboard
import React from "react";

const ACHIEVEMENTS = [
  { key: "starter", icon: "🌱", label: "Starter", check: (s) => s.learned.length >= 1 },
  { key: "streak3", icon: "🔥", label: "Streak 3", check: (s) => s.streak >= 3 },
  { key: "quiz", icon: "🧠", label: "Quiz Master", check: (s) => s.xp >= 200 },
  { key: "v10", icon: "👑", label: "Vocab 10", check: (s) => s.learned.length >= 10 },
  { key: "v20", icon: "🏆", label: "Vocab 20", check: (s) => s.learned.length >= 20 },
  { key: "book", icon: "📖", label: "Bookworm", check: (s) => s.bookmarks.length >= 5 },
  { key: "ai", icon: "🤖", label: "AI Explorer", check: (s) => s.customWords.length >= 1 },
];

const Stat = ({ icon, label, value, T, color, testid }) => (
  <div data-testid={testid} style={{ padding: 14, borderRadius: 18, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div style={{ marginTop: 6, color: T.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
    <div style={{ marginTop: 4, fontFamily: "'Outfit'", fontSize: 28, fontWeight: 800, color: color || T.text }}>{value}</div>
  </div>
);

export default function Dashboard({ user, xp, streak, learned, bookmarks, customWords, allWords, onEditAccount, onRemoveCustom, onBookmark, onOpenWord, T }) {
  const level = Math.floor(xp / 100) + 1;
  const nextRewardAt = [10, 20, 30, 40, 50].find((m) => learned.length < m) || 60;
  const recent = learned.slice(-8).reverse().map(id => allWords.find(w => w.id === id)).filter(Boolean);
  const saved = bookmarks.slice().reverse().map(id => allWords.find(w => w.id === id)).filter(Boolean);

  return (
    <div data-testid="dashboard-page" style={{ padding: "16px 16px 130px", maxWidth: 720, margin: "0 auto" }}>
      {/* Profile card */}
      <div style={{ padding: 18, borderRadius: 22, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 72, height: 72, borderRadius: 999, background: T.surface, border: `2px solid ${T.purple}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{user?.icon || "🦊"}</div>
        <div style={{ flex: 1 }}>
          <div data-testid="dash-username" style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 20, color: T.text }}>{user?.name || "Learner"}</div>
          <div style={{ color: T.muted, fontSize: 12 }}>{user?.email || "—"}</div>
        </div>
        <button data-testid="dash-edit-btn" onClick={onEditAccount}
          style={{ padding: "8px 12px", borderRadius: 999, background: T.surface, color: T.text, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700 }}>✏️ Edit</button>
      </div>

      {/* 6-stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        <Stat T={T} icon="⚡" label="XP" value={xp} color={T.purple} testid="stat-xp" />
        <Stat T={T} icon="🔥" label="Streak" value={streak} color={T.red} testid="stat-streak" />
        <Stat T={T} icon="📚" label="Learnt" value={learned.length} color={T.green} testid="stat-learnt" />
        <Stat T={T} icon="🔖" label="Saved" value={bookmarks.length} color={T.gold} testid="stat-saved" />
        <Stat T={T} icon="🏆" label="Level" value={level} color={T.purple} testid="stat-level" />
        <Stat T={T} icon="🎁" label="To Next" value={Math.max(nextRewardAt - learned.length, 0)} color={T.pink} testid="stat-tonext" />
      </div>

      {/* Reward milestones */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>🎁 Reward Milestones</div>
        {[10, 20, 30, 40, 50].map(m => {
          const unlocked = learned.length >= m;
          return (
            <div key={m} data-testid={`milestone-${m}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: T.card, border: `1px solid ${unlocked ? T.gold : T.border}`, marginBottom: 6 }}>
              <div style={{ fontSize: 18 }}>{unlocked ? "🏅" : "🔒"}</div>
              <div style={{ flex: 1, color: unlocked ? T.gold : T.muted, fontWeight: 700, fontSize: 14 }}>Learn {m} words</div>
              <div style={{ color: T.muted, fontSize: 12 }}>{Math.min(learned.length, m)}/{m}</div>
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>🏆 Achievements</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check({ learned, bookmarks, streak, xp, customWords });
            return (
              <div key={a.key} data-testid={`ach-${a.key}`} style={{ padding: 12, borderRadius: 14, background: T.card, border: `1.5px solid ${unlocked ? T.purple : T.border}`, textAlign: "center", opacity: unlocked ? 1 : 0.5 }}>
                <div style={{ fontSize: 26, filter: unlocked ? "none" : "grayscale(0.8)" }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: unlocked ? T.purple : T.muted, marginTop: 4 }}>{a.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently learnt */}
      {recent.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>📖 Recently Learnt</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {recent.map(w => (
              <span key={w.id} data-testid={`recent-${w.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: `${T.green}1f`, color: T.green, fontSize: 12, fontWeight: 700, border: `1px solid ${T.green}55` }}>
                <span>{w.emoji}</span><span>{w.word}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Saved (bookmarked) Words */}
      {saved.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>🔖 Saved Words</div>
            <div style={{ fontSize: 11, color: T.muted }}>{saved.length} saved</div>
          </div>
          {saved.map(w => (
            <div key={w.id} data-testid={`saved-${w.id}`}
              style={{ marginBottom: 8, padding: 12, borderRadius: 14, background: T.card, border: `1.5px solid ${T.gold}66`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 24 }}>{w.emoji}</div>
              <button
                onClick={() => onOpenWord && onOpenWord(w)}
                data-testid={`saved-open-${w.id}`}
                style={{ flex: 1, textAlign: "left", color: T.text }}
              >
                <div style={{ fontFamily: "'Crimson Pro', serif", fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>{w.word}</div>
                <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {(w.meanings?.formal || w.meaning || "").slice(0, 80)}
                </div>
              </button>
              <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: `${T.gold}26`, color: T.gold, border: `1px solid ${T.gold}55` }}>
                {w.difficulty || "—"}
              </span>
              <button
                data-testid={`saved-remove-${w.id}`}
                onClick={() => onBookmark && onBookmark(w)}
                aria-label="Remove bookmark"
                style={{ width: 30, height: 30, borderRadius: 999, background: `${T.red}1f`, color: T.red, border: `1px solid ${T.red}55`, fontSize: 12 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* My Words */}
      {customWords.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>🤖 My Words</div>
          {customWords.map(w => (
            <div key={w.id} data-testid={`mywords-${w.id}`} style={{ marginBottom: 8, padding: 12, borderRadius: 14, background: T.card, border: `1.5px solid ${T.purple}55`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>{w.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontStyle: "italic", fontWeight: 700, color: T.text }}>{w.word}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{(w.meanings?.formal || w.meaning || "").slice(0, 70)}...</div>
              </div>
              <button data-testid={`mywords-remove-${w.id}`} onClick={() => onRemoveCustom(w)}
                style={{ width: 30, height: 30, borderRadius: 999, background: `${T.red}1f`, color: T.red, border: `1px solid ${T.red}55`, fontSize: 12 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
