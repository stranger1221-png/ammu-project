// GENVO — Modern responsive Auth screens (Sign In / Sign Up / Forgot / Reset)
import React, { useState } from "react";
import { useAuth, formatApiError } from "../../lib/auth";

const ICONS = ["🦊", "🐼", "🦁", "🐸", "🦋", "🌸", "🔥", "⚡", "🎯", "🌙", "👑", "🎨", "🚀", "🌊", "🦉", "🍀", "🎭", "🏆"];

const Field = ({ label, T, ...props }) => (
  <label style={{ display: "block", marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>{label}</div>
    <input
      {...props}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: 14,
        background: T.surface, border: `1.5px solid ${T.border}`,
        color: T.text, fontSize: 15, fontFamily: "inherit",
        ...(props.style || {}),
      }}
    />
  </label>
);

const PrimaryBtn = ({ children, T, loading, ...rest }) => (
  <button
    {...rest}
    disabled={loading || rest.disabled}
    style={{
      width: "100%", padding: "13px 14px", borderRadius: 14,
      background: T.purple, color: "#fff", fontWeight: 800, fontSize: 15,
      opacity: loading || rest.disabled ? 0.6 : 1,
      transition: "transform 0.15s ease",
    }}
  >
    {loading ? "Please wait..." : children}
  </button>
);

const Tab = ({ label, active, onClick, T, testid }) => (
  <button
    onClick={onClick}
    data-testid={testid}
    style={{
      flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 800,
      letterSpacing: 0.5,
      background: active ? T.surface : "transparent",
      color: active ? T.purple : T.muted,
      border: `1.5px solid ${active ? T.purple : "transparent"}`,
      transition: "all 0.18s ease",
    }}
  >{label}</button>
);

