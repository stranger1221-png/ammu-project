# GENVO Master Prompt & Core Requirements

## STORY BUILDER (FINAL)

- Theme pills: fantasy, mystery, romance, sci-fi, medieval, comedy, horror, mythology
- Word input + Generate button
- Calls `https://api.anthropic.com/v1/messages` (`claude-sonnet-4-20250514`, `max_tokens: 800`)

---

### SYSTEM PROMPT FOR STORY GENERATION

```
You are a simple story writer for vocabulary learners.

STRICT RULES:
1. Write a simple, easy-to-read story of MAXIMUM 120 words
2. Use short, clear sentences — beginner friendly
3. Naturally include the word the user gave
4. Also naturally include 3 to 5 interesting vocabulary words
5. Keep the story fun and engaging for the chosen theme
6. After the story, on a new line write EXACTLY:
   VOCAB: word1|meaning|pronunciation|emoji, word2|meaning|pronunciation|emoji
   - List ONLY the interesting vocabulary words (not "the", "and", "was" etc.)
   - Maximum 6 words in the VOCAB line
   - No extra text, no titles, no explanation outside the story and VOCAB line
```

**User message sent to API:**
```
Write a [theme] story using the word "[userWord]". Maximum 120 words.
```

---

### STORY DISPLAY

- Render story in a clean readable card
- Crimson Pro serif, font size 16, line height 1.9
- Word count shown below story: "📝 112 words"
- Story text is **completely plain** — no tags, no highlights, no clickable spans inside the text
- Clean prose only — easy to read

---

### NEW WORDS PANEL (always below the story)

Parse `VOCAB:` line → split by `,` → each entry split by `|` to get `word | meaning | pronunciation | emoji`

Render each word as a **tappable card** in a scrollable/wrapping row:

```
┌──────────────────────────┐
│  emoji (large)           │
│  Word  (bold serif)      │
│  /pronunciation/         │
│  Short meaning (2 lines) │
│  [🔊 Hear]               │
└──────────────────────────┘
```

**On card tap → open `<FlashCardModal>`:**
- Check `WORD_DB` + `customWords` first for a full match
- If found → show full card (all meaning modes, tenses, synonyms, antonyms, examples, evolution)
- If not found → build temporary word object from VOCAB data, show with "🤖 AI Word" badge
- Front face: emoji + word + `/pronunciation/`
- Back face (tap to flip): meaning tabs, synonyms pills, antonyms pills, tense forms, example, evolution
- Buttons: 🔊 Hear · 🐢 Slow · ✅ Learnt · 📌 Bookmark · ➕ Add to My Words
- "➕ Add to My Words" → push to `customWords` + `window.storage.set('custom_words', ...)`

---

### STORY PAGE LAYOUT

```
[Theme pills]

[Word input]                    [✍️ Generate]

─────────────────────────────────────────────
📖 Story                          📝 112 words
─────────────────────────────────────────────
[Clean plain story paragraph
 in Crimson Pro serif
 short sentences, easy to read]
─────────────────────────────────────────────

✨ New Words in This Story
─────────────────────────────────────────────
[card 1]  [card 2]  [card 3]  [card 4]
(scrollable / wrapping row, max 6 cards)

[🔄 Generate Another]
─────────────────────────────────────────────
```

**Loading state:** pulsing placeholder card + "✍️ Writing your story..." + disabled button

**Error state:** "✨ The story spirits are resting... Please try again!" + re-enable button

---

## WORD SEARCH ENGINE

Add a dedicated **Search** tab in the bottom nav (🔍 Search) AND a floating 🔍 button fixed bottom-right visible on every page.

Both open the same **Search Screen / Modal**.

---

### SEARCH SCREEN LAYOUT

```
─────────────────────────────────────────────
🔍  [Type any word here...]        [Search]
─────────────────────────────────────────────
[Recent searches row — last 6, tappable chips]
─────────────────────────────────────────────
[Results appear here]
─────────────────────────────────────────────
```

