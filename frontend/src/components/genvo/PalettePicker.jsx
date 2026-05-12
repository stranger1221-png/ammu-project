// GENVO — Palette Picker Modal: lets users override the theme with one of the
// curated palettes. Existing dark/light themes remain available via the ☀️/🌙 toggle.

import React from "react";
import { PALETTES } from "../../lib/helpers";

export default function PalettePicker({ open, paletteKey, onChange, onClose, T }) {
  if (!open) return null;
  const entries = Object.entries(PALETTES); // [key, palette]
  return (
    <div
      onClick={onClose}
      data-testid="palette-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        background: T.overlay, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="genvo-pop"
        data-testid="palette-modal"
        style={{
          width: "100%", maxWidth: 460, background: T.surface,
          borderRadius: 24, border: `2px solid ${T.border}`, padding: 22,
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 18, color: T.text }}>🎨 Color Palette</div>
            <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Pick a theme that suits your mood</div>
          </div>
          <button
            data-testid="palette-close-btn"
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 999, background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 16 }}
          >✕</button>
        </div>

        {/* Default option (uses dark/light toggle) */}
        <button
          data-testid="palette-default"
          onClick={() => { onChange(null); onClose(); }}
          style={{
            width: "100%", textAlign: "left", padding: 14, marginBottom: 10,
            borderRadius: 16,
            background: !paletteKey ? `${T.purple}1f` : T.card,
            border: `1.5px solid ${!paletteKey ? T.purple : T.border}`,
            color: T.text,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {["#1d0f3a", "#fdf6ff", "#7c5bf0", "#e85aa1"].map((c, i) => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: 6, background: c, border: `1px solid ${T.border}` }} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Default (Light / Dark)</div>
            <div style={{ color: T.muted, fontSize: 11 }}>Use the ☀️/🌙 toggle</div>
          </div>
          {!paletteKey && <span style={{ color: T.purple, fontWeight: 800 }}>✓</span>}
        </button>

        {entries.map(([key, p]) => {
          const active = paletteKey === key;
          return (
            <button
              key={key}
              data-testid={`palette-${key}`}
              onClick={() => { onChange(key); onClose(); }}
              style={{
                width: "100%", textAlign: "left", padding: 14, marginBottom: 10,
                borderRadius: 16,
                background: active ? `${T.purple}1f` : T.card,
                border: `1.5px solid ${active ? T.purple : T.border}`,
                color: T.text,
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              {/* Swatch row */}
              <div style={{ display: "flex", gap: 4 }}>
                {(p.swatch || []).map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 6, background: c, border: `1px solid ${T.border}` }} />
                ))}
              </div>
              {/* Name + mini preview band */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</div>
                <div
                  style={{
                    marginTop: 4, height: 8, borderRadius: 999,
                    background: p.bgGradient || p.bg,
                    border: `1px solid ${T.border}`,
                  }}
                />
              </div>
              {active && <span style={{ color: T.purple, fontWeight: 800 }}>✓</span>}
            </button>
          );
        })}

        <div style={{ marginTop: 6, color: T.muted, fontSize: 11, textAlign: "center" }}>
          Your palette syncs across all your devices.
        </div>
      </div>
    </div>
  );
}
