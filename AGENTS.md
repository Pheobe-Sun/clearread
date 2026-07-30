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