---

### SEARCH LOGIC — TWO MODES

**Mode A — Instant DB Match:**
As the user types (debounced 300ms), search `WORD_DB` + `customWords` case-insensitively.

- If match found → show result card immediately, no API call needed
- Show a green "✅ In Dictionary" badge on the result

**Mode B — AI Lookup (word not in DB):**
If no DB match after full query typed + Search tapped:
- Show "🤖 Search with AI" button
- On tap → call Anthropic API:

```js
// System prompt:
`You are a vocabulary dictionary. Return ONLY a valid JSON object.
No markdown, no backticks, no explanation. Use exactly this shape:
{
  "word": "",
  "pronunciation": "",
  "emoji": "",
  "difficulty": "Easy|Medium|Hard",
  "period": "Modern|Academic|Slang|Historical|Medieval",
  "origin": "",
  "meanings": {
    "formal": "",
    "genZ": "",
    "millennial": "",
    "medieval": "",
    "victorian": "",
    "oldEnglish": ""
  },
  "synonyms": [],
  "antonyms": [],
  "examples": {
    "formal": "",
    "genZ": "",
    "medieval": ""
  },
  "evolution": [],
  "tenses": {
    "past": "",
    "present": "",
    "future": ""
  }
}`

// User message:
`Define the word: "${searchQuery}"`
```

- Parse JSON → build word object → show full result card with "🤖 AI Generated" badge
- If JSON parse fails → show friendly error: "Couldn't find that word. Check spelling and try again!"

---

### SEARCH RESULT CARD

When a word is found (DB or AI), show it as a full expanded card inline on the search screen:

```
─────────────────────────────────────────────
emoji  WORD  /pronunciation/
       Difficulty · Period · ✅ In Dictionary / 🤖 AI Word
─────────────────────────────────────────────
[Formal] [Gen Z] [Millennial] [Medieval]  ← mode tabs

Meaning: [selected mode meaning]
Example: [example sentence in italic]

Synonyms:  [green pill] [green pill] [green pill]
Antonyms:  [red pill]   [red pill]

Tenses:
  Past:    ___
  Present: ___
  Future:  ___

Origin:    [origin text]
Evolution: [step → step → step]
─────────────────────────────────────────────
[🔊 Hear] [🐢 Slow] [✅ Learnt] [📌 Bookmark]
[➕ Add to My Dictionary]    [🃏 Open as Flashcard]
─────────────────────────────────────────────
```

**"➕ Add to My Dictionary" button:**
- Adds the word to `customWords` state array
- Saves: `await window.storage.set('custom_words', JSON.stringify(customWords))`
- Button changes to "✅ Added!" and disables — cannot add duplicates
- Word now appears in Dictionary page under "My Words" section
- Word now appears in Flashcards rotation
- Word now appears in Practice word picker

**"🃏 Open as Flashcard" button:**
- Opens `<FlashCardModal>` for the word
- Same full flashcard experience as everywhere else in the app

---

### RECENT SEARCHES

- Store last 6 searched words in state + `window.storage.set('recent_searches', ...)`
- Show as tappable chips below the search bar
- Tapping a chip re-runs that search instantly
- Small ✕ on each chip to remove it from recents
- Restore recents on app startup from `window.storage`

---

### SEARCH IN BOTTOM NAV

Update the bottom nav to include Search:
```
🃏 Cards · 📖 Dict · 🔍 Search · 🎯 Practice · ✍️ Story · 🦉 Tutor · 🔖 Saved · 📊 Stats
```

If 8 tabs is too many for mobile, use a scrollable nav row or collapse Saved + Stats into a "More" tab.

---

## PRONUNCIATION CHECK (FULLY ACTIVATED)

Replace any previous pronunciation implementation with this complete version:

---

### COMPONENT: `<PronunciationCheck word={wordObject} onScore={fn} onAccepted={fn} T={T} />`

---

