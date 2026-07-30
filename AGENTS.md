# ClearRead — Team Coordination Contract

ClearRead is a dyslexia-first reading view for LLM answers: it takes any LLM's
markdown output and re-renders it as a TL;DR + short expandable chunk cards with
evidence-based typography and per-chunk read-aloud. Model-agnostic display layer,
not a chatbot. Pure static HTML/CSS/JS — **no frameworks, no CDNs, no build step.**

## Locked file tree — do NOT add, rename, or move files outside your ownership

```
index.html          — landing/presentation page          (owner: Agent B)
app/demo.html       — before/after demo app              (owner: Agent A)
app/clearread.js    — markdown→chunk parser+renderer+TTS (owner: Agent A)
app/clearread.css   — evidence-based design tokens       (owner: Agent A)
app/demos.js        — canned answers + authored TL;DRs   (owner: Agent C)
app/live-answer.js  — placeholder, overwritten by CLI    (owner: Agent A)
bin/clearread       — CLI bridge: stdin → browser        (owner: Agent A)
assets/             — screenshots + GIFs                 (owner: supervisor)
README.md           — concise, visual-first              (owner: Agent C)
AGENTS.md           — this contract; append to Status only
```

## Interface contracts (fixed — code against these, do not change them)

### Chunk data model (produced by parser, consumed by renderer)
```js
// ClearRead.parse(markdown) -> { tldr: string|null, chunks: Chunk[] }
// Chunk = { gist: string, text: string, html: string }
//   gist: short bold label for the collapsed card — nearest heading text,
//         else first sentence (truncated ~60 chars)
//   text: plain text of the chunk (used for TTS)
//   html: rendered HTML of the chunk body
// Chunks are ≤ ~50 words each; longer paragraphs are split at sentence
// boundaries. tldr is null when not derivable (renderer then uses demo tldr
// or labels the first chunk "Main point").
```

### Global API on `window.ClearRead` (defined in app/clearread.js)
```js
ClearRead.parse(markdown)                 // -> {tldr, chunks} per above
ClearRead.render(containerEl, {tldr, chunks})  // builds the chunked view
ClearRead.speak(text, onEnd)              // Web Speech API; one utterance at a time
```

### Canned demos (app/demos.js)
```js
window.CLEARREAD_DEMOS = [
  { id: 'vaccines',            // kebab-case slug
    title: 'How do vaccines work?',   // the user's "question"
    markdown: '...',           // dense multi-paragraph LLM-style answer, real markdown
    tldr: '...' }              // ONE plain-language sentence, ≤20 words
]
```
Answers must be genuinely dense (350–500 words, long paragraphs) so the
Before view looks like a real wall of text.

### Live answer (app/live-answer.js placeholder; bin/clearread overwrites it)
```js
window.LIVE_ANSWER = null; // CLI bridge replaces with a markdown string
```

### CSS design tokens (defined in app/clearread.css on :root; use ONLY these for color/spacing/type)
```
--cr-bg            #FAF4E8   cream (BDA: avoid pure white)
--cr-surface       #FFFDF7   card background
--cr-text          #2B2B2B   near-black on cream ≥ 7:1 contrast
--cr-accent        #1A6B8A   buttons/links/focus
--cr-highlight     #FFE8A3   active TTS chunk background
--cr-font-size     18px      (BDA 16–19px)
--cr-line-height   1.7       (WCAG ≥1.5)
--cr-letter-spacing 0.03em   default; user slider raises toward 0.12em (Zorzi/WCAG)
--cr-word-spacing  0.10em    default; slider raises toward 0.16em
--cr-max-width     66ch      (WCAG ≤80ch, BDA 60–70)
--cr-chunk-gap     1.25rem
--cr-radius        12px
```
Every token in clearread.css carries a one-line comment naming its evidence
source (BDA Style Guide 2023 / WCAG 1.4.8 / 1.4.12 / Zorzi 2012 / W3C COGA).
Agent B (landing page) embeds its own <style> but must reuse these token
names/values so the two pages look like one product.

