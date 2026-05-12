// GENVO — PronunciationCheck component (full + compact modes)
// Uses MediaRecorder → backend /api/transcribe to bypass Brave Shields
import React, { useState } from "react";
import { speak } from "../../lib/helpers";
import { WordExplanationBlock } from "./Modals";
import { api } from "../../lib/api-client";

// ── Levenshtein score ──
const calcLevenshteinScore = (spoken, target) => {
  const a = (spoken || "").toLowerCase().trim();
  const b = (target || "").toLowerCase().trim();
  if (a === b) return 100;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 100;
  let costs = Array.from({ length: shorter.length + 1 }, (_, i) => i);
  for (let i = 1; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 1; j <= shorter.length; j++) {
      const newValue =
        longer[i - 1] === shorter[j - 1]
          ? costs[j - 1]
          : Math.min(costs[j - 1] + 1, Math.min(lastValue + 1, costs[j] + 1));
      costs[j - 1] = lastValue;
      lastValue = newValue;
    }
    costs[shorter.length] = lastValue;
  }
  return Math.round((1 - costs[shorter.length] / longer.length) * 100);
};

// ── Syllable splitter ──
const splitSyllables = (word) => {
  const vowels = "aeiouAEIOU";
  const syllables = [];
  let current = "";
  for (let i = 0; i < word.length; i++) {
    current += word[i];
    const isVowel = vowels.includes(word[i]);
    const nextIsConsonant = i < word.length - 1 && !vowels.includes(word[i + 1]);
    if (isVowel && nextIsConsonant && i < word.length - 2) {
      syllables.push(current);
      current = "";
    }
  }
  if (current) syllables.push(current);
  return syllables.length > 1 ? syllables : [word];
};

// ── Score tier helper ──
const getTier = (score) => {
  if (score === 100) return { label: "🌟 Flawless! Perfect pronunciation!", color: "#f5c842", accepted: true,  xp: 20 };
  if (score >= 90)  return { label: "🎉 Excellent! Native level!",          color: "#2ecc9a", accepted: true,  xp: 20 };
  if (score >= 80)  return { label: "✅ Accepted! Great effort!",            color: "#2ecc9a", accepted: true,  xp: 15 };
  if (score >= 65)  return { label: "👏 Close! One more try",                color: "#f97316", accepted: false, xp: 0  };
  if (score >= 40)  return { label: "😊 Getting there! Listen and retry",   color: "#f97316", accepted: false, xp: 0  };
  return                    { label: "💪 Keep practising! Use slow mode first", color: "#ff5566", accepted: false, xp: 0 };
};

// ── Syllable match helper ──
const getSyllableResults = (spokenWord, targetWord) => {
  const spokenSyls = splitSyllables(spokenWord || "");
  const targetSyls = splitSyllables(targetWord || "");
  return targetSyls.map((syl, i) => {
    const spokenSyl = spokenSyls[i] || "";
    const matchScore = calcLevenshteinScore(spokenSyl, syl);
    return { syllable: syl, matched: matchScore >= 70 };
  });
};

// ── Mistake tip builder ──
const buildTip = (spoken, wordObj) => {
  const tips = [];
  const syls = splitSyllables(wordObj.word || "");
  const stressedSyl = syls.reduce((a, b) => (a.length >= b.length ? a : b));
  tips.push(`You said "${spoken}" — focus on the stressed part: "${stressedSyl.toUpperCase()}"`);
  tips.push(`Try it slowly: ${syls.join("-")}`);
  tips.push(`The correct pronunciation is: /${wordObj.pronunciation}/`);
  if (wordObj.origin) tips.push(`This word comes from ${wordObj.origin} — knowing the origin helps`);
  return tips;
};

// ── Record audio using MediaRecorder → returns {blob, mimeType} ──
const recordAudio = (durationMs = 4000) =>
  new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const chunks = [];
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve({ blob: new Blob(chunks, { type: mimeType }), mimeType });
        };
        recorder.onerror = (e) => { stream.getTracks().forEach((t) => t.stop()); reject(e); };
        recorder.start();
        setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, durationMs);
      })
      .catch(reject);
  });

// ── Blob → base64 string ──
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // result is "data:<mime>;base64,<data>" — strip the prefix
      const b64 = reader.result.split(",")[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });


