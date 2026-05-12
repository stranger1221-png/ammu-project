// GENVO — Main App with cloud auth + sync.
import React, { useEffect, useRef, useState, useMemo } from "react";
import "./App.css";
import "./lib/storage";
import { getTheme } from "./lib/helpers";
import { WORD_DB } from "./data/words";
import { AuthProvider, useAuth, cloudSyncGet, cloudSyncSet } from "./lib/auth";
import Auth from "./components/genvo/Auth";
import { Header, BottomNav, SearchFAB, SearchModal, EditAccountModal, RewardModal, XPToast } from "./components/genvo/Shell";
import PalettePicker from "./components/genvo/PalettePicker";
import { FlashCardModal } from "./components/genvo/Modals";
import Flashcards from "./components/genvo/pages/Flashcards";
import Dictionary from "./components/genvo/pages/Dictionary";
import Practice from "./components/genvo/pages/Practice";
import Story from "./components/genvo/pages/Story";
import Tutor from "./components/genvo/pages/Tutor";
import Dashboard from "./components/genvo/pages/Dashboard";

const REWARD_MILESTONES = [10, 20, 30, 40, 50];

// ---------- Splash ----------
const Splash = ({ T }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bgGradient || T.bg, color: T.text }}>
    <div style={{
      width: 88, height: 88, borderRadius: 26,
      background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 52, lineHeight: 1,
    }} className="genvo-pop">🌻</div>
    <div className="genvo-fade-in" style={{
      fontFamily: "'Crimson Pro', serif", fontSize: 32, fontWeight: 700, fontStyle: "italic",
      background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginTop: 12,
    }}>GENVO</div>
    <div className="genvo-spin-slow" style={{ marginTop: 16, fontSize: 24 }}>✨</div>
  </div>
);