## Style rules
- Vanilla ES2020+, no dependencies. `'use strict'`. Small named functions.
- Comments only where a rule/constraint isn't obvious from code (e.g., evidence citations, WCAG numbers).
- Body text is NEVER justified; always left-aligned. OpenDyslexic is an
  optional toggle labeled "personal preference — evidence favors spacing,
  not special fonts", never the default.
- Everything must work by double-clicking the HTML file (file:// protocol):
  no fetch() of local files, no modules, plain <script> tags.
- Keyboard accessible: chunks expand/collapse with Enter/Space, visible focus rings.

## Handoff (required)
When you finish, append to `## Status` below: what's done, how to use your
work, open questions, difficulties hit. 3–8 bullet lines, no essays.

## Status
- [supervisor] Scaffold + contract written. Agents A/B/C dispatched in parallel.
- [A] Done: app/clearread.css (tokens + 3 themes + all component styles, each token evidence-commented), app/clearread.js (window.ClearRead.parse/render/speak per contract), app/demo.html (before/after flip centerpiece + picker + controls), app/live-answer.js placeholder, bin/clearread (executable).
- [A] Use: double-click app/demo.html (works over file://, plain script tags). CLI: `claude -p "..." | ./bin/clearread` writes app/live-answer.js and opens the page; set `CLEARREAD_NO_OPEN=1` to skip the browser (test mode).
- [A] Verified with node: parse() splits >50-word paragraphs at sentences, keeps lists as one chunk, renders bold/italic/inline-code/links/code-blocks, gists inherit nearest heading. CLI JSON-escaping round-trips correctly. All JS syntax-checked incl. demo.html inline script.
- [A] Integrated cleanly with Agent C's demos.js (3 demos: vaccines/compound-interest/sourdough). demo.html falls back to one inline demo if CLEARREAD_DEMOS is missing.
- [A] Note: parse() always returns tldr:null by contract — demo/live callers must pass their own tldr into render(); when null, renderer prefixes chunk 1 with "Main point —".
- [A] Open Q: TTS (speak) uses Web Speech API which is unavailable/silent in some browsers over file://; degrades gracefully (calls onEnd). Highlight + auto-expand still work regardless.
- [C] Done: app/demos.js (3 demos: vaccines, compound-interest, sourdough) + README.md.
- [C] demos.js is a plain script, 'use strict', sets window.CLEARREAD_DEMOS = [{id,title,markdown,tldr}]. Load it with a <script> tag before clearread.js reads it.
- [C] Each markdown is 350–500 words of genuinely dense paragraphs (Before wall of text). vaccines = no headings, sourdough = no headings/bold, compound-interest has **bold** + a bullet list. Content is factually accurate.
- [C] Each tldr is one plain sentence ≤20 words — safe to show verbatim when ClearRead.parse returns tldr: null.
- [C] README keeps exact image paths assets/before-after.gif and assets/cli-bridge.gif for the supervisor to record. No LICENSE file yet (called out as MIT-spirit).
- [C] Open Q: confirm the CLI bridge invocation is `./bin/clearread` (Agent A owns bin/clearread) — README documents that exact form.
- [B] index.html done: single-file landing + slide-deck page, all CSS in one <style>, no JS, no CDNs. Works via file:// double-click.
- [B] Reused every token name/value from the contract (--cr-bg #FAF4E8, --cr-accent #1A6B8A, etc.) in the embedded :root so it matches the app.
- [B] Page follows its own rules: 66ch measure, line-height 1.7, left-aligned body, cream bg, short chunks. Only the "before" wall-of-text sample is deliberately justified/tight as the anti-pattern.
- [B] Sections in spec order: Hero, Problem (CSS-only before/after using a hand-written photosynthesis sample), Solution+evidence grid+font callout, Works-with-any-LLM (3 cards incl. CLI code block), What's next, footer ("Pheobe + Claude").
- [B] Hero button links to app/demo.html (Agent A). GitHub link is placeholder href="#" text "View on GitHub" for supervisor to fill.
- [B] Open Q: the before/after uses my own photosynthesis content, not a demos.js entry — kept it self-contained on purpose so the landing page never depends on other files. If you'd rather it mirror a canned demo, easy swap.
- [supervisor] Integration review passed: all files match the contract; node syntax checks pass; CLI bridge round-trips (tested end-to-end with the vaccines demo).
- [supervisor] Added URL-param state to demo.html (?demo=<id>&view=before|after&expand=all) for shareable/screenshottable states.
- [supervisor] Replaced 🔊 emoji with inline SVG speaker (emoji fallback glyphs looked broken on systems without color-emoji fonts).
- [supervisor] Recorded assets/before-after.gif and assets/cli-bridge.gif via headless Chrome + ffmpeg; filled real GitHub URL in index.html.
- [supervisor] Open: optional ElevenLabs voice mode (user-supplied key via localStorage, never committed) — planned next; Web Speech stays the default.
- [supervisor] Round 2 shipped: LICENSE (MIT); app/local-config.example.js (gitignored local-config.js for the ElevenLabs key); settings auto-fold (details panel, folds 3.5s after last adjustment); 🎯 focus mode (one chunk at a time, Back/Next + progress dots + arrow keys, ?focus=1); section titles from markdown headings (no longer discarded); chunk-count label; WCAG touch-target floors; prefers-reduced-motion; mobile flip/picker overflow fixed (min-width:0); default spacing raised to the evidence floor (0.12em/0.16em); speaker buttons expose aria-pressed state; ?theme= param.
- [supervisor] UI/UX critique (subagent) verdict applied except: gists still open the chunk's own first sentence (honest fix = LLM-authored gists, now on the roadmap); landing/app TL;DR style unification pending.
- [supervisor] Note: headless Chrome clamps viewport to ≥500px — mobile QA below 500px needs a real device/devtools.
- [supervisor] Round 4 (Pheobe-approved quick wins from second critique): one-time first-run pulses (localStorage-gated, reduced-motion-safe, self-dismissing) — inset ring on the ClearRead toggle half at first load, outer glow on the focus button at first flip; deleted both redundant view-caption bars. Deferred (critique items 4-5, ~40 min): merge Open/Close-all into one toggle + move the Aa settings chip into the toolbar row; drop toggle emoji; tappable ⓘ; fold-on-outside-click instead of the 3.5s timer; re-check <500px on a real device.
- [supervisor] Round 3 (Pheobe-approved): settings redesigned as previews-not-text — "Aa" e-reader chip for the panel, colour swatch circles for themes, real-font Aa chips for the font choice (evidence note in ⓘ tooltip), aa→a a and A→A slider endpoints, "🔈 Voice" disclosure; toolbar reworded to plain "▾ Open all / ▴ Close all". TL;DR card unified with landing (highlight bg + accent left bar). New ?prefs=1 URL param opens settings for QA. Rationale: icon-ONLY controls raise cognitive load per accessibility research — previews with ≤1-word captions instead.
- [integration] Done: integrations/claude-code/ — clearread-last (POSIX sh + python3, dependency-free), settings-snippet.json (opt-in Stop hook), README.md (≤40 lines).
- [integration] Use: `integrations/claude-code/clearread-last [--project <dir>]` finds the project's most recently modified transcript in ~/.claude/projects/<flattened-path>/*.jsonl, extracts the LAST assistant message's text parts, and pipes them into bin/clearread. `CLEARREAD_NO_OPEN=1` for tests.
- [integration] Auto-open: merge settings-snippet.json's "hooks" block into .claude/settings(.local).json — Stop hook (no matcher supported) runs clearread-last via $CLAUDE_PROJECT_DIR after every answer. Schema verified against code.claude.com/docs/en/hooks.
- [integration] Verified end-to-end on this machine against the live session jsonl; transcript shape confirmed (.type=="assistant", .message.content[] with {"type":"text","text":…}); sidechain (subagent) entries are skipped and text parts grouped by message.id.
- [integration] Caveat: if the last assistant turn was tool-use only, the script falls back to the last TEXT-bearing message; enabling the Stop hook opens a browser tab after every single answer (that's the feature — remove the hook block to stop).