// ═══════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════
export default function PronunciationCheck({
  word,
  onScore,
  onAccepted,
  onLearnt,
  onBookmark,
  onNext,
  compact = false,
  T,
}) {
  const [listening, setListening]             = useState(false);
  const [transcript, setTranscript]           = useState("");
  const [score, setScore]                     = useState(null);
  const [accepted, setAccepted]               = useState(false);
  const [attempts, setAttempts]               = useState(0);
  const [feedback, setFeedback]               = useState([]);
  const [tier, setTier]                       = useState(null);
  const [micError, setMicError]               = useState("");
  const [syllableResults, setSyllableResults] = useState([]);
  const [countdown, setCountdown]             = useState(null);


  const resetPronunciation = () => {
    setScore(null);
    setTranscript("");
    setTier(null);
    setFeedback([]);
    setSyllableResults([]);
    setAccepted(false);
    setMicError("");
    setCountdown(null);
    // Do NOT reset attempts
  };

  const startListening = async () => {
    setMicError("");
    setTranscript("");
    setScore(null);
    setTier(null);
    setFeedback([]);
    setSyllableResults([]);
    setListening(true);
    setCountdown(4);

    // Countdown timer
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(tick); return 0; }
        return c - 1;
      });
    }, 1000);

    try {
      // Step 1: Record 4 seconds via MediaRecorder (works natively in Brave)
      const { blob, mimeType } = await recordAudio(4000);
      clearInterval(tick);
      setCountdown(null);

      // Step 2: Convert blob to base64
      const base64Audio = await blobToBase64(blob);

      // Step 3: Send to backend for Gemini-powered transcription
      const res = await api.post("/transcribe", { audio: base64Audio, mimeType });
      const json = res.data;
      const bestTranscript = (json.transcript || "").trim();

      const bestScore = calcLevenshteinScore(bestTranscript, word.word);
      const t = getTier(bestScore);
      const syls = getSyllableResults(bestTranscript, word.word);

      setTranscript(bestTranscript || "(no speech detected)");
      setScore(bestScore);
      setTier(t);
      setSyllableResults(syls);
      setAttempts((a) => a + 1);
      setListening(false);

      if (t.accepted) {
        setAccepted(true);
        onScore && onScore(bestScore);
        onAccepted && onAccepted(word, t.xp);
      } else {
        setFeedback(buildTip(bestTranscript || "(no speech)", word));
      }
    } catch (err) {
      clearInterval(tick);
      setListening(false);
      setCountdown(null);
      const msg = err?.message || "";
      if (msg.includes("Permission") || msg.includes("NotAllowed") || msg.includes("denied"))
        setMicError("Microphone access denied. Allow mic in Brave: address bar → 🔒 → Microphone → Allow.");
      else if (msg.includes("NotFound") || msg.includes("Requested device not found"))
        setMicError("No microphone found. Please connect a microphone and try again.");
      else
        setMicError(`Recording failed: ${msg || "unknown error"}`);
    }
  };

  // ══════════════════════════════════════════
  // COMPACT version (Flashcards / Dictionary / Modal)
  // ══════════════════════════════════════════
  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Word + pronunciation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ fontWeight: 700, color: T.text }}>{word.word}</span>
            <span style={{ color: T.muted, fontSize: 13, marginLeft: 8 }}>/{word.pronunciation}/</span>
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>
            Syllables: {splitSyllables(word.word).join(" · ")}
          </div>
        </div>

        {/* Listen + check buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => speak(word.word)}
            style={{ padding: "7px 14px", background: `${T.purple}22`, border: `1px solid ${T.purple}44`, borderRadius: 9, color: T.purple, cursor: "pointer", fontSize: 12 }}>
            🔊 Normal
          </button>
          <button onClick={() => speak(word.word, true)}
            style={{ padding: "7px 14px", background: `${T.purple}22`, border: `1px solid ${T.purple}44`, borderRadius: 9, color: T.purple, cursor: "pointer", fontSize: 12 }}>
            🐢 Slow
          </button>
          {!accepted && (
            <button onClick={startListening} disabled={listening}
              style={{ flex: 1, padding: "7px 14px",
                background: listening ? T.border : `linear-gradient(135deg,${T.pink},${T.purple})`,
                border: "none", borderRadius: 9, color: "#fff",
                cursor: listening ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12 }}>
              {listening ? "🎙️ Listening..." : "🎤 Check"}
            </button>
          )}
        </div>

        {/* Compact result */}
        {score !== null && tier && (
          <div style={{ padding: "10px 14px", background: `${tier.color}15`, border: `1px solid ${tier.color}50`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ color: tier.color, fontWeight: 700, fontSize: 13 }}>{tier.label}</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>You said: "{transcript}"</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: tier.color, flexShrink: 0 }}>{score}%</div>
          </div>
        )}

        {/* Retry / accepted */}
        {score !== null && !accepted && (
          <button onClick={startListening}
            style={{ padding: "8px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 9, color: T.muted, cursor: "pointer", fontSize: 12 }}>
            🔄 Try Again
          </button>
        )}
        {accepted && (
          <div style={{ padding: "8px 12px", background: `${T.green}18`, border: `1px solid ${T.green}44`, borderRadius: 9, color: T.green, fontWeight: 700, fontSize: 13, textAlign: "center" }}>
            ✅ Accepted! {score}% · +{tier?.xp} XP
          </div>
        )}

        {micError && (
          <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: `${T.red}12`, border: `1px solid ${T.red}30`, borderRadius: 9 }}>
            ⚠️ {micError}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // FULL version (Practice page)
  // ══════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── STEP 1: Before any attempt ── */}
      {score === null && !listening && (
        <>
          {/* Word display */}
          <div style={{ textAlign: "center", padding: "20px 16px",
            background: `linear-gradient(135deg,${T.card},${T.surface})`,
            border: `1.5px solid ${T.purple}55`, borderRadius: 18 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{word.emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: T.text, fontFamily: "'Crimson Pro','Georgia',serif", letterSpacing: -0.5 }}>
              {word.word}
            </div>
            <div style={{ color: T.muted, fontSize: 15, marginTop: 4 }}>/{word.pronunciation}/</div>
            <div style={{ marginTop: 12, fontSize: 14, color: T.purple, fontWeight: 600 }}>
              Syllables:{" "}
              {splitSyllables(word.word).map((s, i, arr) => (
                <span key={i}>
                  <span style={{ fontWeight: i === 0 ? 900 : 400, color: i === 0 ? T.purple : T.text }}>{s}</span>
                  {i < arr.length - 1 && <span style={{ color: T.muted, margin: "0 3px" }}>·</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Threshold info */}
          <div style={{ padding: "10px 14px", background: `${T.purple}12`, border: `1px solid ${T.purple}30`, borderRadius: 12, textAlign: "center" }}>
            <span style={{ color: T.muted, fontSize: 13 }}>
              Acceptance threshold: <strong style={{ color: T.purple }}>80% or above</strong>
              {attempts > 0 && <span> · Attempt #{attempts + 1}</span>}
            </span>
          </div>

          {/* Listen buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => speak(word.word)}
              style={{ padding: "11px 22px", background: `${T.purple}22`, border: `1px solid ${T.purple}55`, borderRadius: 12, color: T.purple, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              🔊 Hear Normal
            </button>
            <button onClick={() => speak(word.word, true)}
              style={{ padding: "11px 22px", background: `${T.purple}22`, border: `1px solid ${T.purple}55`, borderRadius: 12, color: T.purple, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              🐢 Hear Slowly
            </button>
          </div>

          {micError && (
            <div style={{ padding: "10px 14px", background: `${T.red}12`, border: `1px solid ${T.red}44`, borderRadius: 12, color: T.red, fontSize: 13 }}>
              ⚠️ {micError}
            </div>
          )}

          {/* Start button */}
          <button onClick={startListening} data-testid="pron-record-btn"
            style={{ padding: "16px", background: `linear-gradient(135deg,${T.pink},${T.purple})`, border: "none", borderRadius: 14, color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 17, boxShadow: `0 4px 20px ${T.purple}44` }}>
            🎤 Start Speaking
          </button>
        </>
      )}

      {/* ── STEP 2: While recording ── */}
      {listening && (
        <div style={{ textAlign: "center", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${T.pink},${T.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: `0 0 30px ${T.pink}66`, transition: "box-shadow 0.3s" }}>
            🎙️
          </div>
          {countdown !== null && countdown > 0 && (
            <div style={{ fontSize: 36, fontWeight: 900, color: T.pink, lineHeight: 1 }}>{countdown}</div>
          )}
          <div style={{ color: T.pink, fontWeight: 700, fontSize: 16 }}>Listening... speak now</div>
          <div style={{ color: T.muted, fontSize: 13 }}>
            Say: <strong style={{ color: T.text }}>&#34;{word.word}&#34;</strong>
          </div>
          <div style={{ color: T.muted, fontSize: 12 }}>Recording stops automatically after 4 seconds</div>
        </div>
      )}

      {/* ── STEP 3: Verification panel ── */}
      {score !== null && tier && (
        <>
          {/* Score badge */}
          <div style={{ padding: "18px 20px", textAlign: "center", background: `${tier.color}18`, border: `2px solid ${tier.color}66`, borderRadius: 16 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: tier.color }}>{score}%</div>
            <div style={{ color: tier.color, fontWeight: 700, fontSize: 15, marginTop: 6 }}>{tier.label}</div>
            {tier.accepted && (
              <div style={{ marginTop: 8, padding: "4px 16px", background: `${tier.color}22`, borderRadius: 20, display: "inline-block", color: tier.color, fontWeight: 700, fontSize: 13 }}>
                +{tier.xp} XP earned!
              </div>
            )}
          </div>

          {/* You said vs Target */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>YOU SAID</div>
              <div style={{ color: T.text, fontSize: 15, fontWeight: 600, fontStyle: "italic" }}>"{transcript}"</div>
            </div>
            <div style={{ padding: "12px 14px", background: T.surface, border: `1px solid ${T.purple}44`, borderRadius: 12 }}>
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TARGET</div>
              <div style={{ color: T.purple, fontSize: 15, fontWeight: 700, fontFamily: "'Crimson Pro','Georgia',serif" }}>{word.word}</div>
              <div style={{ color: T.muted, fontSize: 12 }}>/{word.pronunciation}/</div>
            </div>
          </div>

          {/* Syllable breakdown */}
          <div style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>SYLLABLE BREAKDOWN</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {syllableResults.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ padding: "8px 14px", background: s.matched ? `${T.green}22` : `${T.red}22`, border: `2px solid ${s.matched ? T.green : T.red}`, borderRadius: 10, color: s.matched ? T.green : T.red, fontWeight: 800, fontSize: 15, fontFamily: "'Crimson Pro','Georgia',serif" }}>
                    {s.syllable}
                  </div>
                  <div style={{ fontSize: 14 }}>{s.matched ? "🟢" : "🔴"}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>🟢 matched well &nbsp;·&nbsp; 🔴 needs work</div>
          </div>

          {/* Mistake tips */}
          {!tier.accepted && Array.isArray(feedback) && feedback.length > 0 && (
            <div style={{ padding: "14px 16px", background: `${T.gold}12`, border: `1px solid ${T.gold}44`, borderRadius: 12 }}>
              <div style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>❗ TIPS TO IMPROVE</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {feedback.map((tip, i) => (
                  <div key={i} style={{ color: T.text, fontSize: 13, lineHeight: 1.55, display: "flex", gap: 8 }}>
                    <span style={{ color: T.gold, flexShrink: 0 }}>•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attempt counter */}
          <div style={{ textAlign: "center", color: T.muted, fontSize: 12 }}>
            Attempt #{attempts} · Threshold: 80%
          </div>

          {/* Word explanation */}
          <WordExplanationBlock word={word} T={T} />

          {/* Action buttons */}
          {!tier.accepted ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => speak(word.word)}
                style={{ flex: 1, padding: "11px", background: `${T.purple}22`, border: `1px solid ${T.purple}44`, borderRadius: 11, color: T.purple, cursor: "pointer", fontSize: 13 }}>
                🔊 Hear Again
              </button>
              <button onClick={() => speak(word.word, true)}
                style={{ flex: 1, padding: "11px", background: `${T.purple}22`, border: `1px solid ${T.purple}44`, borderRadius: 11, color: T.purple, cursor: "pointer", fontSize: 13 }}>
                🐢 Slow
              </button>
              <button onClick={startListening} data-testid="pron-retry-btn"
                style={{ flex: 2, padding: "11px", background: `linear-gradient(135deg,${T.pink},${T.purple})`, border: "none", borderRadius: 11, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                🎤 Try Again
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "14px", textAlign: "center", background: `${T.green}18`, border: `1.5px solid ${T.green}55`, borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>🎉</div>
                <div style={{ color: T.green, fontWeight: 800, fontSize: 16 }}>Pronunciation Accepted!</div>
                <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{score}% accuracy · +{tier.xp} XP</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => speak(word.word)}
                  style={{ flex: 1, padding: "10px", background: `${T.purple}22`, border: `1px solid ${T.purple}44`, borderRadius: 10, color: T.purple, cursor: "pointer", fontSize: 13 }}>
                  🔊 Hear
                </button>
                {onLearnt && (
                  <button onClick={() => onLearnt(word)}
                    style={{ flex: 1, padding: "10px", background: `${T.green}22`, border: `1px solid ${T.green}44`, borderRadius: 10, color: T.green, cursor: "pointer", fontSize: 13 }}>
                    ✅ Learnt
                  </button>
                )}
                {onBookmark && (
                  <button onClick={() => onBookmark(word)}
                    style={{ flex: 1, padding: "10px", background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 10, color: T.gold, cursor: "pointer", fontSize: 13 }}>
                    📌 Save
                  </button>
                )}
              </div>
              {onNext && (
                <button onClick={onNext}
                  style={{ padding: "12px", background: `linear-gradient(135deg,${T.green},${T.purple})`, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
                  Next Word →
                </button>
              )}
              <button onClick={resetPronunciation}
                style={{ padding: "9px", background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 10, color: T.muted, cursor: "pointer", fontSize: 12 }}>
                🔄 Practice Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