// ---------- Inner app (uses auth context) ----------
function GenvoApp() {
  const { user: authUser, checking, logout: doLogout, updateProfile } = useAuth();

  const [isDark, setIsDark] = useState(false);
  const [paletteKey, setPaletteKey] = useState(null); // null = use isDark; otherwise one of PALETTES keys
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [page, setPage] = useState("flashcards");

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [learned, setLearned] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [customWords, setCustomWords] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardMilestone, setRewardMilestone] = useState(0);
  const [openWord, setOpenWord] = useState(null);
  const [openWordIsAi, setOpenWordIsAi] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [toasts, setToasts] = useState([]);
  const lastRewardRef = useRef(-1);
  const restoredRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const T = getTheme(isDark, paletteKey);

  const allWords = useMemo(() => {
    const seen = new Set();
    const out = [];
    [...WORD_DB, ...customWords].forEach(w => {
      const k = (w.word || "").toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(w); }
    });
    return out;
  }, [customWords]);

  // ===== Cloud sync hydrate after login =====
  useEffect(() => {
    if (checking) return;
    if (!authUser) {
      // signed out — reset state
      restoredRef.current = false;
      setXp(0); setStreak(1); setLearned([]); setBookmarks([]); setCustomWords([]);
      lastRewardRef.current = -1;
      return;
    }
    (async () => {
      restoredRef.current = false;
      setSyncing(true);
      try {
        const cloud = await cloudSyncGet();
        // Read any local progress (from before login or unsynced).
        let localProgress = null, localCustom = null, localTheme = null;
        try {
          const lp = await window.storage.get("user_progress");
          if (lp?.value) localProgress = JSON.parse(lp.value);
          const lc = await window.storage.get("custom_words");
          if (lc?.value) localCustom = JSON.parse(lc.value);
          const lt = await window.storage.get("user_theme");
          if (lt?.value) localTheme = lt.value;
        } catch (e) {}

        // Merge: union of arrays + max of scalar.
        const cp = cloud?.progress || {};
        const merged = {
          xp: Math.max(cp.xp || 0, localProgress?.xp || 0),
          streak: Math.max(cp.streak || 1, localProgress?.streak || 1),
          learned: Array.from(new Set([...(cp.learned || []), ...(localProgress?.learned || [])])),
          bookmarks: Array.from(new Set([...(cp.bookmarks || []), ...(localProgress?.bookmarks || [])])),
          lastReward: Math.max(cp.lastReward ?? -1, localProgress?.lastReward ?? -1),
        };
        const mergedCustom = (() => {
          const seen = new Set();
          const out = [];
          [...(cloud?.custom_words || []), ...(localCustom || [])].forEach(w => {
            const k = (w.word || "").toLowerCase();
            if (k && !seen.has(k)) { seen.add(k); out.push(w); }
          });
          return out;
        })();
        const mergedTheme = cloud?.theme || localTheme || "light";

        setXp(merged.xp);
        setStreak(merged.streak);
        setLearned(merged.learned);
        setBookmarks(merged.bookmarks);
        setCustomWords(mergedCustom);
        setIsDark(mergedTheme === "dark");
        lastRewardRef.current = merged.lastReward;

        // Push merged result back to cloud (keeps both ends authoritative).
        await cloudSyncSet({ progress: merged, custom_words: mergedCustom, theme: mergedTheme });

        // Optional: clear local-only keys now that cloud is authoritative.
        try {
          await window.storage.set("user_progress", JSON.stringify(merged));
          await window.storage.set("custom_words", JSON.stringify(mergedCustom));
          await window.storage.set("user_theme", mergedTheme);
        } catch (e) {}
      } catch (e) {
        // Cloud unreachable — fall back to local
        try {
          const lp = await window.storage.get("user_progress");
          if (lp?.value) {
            const p = JSON.parse(lp.value);
            setXp(p.xp || 0); setStreak(p.streak || 1);
            setLearned(p.learned || []); setBookmarks(p.bookmarks || []);
            lastRewardRef.current = p.lastReward ?? -1;
          }
          const lc = await window.storage.get("custom_words");
          if (lc?.value) setCustomWords(JSON.parse(lc.value));
          const lt = await window.storage.get("user_theme");
          if (lt?.value) setIsDark(lt.value === "dark");
        } catch (er) {}
      } finally {
        setSyncing(false);
        restoredRef.current = true;
      }
    })();
  }, [authUser, checking]);

  // ===== Persistence (local + cloud debounced) =====
  useEffect(() => {
    if (!restoredRef.current || !authUser) return;
    const progress = { xp, streak, learned, bookmarks, lastReward: lastRewardRef.current };
    (async () => {
      try { await window.storage.set("user_progress", JSON.stringify(progress)); } catch(e){}
    })();
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      cloudSyncSet({ progress }).catch(() => {});
    }, 1200);
  }, [xp, streak, learned, bookmarks, authUser]);

  useEffect(() => {
    if (!restoredRef.current || !authUser) return;
    (async () => { try { await window.storage.set("custom_words", JSON.stringify(customWords)); } catch(e){} })();
    cloudSyncSet({ custom_words: customWords }).catch(() => {});
  }, [customWords, authUser]);

  useEffect(() => {
    if (!restoredRef.current || !authUser) return;
    const themeStr = isDark ? "dark" : "light";
    (async () => { try { await window.storage.set("user_theme", themeStr); } catch(e){} })();
    cloudSyncSet({ theme: themeStr }).catch(() => {});
  }, [isDark, authUser]);

  // ===== XP/toast/reward =====
  const pushToast = (amount, label) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, amount, label }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  const addXp = (amount, label) => {
    if (!amount) return;
    setXp(x => x + amount);
    pushToast(amount, label);
  };

  useEffect(() => {
    const milestone = REWARD_MILESTONES.find(m => learned.length === m);
    if (milestone && milestone > lastRewardRef.current) {
      lastRewardRef.current = milestone;
      setRewardMilestone(milestone);
      setRewardOpen(true);
      setXp(x => x + 50);
    }
  }, [learned]);

  const onLearnt = (w) => {
    if (!w?.id) return;
    if (learned.includes(w.id)) return;
    setLearned(prev => [...prev, w.id]);
    addXp(15, "Learnt");
  };
  const onBookmark = (w) => {
    if (!w?.id) return;
    setBookmarks(prev => prev.includes(w.id) ? prev.filter(x => x !== w.id) : [...prev, w.id]);
  };
  const onAddCustom = (w) => {
    if (!w?.word) return;
    if (customWords.some(c => c.word.toLowerCase() === w.word.toLowerCase())) return;
    setCustomWords(prev => [...prev, w]);
  };
  const onRemoveCustom = (w) => setCustomWords(prev => prev.filter(c => c.id !== w.id));

  const onSelectFromSearch = (w) => {
    setOpenWord(w);
    setOpenWordIsAi(!!w.isAi);
  };

  const handleSaveAccount = async ({ name, icon }) => {
    try {
      await updateProfile({ name, icon });
    } catch (e) { /* show toast? */ }
    setEditOpen(false);
  };
  const handleLogout = async () => {
    setEditOpen(false);
    try { await doLogout(); } catch (e) {}
    // local data left in localStorage for next sign-in merge.
  };

  // ===== Render =====
  if (checking) return <Splash T={T} />;

  if (!authUser) {
    return (
      <div className="App genvo-noise" style={{ background: T.bgGradient || T.bg, color: T.text, minHeight: "100vh" }}>
        <Auth T={T} />
      </div>
    );
  }

  return (
    <div className="App genvo-noise" data-testid="genvo-app" style={{ background: T.bgGradient || T.bg, color: T.text, minHeight: "100vh", paddingBottom: 12 }}>
      <Header user={authUser} isDark={isDark} setIsDark={setIsDark} xp={xp} onAvatarClick={() => setEditOpen(true)} T={T} />

      {syncing && (
        <div data-testid="sync-banner" style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 100002, padding: "6px 12px", borderRadius: 999, background: T.purple, color: "#fff", fontSize: 12, fontWeight: 700 }}>
          ☁️ Syncing your progress...
        </div>
      )}

      {page === "flashcards" && <Flashcards allWords={allWords} learned={learned} bookmarks={bookmarks} onLearnt={onLearnt} onBookmark={onBookmark} T={T} />}
      {page === "dictionary" && <Dictionary allWords={allWords} customWords={customWords} learned={learned} bookmarks={bookmarks} onLearnt={onLearnt} onBookmark={onBookmark} onAddCustom={onAddCustom} onRemoveCustom={onRemoveCustom} T={T} />}
      {page === "practice" && <Practice allWords={allWords} learned={learned} bookmarks={bookmarks} onLearnt={onLearnt} onBookmark={onBookmark} addXp={addXp} T={T} />}
      {page === "story" && <Story allWords={allWords} onLearnt={onLearnt} onBookmark={onBookmark} onAddCustom={onAddCustom} learned={learned} bookmarks={bookmarks} T={T} />}
      {page === "tutor" && <Tutor T={T} />}
      {page === "dashboard" && <Dashboard user={authUser} xp={xp} streak={streak} learned={learned} bookmarks={bookmarks} customWords={customWords} allWords={allWords} onEditAccount={() => setEditOpen(true)} onRemoveCustom={onRemoveCustom} onBookmark={onBookmark} onOpenWord={(w) => { setOpenWord(w); setOpenWordIsAi(!!w.isAi); }} T={T} />}

      <BottomNav page={page} setPage={setPage} T={T} />
      <SearchFAB onClick={() => setSearchOpen(true)} T={T} />
      <XPToast toasts={toasts} T={T} />

      <SearchModal
        open={searchOpen} onClose={() => setSearchOpen(false)}
        onSelectWord={onSelectFromSearch} onAddCustom={onAddCustom}
        allWords={allWords} T={T}
      />
      <EditAccountModal
        open={editOpen} user={authUser}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveAccount} onLogout={handleLogout} T={T}
      />
      <RewardModal open={rewardOpen} milestone={rewardMilestone} onClose={() => setRewardOpen(false)} T={T} />

      {openWord && (
        <FlashCardModal
          word={openWord} T={T} isAi={openWordIsAi}
          onClose={() => setOpenWord(null)}
          onLearnt={onLearnt} onBookmark={onBookmark}
          onAddCustom={openWordIsAi ? (w) => { onAddCustom(w); setOpenWord(null); } : null}
          learned={learned.includes(openWord.id)}
          bookmarked={bookmarks.includes(openWord.id)}
        />
      )}
    </div>
  );
}

// ---------- Top-level wrapper ----------
export default function App() {
  return (
    <AuthProvider>
      <GenvoApp />
    </AuthProvider>
  );
}