### STEP 1 — LISTEN FIRST

Before attempting, learner must hear the word:
```
─────────────────────────────────────────────
emoji   WORD   /pronunciation/
─────────────────────────────────────────────
Syllable guide:
  E · PHEM · er · al
  (stressed syllable in bold accent color)
─────────────────────────────────────────────
[🔊 Hear Normal Speed]   [🐢 Hear Slowly]
─────────────────────────────────────────────
Acceptance threshold: 80% or above
Attempt: #1
─────────────────────────────────────────────
[🎤 Start Speaking]
─────────────────────────────────────────────
```

---

### STEP 2 — RECORDING

On "🎤 Start Speaking" tap:
```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
  setFeedback("Speech recognition not supported. Please use Chrome or Edge.");
  return;
}
const rec = new SR();
rec.lang = 'en-US';
rec.interimResults = false;
rec.maxAlternatives = 3; // get top 3 alternatives for better scoring

rec.onresult = (event) => {
  // Check all alternatives for best score
  let bestScore = 0;
  let bestTranscript = '';
  for (let i = 0; i < event.results[0].length; i++) {
    const transcript = event.results[0][i].transcript.trim();
    const score = calcLevenshteinScore(transcript, wordObject.word);
    if (score > bestScore) {
      bestScore = score;
      bestTranscript = transcript;
    }
  }
  handleResult(bestTranscript, bestScore);
};

rec.onerror = (e) => {
  if (e.error === 'no-speech') setFeedback("No speech detected. Tap the button and speak clearly.");
  else if (e.error === 'not-allowed') setFeedback("Microphone access denied. Please allow mic access in your browser.");
  else setFeedback("Something went wrong. Please try again.");
  setListening(false);
};
```

**Levenshtein Score function:**
```js
const calcLevenshteinScore = (spoken, target) => {
  const a = spoken.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  if (a === b) return 100;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 100;
  let costs = Array.from({ length: shorter.length + 1 }, (_, i) => i);
  for (let i = 1; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 1; j <= shorter.length; j++) {
      const newValue = longer[i-1] === shorter[j-1]
        ? costs[j-1]
        : Math.min(costs[j-1]+1, Math.min(lastValue+1, costs[j]+1));
      costs[j-1] = lastValue;
      lastValue = newValue;
    }
    costs[shorter.length] = lastValue;
  }
  return Math.round((1 - costs[shorter.length] / longer.length) * 100);
};
```

While recording show:
- Animated pulsing red mic icon
- "🎙️ Listening... speak now"
- Disable all buttons while recording

---

### STEP 3 — VERIFICATION PANEL

After `rec.onresult` fires, show:

```
─────────────────────────────────────────────
[Score badge — large, colored by tier]

SCORE TIERS:
  100%      → 🌟 "Flawless! Perfect pronunciation!"    (gold)
  90–99%    → 🎉 "Excellent! Native level!"             (green)
  80–89%    → ✅ "Accepted! Great effort!"              (green) ← ACCEPTED
  65–79%    → 👏 "Close! One more try"                  (orange)
  40–64%    → 😊 "Getting there! Listen and retry"      (orange)
  below 40% → 💪 "Keep practising! Use slow mode first" (red)
─────────────────────────────────────────────
You said:      "[transcript]"
Target word:   [word]  /pronunciation/
─────────────────────────────────────────────
Syllable Breakdown:
  Target:  E · PHEM · er · al
  Score:   🟢  🔴   🟢   🟢   (green = matched, red = off)
─────────────────────────────────────────────
❗ Tips to improve:
  • "You said '[X]' — focus on the '[syllable]' syllable"
  • "Stress falls on syllable [N]: [bold syllable]"
  • "Try it slowly: [hy-phen-at-ed-word]"
  • "The '[letters]' sounds like '[simplified IPA]'"
─────────────────────────────────────────────
Attempt #[N] of unlimited
─────────────────────────────────────────────
[Always show WordExplanationBlock here]
─────────────────────────────────────────────
If NOT accepted (score < 80%):
  [🔊 Hear Again]  [🐢 Slow]  [🎤 Try Again]

If ACCEPTED (score ≥ 80%):
  ✅ Accepted! +[XP] XP
  [🔊 Hear]  [✅ Learnt]  [📌 Bookmark]  [Next Word →]
  → Also open <FlashCardModal> for the word automatically
─────────────────────────────────────────────
```

