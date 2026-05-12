// Theme tokens, helpers, speech, levenshtein, tense lookup.

export const THEMES = {
  dark: {
    bg: "#07070f",
    bgGradient: "radial-gradient(1200px 800px at 10% -10%, #11112266 0%, transparent 60%), radial-gradient(900px 600px at 110% 10%, #1c0f2a66 0%, transparent 55%), #07070f",
    surface: "#0f0f1a",
    card: "#161625",
    border: "#252540",
    text: "#eeeeff",
    muted: "#7777aa",
    purple: "#9d7cff",
    pink: "#ff6eb4",
    green: "#2ecc9a",
    gold: "#f5c842",
    red: "#ff5566",
    shadow: "0 4px 0 0 rgba(37,37,64,1)",
    overlay: "rgba(7,7,15,0.78)",
  },
  light: {
    bg: "#fdf6ff",
    bgGradient:
      "linear-gradient(135deg, #f3ebff 0%, #fff0f6 30%, #fff7e6 55%, #ebfff5 80%, #eaf4ff 100%)",
    surface: "#ffffff",
    card: "#ffffffd9",
    border: "#e0d5f5",
    text: "#1d0f3a",
    muted: "#6b5a90",
    purple: "#7c5bf0",
    pink: "#e85aa1",
    green: "#1faa7a",
    gold: "#c8961e",
    red: "#e23a55",
    shadow: "0 4px 0 0 rgba(224,213,245,1)",
    overlay: "rgba(245,240,255,0.78)",
  },
};

// ====== Optional palettes — added on top of dark/light without replacing them ======
export const PALETTES = {
  sunset: {
    label: "Sunset Peach",
    swatch: ["#fff5ee", "#ffd9b8", "#ff9a76", "#c8482e"],
    bg: "#fff5ee",
    bgGradient: "linear-gradient(135deg, #ffe8d6 0%, #ffd2c2 30%, #ffb6a0 55%, #ffe2cb 80%, #fff5ee 100%)",
    surface: "#ffffff",
    card: "#ffffffd9",
    border: "#f0d4c0",
    text: "#4a1f0f",
    muted: "#8a5a40",
    purple: "#c8482e",
    pink: "#ff7a6c",
    green: "#1f9a6e",
    gold: "#d68a1c",
    red: "#d2342f",
    shadow: "0 4px 0 0 rgba(240,212,192,1)",
    overlay: "rgba(255,245,238,0.78)",
  },
  ocean: {
    label: "Ocean Mist",
    swatch: ["#eff9ff", "#bce5f7", "#5fc1e8", "#0a3a52"],
    bg: "#eff9ff",
    bgGradient: "linear-gradient(135deg, #d6eef9 0%, #c8e6f5 30%, #d3f0e8 55%, #e0f2ff 80%, #eff9ff 100%)",
    surface: "#ffffff",
    card: "#ffffffd9",
    border: "#c3def0",
    text: "#0a3a52",
    muted: "#4a6f80",
    purple: "#1c7d9e",
    pink: "#e85aa1",
    green: "#159a7a",
    gold: "#c8961e",
    red: "#d2342f",
    shadow: "0 4px 0 0 rgba(195,222,240,1)",
    overlay: "rgba(239,249,255,0.78)",
  },
  forest: {
    label: "Forest Sage",
    swatch: ["#f1faf1", "#cfead0", "#7cba81", "#1a3a1f"],
    bg: "#f1faf1",
    bgGradient: "linear-gradient(135deg, #e0f3df 0%, #d3eed4 30%, #ddf2dc 55%, #ebf8eb 80%, #f1faf1 100%)",
    surface: "#ffffff",
    card: "#ffffffd9",
    border: "#cae3cb",
    text: "#1a3a1f",
    muted: "#577a5d",
    purple: "#5a8a3a",
    pink: "#cf7290",
    green: "#1f8a4a",
    gold: "#b88820",
    red: "#c8482e",
    shadow: "0 4px 0 0 rgba(202,227,203,1)",
    overlay: "rgba(241,250,241,0.78)",
  },
  midnight: {
    label: "Midnight Plum",
    swatch: ["#1a0e2e", "#3a1f5a", "#9d7cff", "#f0e8ff"],
    bg: "#1a0e2e",
    bgGradient: "radial-gradient(1200px 800px at 10% -10%, #3a1f5a55 0%, transparent 60%), radial-gradient(900px 600px at 110% 10%, #5a2f7a55 0%, transparent 55%), linear-gradient(135deg, #1a0e2e 0%, #2a1244 50%, #1a0e2e 100%)",
    surface: "#251642",
    card: "#2c1a4f",
    border: "#3f2a66",
    text: "#f0e8ff",
    muted: "#a094c8",
    purple: "#b09cff",
    pink: "#ff8ec8",
    green: "#4dd9b0",
    gold: "#ffd860",
    red: "#ff7080",
    shadow: "0 4px 0 0 rgba(63,42,102,1)",
    overlay: "rgba(26,14,46,0.82)",
  },
  candy: {
    label: "Candy Pop",
    swatch: ["#fff0f8", "#ffd5ec", "#ff8acb", "#5a1a4a"],
    bg: "#fff0f8",
    bgGradient: "linear-gradient(135deg, #ffe0ee 0%, #ffd0e6 30%, #ecd6ff 55%, #ffe6f4 80%, #fff0f8 100%)",
    surface: "#ffffff",
    card: "#ffffffd9",
    border: "#f0c8de",
    text: "#5a1a4a",
    muted: "#8c5078",
    purple: "#a456d6",
    pink: "#e6478f",
    green: "#1faa7a",
    gold: "#d68a1c",
    red: "#e23a55",
    shadow: "0 4px 0 0 rgba(240,200,222,1)",
    overlay: "rgba(255,240,248,0.78)",
  },
  mocha: {
    label: "Mocha Latte",
    swatch: ["#faf3e8", "#e8d4ba", "#a07050", "#3a2818"],
    bg: "#faf3e8",
    bgGradient: "linear-gradient(135deg, #f0e0c8 0%, #ead2b8 30%, #f5e6d2 55%, #faecd6 80%, #faf3e8 100%)",
    surface: "#fffaf0",
    card: "#fffaf0d9",
    border: "#e0c8a8",
    text: "#3a2818",
    muted: "#7a5a40",
    purple: "#8a5a30",
    pink: "#cc6a82",
    green: "#1f8a5a",
    gold: "#b87820",
    red: "#c8482e",
    shadow: "0 4px 0 0 rgba(224,200,168,1)",
    overlay: "rgba(250,243,232,0.78)",
  },
};