export default function Auth({ T }) {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const [tab, setTab] = useState("signin"); // signin | signup | forgot | reset
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);

  // Signup-only
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🦊");

  // Reset-only
  const [resetToken, setResetToken] = useState("");
  const [resetPwd, setResetPwd] = useState("");

  const switchTab = (t) => {
    setTab(t); setError(""); setSuccess("");
  };

  const handleSignIn = async () => {
    setBusy(true); setError(""); setSuccess("");
    try {
      await login({ email: email.trim().toLowerCase(), password, remember });
    } catch (e) {
      setError(formatApiError(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const handleSignUp = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      await register({ email: email.trim().toLowerCase(), password, name: name.trim(), icon, remember });
    } catch (e) {
      setError(formatApiError(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const handleForgot = async () => {
    setBusy(true); setError(""); setSuccess("");
    try {
      const r = await forgotPassword(email.trim().toLowerCase());
      if (r?.reset_token) {
        setResetToken(r.reset_token);
        setSuccess("✅ A reset link was generated. Use the token below to set a new password.");
        setTab("reset");
      } else {
        setSuccess("If an account exists for that email, a reset link has been sent.");
      }
    } catch (e) {
      setError(formatApiError(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const handleReset = async () => {
    if (resetPwd.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      await resetPassword({ token: resetToken.trim(), password: resetPwd });
      setSuccess("Password reset! You can now sign in.");
      setTimeout(() => switchTab("signin"), 1200);
    } catch (e) {
      setError(formatApiError(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  return (
    <div data-testid="auth-page" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, background: T.bgGradient || T.bg, color: T.text,
    }}>
      <div className="genvo-fade-in" style={{
        width: "100%", maxWidth: 460, background: T.surface, borderRadius: 28,
        border: `2px solid ${T.border}`, padding: 28, boxShadow: T.shadow,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
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
          <div style={{ color: T.muted, fontSize: 13, marginTop: 2, textAlign: "center" }}>
            {tab === "signin" && "Welcome back. Sign in to continue."}
            {tab === "signup" && "Create your account. Start learning today."}
            {tab === "forgot" && "Reset your password."}
            {tab === "reset" && "Set a new password."}
          </div>
        </div>

        {/* Tabs */}
        {(tab === "signin" || tab === "signup") && (
          <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 18 }}>
            <Tab label="Sign In" active={tab === "signin"} onClick={() => switchTab("signin")} T={T} testid="tab-signin" />
            <Tab label="Sign Up" active={tab === "signup"} onClick={() => switchTab("signup")} T={T} testid="tab-signup" />
          </div>
        )}

        {/* Sign In */}
        {tab === "signin" && (
          <div data-testid="signin-form">
            <Field T={T} label="Email" data-testid="signin-email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <div style={{ position: "relative" }}>
              <Field T={T} label="Password" data-testid="signin-password" type={showPwd ? "text" : "password"} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={(e) => { if (e.key === "Enter") handleSignIn(); }} />
              <button type="button" data-testid="signin-toggle-pwd" onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 12, top: 36, color: T.muted, fontSize: 12 }}>{showPwd ? "🙈" : "👁️"}</button>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: T.muted, fontSize: 13, cursor: "pointer" }}>
              <input data-testid="signin-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: T.purple }} />
              <span>Remember me on this device</span>
            </label>
            {error && <div data-testid="signin-error" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.red}1f`, color: T.red, fontSize: 13 }}>{error}</div>}
            <PrimaryBtn T={T} loading={busy} data-testid="signin-submit" onClick={handleSignIn}>Sign In →</PrimaryBtn>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <button data-testid="signin-forgot" onClick={() => switchTab("forgot")} style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* Sign Up */}
        {tab === "signup" && (
          <div data-testid="signup-form">
            <Field T={T} label="Name" data-testid="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Field T={T} label="Email" data-testid="signup-email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Field T={T} label="Password (min 6 chars)" data-testid="signup-password" type={showPwd ? "text" : "password"} autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Pick an avatar</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {ICONS.map((ic, i) => (
                  <button key={i} data-testid={`signup-icon-${i}`} onClick={() => setIcon(ic)} type="button"
                    style={{ height: 44, borderRadius: 12, background: icon === ic ? `${T.purple}26` : T.bg, border: `2px solid ${icon === ic ? T.purple : T.border}`, fontSize: 22 }}>{ic}</button>
                ))}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: T.muted, fontSize: 13, cursor: "pointer" }}>
              <input data-testid="signup-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: T.purple }} />
              <span>Stay signed in</span>
            </label>
            {error && <div data-testid="signup-error" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.red}1f`, color: T.red, fontSize: 13 }}>{error}</div>}
            <PrimaryBtn T={T} loading={busy} data-testid="signup-submit" onClick={handleSignUp}>Create Account ✨</PrimaryBtn>
          </div>
        )}

        {/* Forgot */}
        {tab === "forgot" && (
          <div data-testid="forgot-form">
            <Field T={T} label="Email" data-testid="forgot-email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <div data-testid="forgot-error" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.red}1f`, color: T.red, fontSize: 13 }}>{error}</div>}
            {success && <div data-testid="forgot-success" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.green}1f`, color: T.green, fontSize: 13 }}>{success}</div>}
            <PrimaryBtn T={T} loading={busy} data-testid="forgot-submit" onClick={handleForgot}>Send Reset Link</PrimaryBtn>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <button data-testid="forgot-back" onClick={() => switchTab("signin")} style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>← Back to sign in</button>
            </div>
          </div>
        )}

        {/* Reset */}
        {tab === "reset" && (
          <div data-testid="reset-form">
            <Field T={T} label="Reset Token" data-testid="reset-token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="paste token here" />
            <Field T={T} label="New Password (min 6 chars)" data-testid="reset-password" type="password"
              value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="••••••••" />
            {error && <div data-testid="reset-error" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.red}1f`, color: T.red, fontSize: 13 }}>{error}</div>}
            {success && <div data-testid="reset-success" style={{ padding: 10, marginBottom: 12, borderRadius: 12, background: `${T.green}1f`, color: T.green, fontSize: 13 }}>{success}</div>}
            <PrimaryBtn T={T} loading={busy} data-testid="reset-submit" onClick={handleReset}>Reset Password</PrimaryBtn>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <button data-testid="reset-back" onClick={() => switchTab("signin")} style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>← Back to sign in</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18, color: T.muted, fontSize: 11 }}>
          🔒 Encrypted, JWT-secured. Sign in once — your progress syncs across all your devices.
        </div>
      </div>
    </div>
  );
}