---

### SYLLABLE BREAKDOWN HELPER

```js
const splitSyllables = (word) => {
  // Simple vowel-group based syllable splitter
  const vowels = 'aeiouAEIOU';
  const syllables = [];
  let current = '';
  for (let i = 0; i < word.length; i++) {
    current += word[i];
    if (vowels.includes(word[i]) && i < word.length - 1 && !vowels.includes(word[i+1])) {
      syllables.push(current);
      current = '';
    }
  }
  if (current) syllables.push(current);
  return syllables.length > 1 ? syllables : word.split('');
};

// Display: syllables.join(' · ')
// Stress: bold the longest or first-syllable by default
```

---

### XP FOR PRONUNCIATION

| Score | XP |
|---|---|
| 100% | +20 XP |
| 90–99% | +20 XP |
| 80–89% (accepted) | +15 XP |
| Retry accepted | +10 XP |
| Not accepted | +0 XP |

---

### BROWSER SUPPORT NOTE

Show this message if `SpeechRecognition` is not available:
```
🎙️ Pronunciation check requires Chrome or Edge browser.
   Safari and Firefox do not support the Web Speech API yet.
   [🔊 You can still listen to the word below]
   [🔊 Hear Normal]  [🐢 Hear Slow]
```

---

### WHERE PRONUNCIATION CHECK APPEARS

1. **Practice Page** → as one of the 4 practice modes (word-first flow)
2. **Flashcard buttons** → "🎤 Check Pronunciation" button below every card
3. **Dictionary expanded view** → "🎤 Pronounce" button alongside 🔊 Hear
4. **Search result card** → "🎤 Pronounce" button in the action row
5. **`<FlashCardModal>`** → "🎤" button alongside 🔊 and 🐢

In all locations outside Practice, show a **compact inline version**:
- Just the score badge + transcript + tier message + Try Again button
- No full WordExplanationBlock (that's only in Practice verification panels)
- Same scoring logic, same acceptance threshold (80%+)

---

Create a secure and responsive web application with an Internet Identity-based email login system. The app should allow users to log in once using their email and securely access the same account from any device without creating separate profiles.

Core Requirements:

- Implement Internet Identity authentication for secure email-based login.
- Users should be able to sign in using the same email on multiple devices and continue with synced data and preferences.
- Maintain persistent cloud-based user accounts and sessions.
- Ensure secure authentication with encrypted data handling and proper session management.
- Include signup, login, logout, password recovery, and session persistence features.
- Design the authentication flow to be smooth, modern, and beginner-friendly.
- Add responsive UI for mobile, tablet, and desktop compatibility.
- Include loading animations, success/error notifications, and account verification flow.
- Store user data securely in a scalable backend database.
- Support cross-device synchronization in real time.
- Use a clean modern UI with minimalistic design, smooth transitions, and visually appealing authentication screens.

Technical Expectations:

- Frontend: React / Next.js
- Backend: Node.js / Express or suitable backend framework
- Authentication: Internet Identity + email verification
- Database: MongoDB / Firebase / PostgreSQL
- Hosting: Cloud-based deployment
- Security: JWT/session tokens, HTTPS, encrypted storage, secure API handling

Additional Features:

- “Remember Me” option
- Profile management
- Device/session management
- Dark and light mode
- Optional OTP or two-factor authentication
- Fast performance and optimized loading speed

Goal:
Build a professional, scalable, and secure multi-device web application where users can seamlessly access their account anywhere using the same email identity.