export const getTheme = (isDark, paletteKey) => {
  if (paletteKey && PALETTES[paletteKey]) return PALETTES[paletteKey];
  return isDark ? THEMES.dark : THEMES.light;
};

// ==== Tense Forms ====
const TENSE_TABLE = {
  run: { past: "ran", present: "runs", future: "will run" },
  go: { past: "went", present: "goes", future: "will go" },
  eat: { past: "ate", present: "eats", future: "will eat" },
  see: { past: "saw", present: "sees", future: "will see" },
  slay: { past: "slayed", present: "slays", future: "will slay" },
  ate: { past: "ate (devoured)", present: "ate (current usage)", future: "will ate" },
  vibe: { past: "vibed", present: "vibes", future: "will vibe" },
  ghost: { past: "ghosted", present: "ghosts", future: "will ghost" },
  ghosted: { past: "ghosted", present: "ghosts", future: "will ghost" },
  stan: { past: "stanned", present: "stans", future: "will stan" },
  drip: { past: "dripped", present: "drips", future: "will drip" },
  rizz: { past: "rizzed", present: "rizzes", future: "will rizz" },
  network: { past: "networked", present: "networks", future: "will network" },
  burnout: { past: "burned out", present: "burns out", future: "will burn out" },
  hath: { past: "had", present: "has (hath)", future: "shall have" },
  doth: { past: "did", present: "doth", future: "shall do" },
  art: { past: "wast", present: "art", future: "shalt be" },
  analyze: { past: "analyzed", present: "analyzes", future: "will analyze" },
  evaluate: { past: "evaluated", present: "evaluates", future: "will evaluate" },
  infer: { past: "inferred", present: "infers", future: "will infer" },
  synthesize: { past: "synthesized", present: "synthesizes", future: "will synthesize" },
  empathy: { past: "felt empathy", present: "shows empathy", future: "will feel empathy" },
  yearn: { past: "yearned", present: "yearns", future: "will yearn" },
};

