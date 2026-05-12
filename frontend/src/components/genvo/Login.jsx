// GENVO — Login (2 step: email -> name+icon)
import React, { useState } from "react";

const ICONS = ["🦊", "🐼", "🦁", "🐸", "🦋", "🌸", "🔥", "⚡", "🎯", "🌙", "👑", "🎨", "🚀", "🌊", "🦉", "🍀", "🎭", "🏆"];

export default function Login({ onLogin, T, isDark }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🦊");
  const [error, setError] = useState("");

  const submitEmail = () => {
    const v = email.trim().toLowerCase();
    if (!v.endsWith("@gmail.com")) {
      setError("Only @gmail.com addresses are accepted.");
      return;
    }
    setError("");
    setStep(2);
  };

  const submitProfile = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    onLogin({ email: email.trim().toLowerCase(), name: name.trim(), icon });
  };

  return (
    <div data-testid="login-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: T.bgGradient || T.bg, color: T.text }}>
      <div className="genvo-fade-in" style={{ width: "100%", maxWidth: 460, background: T.surface, borderRadius: 28, border: `2px solid ${T.border}`, padding: 28, boxShadow: T.shadow }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
          {/* GENVO icon — 🌻 */}
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 44, lineHeight: 1,
          }}>🌻</div>
          <div style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 38, fontWeight: 700, fontStyle: "italic",
            background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginTop: 8,
          }}>GENVO</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>Vocabulary, evolved.</div>
        </div>

        {step === 1 && (
          <div data-testid="login-step-1">
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Step 1 · Email</div>
            <input
              data-testid="login-email-input"
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitEmail(); }}
              placeholder="you@gmail.com"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15 }}
            />
            {error && <div data-testid="login-error" style={{ color: T.red, fontSize: 13, marginTop: 6 }}>{error}</div>}
            <button data-testid="login-continue-btn" onClick={submitEmail} disabled={!email.trim()}
              style={{ width: "100%", marginTop: 14, padding: "13px 14px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 800, fontSize: 15, opacity: !email.trim() ? 0.5 : 1 }}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div data-testid="login-step-2">
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Step 2 · Profile</div>
            <input
              data-testid="login-name-input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitProfile(); }}
              placeholder="Your name"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 15, marginBottom: 14 }}
            />
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Pick an avatar</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              {ICONS.map((ic, i) => (
                <button key={i} data-testid={`login-icon-${i}`} onClick={() => setIcon(ic)}
                  style={{ height: 56, borderRadius: 14, background: icon === ic ? `${T.purple}26` : T.card, border: `2px solid ${icon === ic ? T.purple : T.border}`, fontSize: 26 }}>{ic}</button>
              ))}
            </div>
            {error && <div data-testid="login-error-2" style={{ color: T.red, fontSize: 13, marginTop: 6, marginBottom: 6 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button data-testid="login-back-btn" onClick={() => setStep(1)}
                style={{ padding: "13px 14px", borderRadius: 14, background: T.card, color: T.text, border: `1px solid ${T.border}`, fontWeight: 700 }}>← Back</button>
              <button data-testid="login-finish-btn" onClick={submitProfile} disabled={!name.trim()}
                style={{ flex: 1, padding: "13px 14px", borderRadius: 14, background: T.purple, color: "#fff", fontWeight: 800, fontSize: 15, opacity: !name.trim() ? 0.5 : 1 }}>Start Learning ✨</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
