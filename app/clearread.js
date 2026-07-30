'use strict';

/* ClearRead core: markdown → chunk parser, chunk-card renderer, per-chunk TTS.
   Contract: window.ClearRead = { parse, render, speak } (see AGENTS.md). */

(function () {

  var MAX_CHUNK_WORDS = 50;   // AGENTS.md: chunks ≤ ~50 words
  var MAX_LIST_WORDS = 120;   // a list stays one chunk unless huge
  var GIST_MAX_CHARS = 60;

  /* ---------------- inline markdown ---------------- */

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Renders **bold**, *italic*, `code`, [text](url) inside an escaped string.
  function renderInline(raw) {
    var codeSpans = [];
    // Protect inline code first so its contents are never styled.
    var s = raw.replace(/`([^`]+)`/g, function (_, code) {
      codeSpans.push('<code>' + escapeHtml(code) + '</code>');
      return '\x00' + (codeSpans.length - 1) + '\x00';
    });
    s = escapeHtml(s);
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\x00(\d+)\x00/g, function (_, i) {
      return codeSpans[Number(i)];
    });
    return s;
  }

  // Plain text (for TTS + gists): strips markdown markers.
  function stripInline(raw) {
    return raw
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();
  }

  /* ---------------- helpers ---------------- */

  function wordCount(s) {
    var m = s.trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function splitSentences(s) {
    // Split after ., !, ? followed by whitespace + capital/quote/digit.
    var parts = s.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
    return parts ? parts.map(function (p) { return p.trim(); }).filter(Boolean) : [s];
  }

  function truncateGist(s) {
    s = s.trim();
    if (s.length <= GIST_MAX_CHARS) return s;
    var cut = s.slice(0, GIST_MAX_CHARS);
    var lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 30) cut = cut.slice(0, lastSpace);
    return cut.replace(/[,.;:!?]+$/, '') + '…';
  }

  /* ---------------- block parsing ---------------- */

  // Splits markdown into typed blocks:
  //   {type:'heading', level, text} | {type:'para', text}
  //   {type:'list', ordered, items:[...]} | {type:'code', text}
  function parseBlocks(markdown) {
    var lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    var blocks = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      var fence = line.match(/^```/);
      if (fence) {
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // skip closing fence
        blocks.push({ type: 'code', text: code.join('\n') });
        continue;
      }

      var heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
        i++;
        continue;
      }

      var listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+/);
      if (listMatch) {
        var ordered = /\d/.test(listMatch[1]);
        var items = [];
        while (i < lines.length) {
          var m = lines[i].match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
          if (m) { items.push(m[1]); i++; }
          else if (/^\s+\S/.test(lines[i]) && items.length) {
            // continuation line of the previous item
            items[items.length - 1] += ' ' + lines[i].trim();
            i++;
          } else break;
        }
        blocks.push({ type: 'list', ordered: ordered, items: items });
        continue;
      }

      // paragraph: consume until blank line or another block starter
      var para = [line.trim()];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
             !/^(#{1,3})\s/.test(lines[i]) && !/^```/.test(lines[i]) &&
             !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        para.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'para', text: para.join(' ') });
    }
    return blocks;
  }

  /* ---------------- chunk building ---------------- */

  function makeChunk(gistSource, heading, text, html) {
    // Gist is always the chunk's own opening sentence; the heading becomes a
    // section title rendered separately (so sibling chunks never share a gist).
    var gist = truncateGist(splitSentences(stripInline(gistSource))[0] || gistSource);
    return { gist: gist, text: text, html: html, section: heading || null };
  }

  // Groups sentences into runs of ≤ MAX_CHUNK_WORDS words.
  function groupSentences(sentences) {
    var groups = [];
    var cur = [];
    var curWords = 0;
    sentences.forEach(function (s) {
      var w = wordCount(s);
      if (cur.length && curWords + w > MAX_CHUNK_WORDS) {
        groups.push(cur.join(' '));
        cur = []; curWords = 0;
      }
      cur.push(s); curWords += w;
    });
    if (cur.length) groups.push(cur.join(' '));
    return groups;
  }

  function parse(markdown) {
    var blocks = parseBlocks(markdown);
    var chunks = [];
    var currentHeading = null;

    blocks.forEach(function (block) {
      if (block.type === 'heading') {
        currentHeading = stripInline(block.text);
        return;
      }

      if (block.type === 'code') {
        var codeHtml = '<pre><code>' + escapeHtml(block.text) + '</code></pre>';
        chunks.push(makeChunk('Code example', currentHeading, block.text, codeHtml));
        return;
      }

      if (block.type === 'list') {
        var tag = block.ordered ? 'ol' : 'ul';
        var totalWords = block.items.reduce(function (n, it) { return n + wordCount(it); }, 0);
        var itemGroups;
        if (totalWords > MAX_LIST_WORDS && block.items.length > 3) {
          // huge list: split into halves-ish groups of items
          var per = Math.ceil(block.items.length / Math.ceil(totalWords / MAX_LIST_WORDS));
          itemGroups = [];
          for (var k = 0; k < block.items.length; k += per) {
            itemGroups.push(block.items.slice(k, k + per));
          }
        } else {
          itemGroups = [block.items];
        }
        itemGroups.forEach(function (items) {
          var html = '<' + tag + '>' + items.map(function (it) {
            return '<li>' + renderInline(it) + '</li>';
          }).join('') + '</' + tag + '>';
          var text = items.map(stripInline).join('. ');
          chunks.push(makeChunk(items[0], currentHeading, text, html));
        });
        return;
      }

      // paragraph — split at sentence boundaries when > ~50 words
      var plain = stripInline(block.text);
      if (wordCount(block.text) > MAX_CHUNK_WORDS) {
        var sentences = splitSentences(block.text);
        groupSentences(sentences).forEach(function (part) {
          chunks.push(makeChunk(part, currentHeading, stripInline(part),
            '<p>' + renderInline(part) + '</p>'));
        });
      } else {
        chunks.push(makeChunk(block.text, currentHeading, plain,
          '<p>' + renderInline(block.text) + '</p>'));
      }
    });

    // tldr is null here: demos/live callers supply their own; the renderer
    // labels chunk 1 "Main point" when tldr is null.
    return { tldr: null, chunks: chunks };
  }

  /* ---------------- TTS ---------------- */

  var currentUtterance = null;
  var currentAudio = null;        // ElevenLabs playback
  var speakGeneration = 0;        // invalidates in-flight EL fetches on stop

  // Optional ElevenLabs voice. The key lives ONLY in the reader's own
  // localStorage (never in this repo); falls back to Web Speech on any error.
  var EL_KEY_STORAGE = 'clearread-elevenlabs-key';
  var EL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "Rachel", a clear default voice

  function elevenLabsKey() {
    // local-config.js (gitignored) wins; the Voice-settings field is the fallback.
    var cfg = window.CLEARREAD_CONFIG;
    if (cfg && typeof cfg.elevenLabsKey === 'string' && cfg.elevenLabsKey.trim()) {
      return cfg.elevenLabsKey.trim();
    }
    try { return localStorage.getItem(EL_KEY_STORAGE) || ''; } catch (e) { return ''; }
  }

  function speakBrowser(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; // slightly slow for comfortable listening
    u.onend = function () {
      if (currentUtterance === u) currentUtterance = null;
      if (onEnd) onEnd();
    };
    u.onerror = u.onend;
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  }

  function speakElevenLabs(text, key, onEnd) {
    var gen = ++speakGeneration;
    fetch('https://api.elevenlabs.io/v1/text-to-speech/' + EL_VOICE_ID, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, model_id: 'eleven_turbo_v2_5' })
    }).then(function (res) {
      if (!res.ok) throw new Error('ElevenLabs ' + res.status);
      return res.blob();
    }).then(function (blob) {
      if (gen !== speakGeneration) return; // stopped while fetching
      var audio = new Audio(URL.createObjectURL(blob));
      currentAudio = audio;
      audio.onended = function () {
        if (currentAudio === audio) currentAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = audio.onended;
      audio.play();
    }).catch(function () {
      if (gen !== speakGeneration) return;
      speakBrowser(text, onEnd); // graceful fallback
    });
  }

  function speak(text, onEnd) {
    stopSpeaking(); // one utterance at a time
    var key = elevenLabsKey();
    if (key) speakElevenLabs(text, key, onEnd);
    else speakBrowser(text, onEnd);
  }

  function stopSpeaking() {
    speakGeneration++;
    currentUtterance = null;
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  /* ---------------- renderer ---------------- */

  function setExpanded(head, body, expanded) {
    head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (expanded) body.removeAttribute('hidden');
    else body.setAttribute('hidden', '');
  }

  function render(containerEl, data) {
    var tldr = data.tldr;
    var chunks = data.chunks || [];
    containerEl.innerHTML = '';

    var speakingCard = null; // the card currently highlighted for TTS

    function clearSpeaking() {
      if (speakingCard) {
        speakingCard.classList.remove('cr-speaking');
        var btn = speakingCard.querySelector('.cr-speak-btn');
        if (btn) {
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Read this section aloud');
        }
        speakingCard = null;
      }
    }

    // TL;DR card
    if (tldr) {
      var tldrCard = document.createElement('div');
      tldrCard.className = 'cr-tldr';
      var label = document.createElement('span');
      label.className = 'cr-tldr-label';
      label.textContent = 'TL;DR';
      var sentence = document.createElement('p');
      sentence.className = 'cr-tldr-text';
      sentence.textContent = tldr;
      tldrCard.appendChild(label);
      tldrCard.appendChild(sentence);
      containerEl.appendChild(tldrCard);
    }

    // Toolbar: chunk count + focus mode + expand/collapse all
    var toolbar = document.createElement('div');
    toolbar.className = 'cr-toolbar';
    var countLabel = document.createElement('span');
    countLabel.className = 'cr-count';
    countLabel.textContent = chunks.length + ' short chunk' + (chunks.length === 1 ? '' : 's');
    toolbar.appendChild(countLabel);
    var focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'cr-focus-btn';
    focusBtn.textContent = '🎯 Read one at a time';
    focusBtn.setAttribute('aria-pressed', 'false');
    var expandAllBtn = document.createElement('button');
    expandAllBtn.type = 'button';
    expandAllBtn.textContent = '▾ Open all';
    expandAllBtn.setAttribute('aria-label', 'Open all chunks');
    var collapseAllBtn = document.createElement('button');
    collapseAllBtn.type = 'button';
    collapseAllBtn.textContent = '▴ Close all';
    collapseAllBtn.setAttribute('aria-label', 'Close all chunks');
    toolbar.appendChild(focusBtn);
    toolbar.appendChild(expandAllBtn);
    toolbar.appendChild(collapseAllBtn);
    containerEl.appendChild(toolbar);

    var list = document.createElement('div');
    list.className = 'cr-chunks';
    containerEl.appendChild(list);

    var toggles = [];
    var cards = [];
    var shownSection = null;

    chunks.forEach(function (chunk, idx) {
      // Markdown headings become section titles that group related chunks.
      if (chunk.section && chunk.section !== shownSection) {
        shownSection = chunk.section;
        var sectionTitle = document.createElement('h3');
        sectionTitle.className = 'cr-section-title';
        sectionTitle.textContent = chunk.section;
        list.appendChild(sectionTitle);
      }

      var card = document.createElement('article');
      card.className = 'cr-chunk';

      var head = document.createElement('div');
      head.className = 'cr-chunk-head';
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', 'false');

      var gist = document.createElement('span');
      gist.className = 'cr-chunk-gist';
      // No tldr from the source? Give the first card an orienting label.
      gist.textContent = (!tldr && idx === 0) ? 'Main point — ' + chunk.gist : chunk.gist;

      var speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'cr-speak-btn';
      // Inline SVG speaker: renders crisply everywhere (emoji fallbacks vary).
      speakBtn.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>' +
        '<path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" ' +
        'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      speakBtn.setAttribute('aria-label', 'Read this section aloud');
      speakBtn.setAttribute('aria-pressed', 'false');

      var chevron = document.createElement('span');
      chevron.className = 'cr-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '▶'; // ▶ rotates via CSS when expanded

      head.appendChild(gist);
      head.appendChild(speakBtn);
      head.appendChild(chevron);

      var body = document.createElement('div');
      body.className = 'cr-chunk-body';
      body.setAttribute('hidden', '');
      body.innerHTML = chunk.html;

      function toggle(force) {
        var expand = typeof force === 'boolean'
          ? force
          : head.getAttribute('aria-expanded') !== 'true';
        setExpanded(head, body, expand);
      }
      toggles.push(toggle);

      head.addEventListener('click', function (e) {
        if (e.target === speakBtn) return;
        toggle();
      });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          toggle();
        }
      });

      speakBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (speakingCard === card) { // clicking again stops
          stopSpeaking();
          clearSpeaking();
          return;
        }
        stopSpeaking();
        clearSpeaking();
        toggle(true); // speaking auto-expands
        card.classList.add('cr-speaking');
        speakBtn.setAttribute('aria-pressed', 'true');
        speakBtn.setAttribute('aria-label', 'Stop reading aloud');
        speakingCard = card;
        speak(chunk.text, function () {
          if (speakingCard === card) clearSpeaking();
        });
      });

      card.appendChild(head);
      card.appendChild(body);
      list.appendChild(card);
      cards.push(card);
    });

    expandAllBtn.addEventListener('click', function () {
      toggles.forEach(function (t) { t(true); });
    });
    collapseAllBtn.addEventListener('click', function () {
      toggles.forEach(function (t) { t(false); });
    });

    /* ----- focus mode: one chunk at a time ----- */

    var nav = document.createElement('div');
    nav.className = 'cr-focus-nav';
    nav.hidden = true;
    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'cr-nav-btn';
    prevBtn.textContent = '◀ Back';
    var middle = document.createElement('div');
    middle.className = 'cr-focus-progress';
    var counter = document.createElement('span');
    counter.className = 'cr-focus-counter';
    counter.setAttribute('aria-live', 'polite');
    var dotsRow = document.createElement('span');
    dotsRow.className = 'cr-focus-dots';
    dotsRow.setAttribute('aria-hidden', 'true');
    var dots = chunks.map(function () {
      var d = document.createElement('span');
      d.className = 'cr-dot';
      dotsRow.appendChild(d);
      return d;
    });
    middle.appendChild(counter);
    middle.appendChild(dotsRow);
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'cr-nav-btn';
    nextBtn.textContent = 'Next ▶';
    nav.appendChild(prevBtn);
    nav.appendChild(middle);
    nav.appendChild(nextBtn);
    containerEl.appendChild(nav);

    var focusIdx = -1; // -1 = normal list mode

    function updateFocus() {
      cards.forEach(function (c, j) { c.hidden = j !== focusIdx; });
      toggles[focusIdx](true);
      counter.textContent = (focusIdx + 1) + ' of ' + chunks.length;
      dots.forEach(function (d, j) {
        d.className = 'cr-dot' + (j < focusIdx ? ' cr-dot-done' : j === focusIdx ? ' cr-dot-now' : '');
      });
      prevBtn.disabled = focusIdx === 0;
      nextBtn.textContent = focusIdx === chunks.length - 1 ? 'Done ✓' : 'Next ▶';
    }

    function enterFocus(i) {
      focusIdx = Math.max(0, Math.min(i, chunks.length - 1));
      list.classList.add('cr-focusing');
      nav.hidden = false;
      focusBtn.setAttribute('aria-pressed', 'true');
      focusBtn.textContent = '📋 Show all chunks';
      updateFocus();
    }

    function exitFocus() {
      focusIdx = -1;
      list.classList.remove('cr-focusing');
      nav.hidden = true;
      focusBtn.setAttribute('aria-pressed', 'false');
      focusBtn.textContent = '🎯 Read one at a time';
      cards.forEach(function (c) { c.hidden = false; });
    }

    focusBtn.addEventListener('click', function () {
      if (focusIdx === -1) enterFocus(0); else exitFocus();
    });
    prevBtn.addEventListener('click', function () {
      if (focusIdx > 0) { focusIdx--; updateFocus(); }
    });
    nextBtn.addEventListener('click', function () {
      if (focusIdx < chunks.length - 1) { focusIdx++; updateFocus(); }
      else exitFocus(); // "Done ✓" on the last chunk
    });

    // Arrow keys page through chunks while in focus mode.
    if (containerEl._crKeyHandler) {
      document.removeEventListener('keydown', containerEl._crKeyHandler);
    }
    containerEl._crKeyHandler = function (e) {
      if (focusIdx === -1 || !containerEl.isConnected) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
    };
    document.addEventListener('keydown', containerEl._crKeyHandler);
  }

  window.ClearRead = { parse: parse, render: render, speak: speak };
})();