export const getTenseForms = (wordObj) => {
  if (!wordObj) return { past: "—", present: "—", future: "—" };
  if (wordObj.tenses) return wordObj.tenses;
  const w = (wordObj.word || "").toLowerCase().trim();
  if (TENSE_TABLE[w]) return TENSE_TABLE[w];

  // Heuristic fallback. If verb-like (1-syllable, ends in consonant), apply -ed/-s.
  const isVerbLike = /^[a-z]+$/.test(w) && w.length <= 8 && !/[aeiou]y$/.test(w);
  if (isVerbLike) {
    let past = w + "ed";
    if (w.endsWith("e")) past = w + "d";
    else if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(w))
      past = w + w.slice(-1) + "ed";
    return {
      past,
      present: w.endsWith("s") ? w + "es" : w + "s",
      future: "will " + w,
    };
  }
  return {
    past: `was ${w}`,
    present: `is ${w}`,
    future: `will be ${w}`,
  };
};

// ==== Mistake Breakdown ====
export const generateMistakeBreakdown = (userAnswer, correctAnswer, wordObject) => {
  const ua = (userAnswer || "").toLowerCase().trim();
  const ca = (correctAnswer || "").toLowerCase().trim();
  if (ua === ca) return null;

  const mistakes = [];
  const maxLen = Math.max(ua.length, ca.length);
  const letterErrors = [];
  for (let i = 0; i < maxLen; i++) {
    if (ua[i] !== ca[i]) {
      letterErrors.push({
        position: i + 1,
        typed: ua[i] || "(missing)",
        correct: ca[i] || "(extra)",
      });
    }
  }

  if (letterErrors.length > 0 && letterErrors.length <= 3) {
    letterErrors.forEach((e) =>
      mistakes.push(
        `Position ${e.position}: you typed "${e.typed}", correct is "${e.correct}"`
      )
    );
  } else if (letterErrors.length > 3) {
    mistakes.push(`${letterErrors.length} letters differ — review the spelling carefully`);
  }
  if (wordObject?.origin) {
    mistakes.push(`Memory tip: "${wordObject.word}" comes from ${wordObject.origin}`);
  }
  if (wordObject?.synonyms?.length) {
    mistakes.push(`Think of a synonym: "${wordObject.synonyms[0]}" has a similar meaning`);
  }
  return mistakes;
};

// ==== Levenshtein for pronunciation scoring ====
export const levenshtein = (a, b) => {
  a = (a || "").toLowerCase();
  b = (b || "").toLowerCase();
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

export const pronunciationScore = (heard, target) => {
  const h = (heard || "").toLowerCase().replace(/[^a-z]/g, "");
  const t = (target || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!t) return 0;
  const longer = Math.max(h.length, t.length);
  const dist = levenshtein(h, t);
  return Math.round((1 - dist / longer) * 100);
};

// ==== Speech (TTS + STT) ====
export const speak = (text, slow = false) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = slow ? 0.55 : 0.95;
      u.pitch = 1;
      u.lang = "en-US";

      // Prioritize high-quality voices often available on macOS / Chromium
      const voices = window.speechSynthesis.getVoices();
      
      const preferredNames = [
        "Google US English",
        "Google UK English Female",
        "Google UK English Male",
        "Samantha",
        "Alex",
        "Daniel",
        "Moira",
        "Fiona"
      ];
      
      let pick = null;
      // 1. Try to find a preferred high-quality voice
      for (const name of preferredNames) {
        pick = voices.find((v) => v.name === name);
        if (pick) break;
      }
      
      // 2. Fallbacks
      if (!pick) {
        pick = 
          voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) || // Any Google en-US
          voices.find((v) => v.lang === "en-US" && !v.localService) || // Cloud based en-US usually better
          voices.find((v) => v.lang === "en-US" && v.localService) ||   // local en-US
          voices.find((v) => v.lang.startsWith("en")) ||                // any English
          null;
      }

      if (pick) u.voice = pick;

      window.speechSynthesis.speak(u);
    };

    // Voices may not be loaded yet on first call — wait for them
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
    }
  } catch (e) {
    /* noop */
  }
};

export const listen = (onResult, onEnd) => {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onEnd?.("unsupported");
    return null;
  }
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const t = e.results?.[0]?.[0]?.transcript || "";
    onResult?.(t);
  };
  rec.onerror = (e) => onEnd?.(e?.error || "error");
  rec.onend = () => onEnd?.();
  try {
    rec.start();
  } catch (e) {
    /* noop */
  }
  return rec;
};

// ==== Syllable breakdown (heuristic) ====
export const syllabify = (word) => {
  const w = (word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  // Split into chunks at vowel-consonant-vowel boundaries.
  const parts = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g) || [w];
  return parts.filter(Boolean);
};

// ==== Misc ====
export const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
