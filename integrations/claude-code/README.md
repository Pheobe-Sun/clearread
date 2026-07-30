# ClearRead × Claude Code

Open your latest Claude Code answer as a dyslexia-friendly ClearRead view —
no copy/paste. Dependency-free (POSIX sh + python3, both already on macOS).

## One command

```sh
integrations/claude-code/clearread-last
```

Run it from anywhere inside a project (or pass `--project <dir>`). It finds
the project's most recently modified session transcript under
`~/.claude/projects/`, extracts the text of the **last assistant message**,
prints a one-line summary, and pipes the markdown into `bin/clearread`,
which writes `app/live-answer.js` and opens `app/demo.html`.

Set `CLEARREAD_NO_OPEN=1` to capture without opening the browser.

## Optional: auto-open after every answer (Stop hook)

`settings-snippet.json` holds the exact hook config (JSON can't carry
comments, so it's explained here). Merge its `"hooks"` block into the
project's `.claude/settings.json` (or `settings.local.json`):

- `Stop` fires every time Claude Code finishes responding; it takes no
  matcher, so the entry is just `{"hooks": [ … ]}`.
- The command is a one-liner invoking clearread-last via
  `$CLAUDE_PROJECT_DIR`, which Claude Code sets to the project root — so
  the snippet works verbatim from any checkout location.
- Remove the block (or the file) to turn it off. To use it from another
  project, keep `--project "$CLAUDE_PROJECT_DIR"` but make the script path
  absolute (e.g. `/path/to/interface_for_dyslexia/integrations/claude-code/clearread-last`).

## Privacy

Strictly read-only over your local transcript files
(`~/.claude/projects/<flattened-path>/<session>.jsonl`). Nothing is
uploaded or modified; the only file written is `app/live-answer.js`.
