# Changelog

## v1.0.0 — initial production release

### Supported features (1:1 with Word Verbatim)

* **Document structure** — Pocket/Hat/Block/Tag (Heading 1–4) with F-key shortcuts
* **Cite** paragraph style (F8)
* **Highlight** toggle (F11)
* **Underline** toggle (F9)
* **Emphasis** (border + bold) (F10)
* **Shrink** cycling 11→8→7→6→5→4 (Alt+F3)
* **Unshrink all** (Tools menu)
* **Condense** with pilcrow insertion (F3 / Ctrl+F3 / Ctrl+Alt+F3)
* **Uncondense** (Ctrl+Alt+Shift+F3)
* **Pilcrow character** (U+00B6, 6pt)
* **Paste Text** (F2) — plain-text paste prompt (Apps Script can't read OS clipboard)
* **Auto Format Cite** (Ctrl+F8) — bold name + date
* **Auto Number Tags** (Ctrl+#) and De-Number Tags
* **Move Up / Move Down / Move To Bottom** (Ctrl+Alt+↑/↓)
* **Select Heading and Content** (Ctrl+Alt+A)
* **Delete Heading** (Ctrl+Alt+←)
* **Remove Blanks** — delete empty heading paragraphs
* **Remove Pilcrows**
* **Remove Hyperlinks**
* **Convert To Default Styles** — map unknown styles to canonical
* **Select Similar Formatting** (Ctrl+F2)
* **Fix Formatting Gaps**
* **Insert Header** — sets name + school from profile
* **Word Count** — debate-style count, excluding pilcrows
* **Document Stats** — counts of Pocket/Hat/Block/Tag/Card
* **Send To Speech** (backtick) — cross-doc append at cursor
* **Send To Speech End** (Alt+backtick) — append at end
* **Mark Card** — red 16pt timestamp in speech doc
* **New Document / New Speech** — create from sidebar
* **Bind Speech Doc** — paste URL of speech doc
* **Invisibility On / Off / Toggle** (Ctrl+Shift+V)
* **Migration from Word** — re-applies canonical styles after Drive import
* **Plain-text conversion** — paste-to-card helper with pilcrow insertion
* **Auto Cite on selection** — bold name + date within the selected paragraphs

### Architecture

* Single Apps Script project, multi-file.
* Sidebar UI with dark theme.
* Modal dialogs for Help and Cheat Sheet.
* Per-document and per-user Properties for settings.

### Testing

* 37 unit tests in `test/harness.js` (Node-based vm sandbox).
* Stress tests: 1000-paragraph operations, edge cases (empty, pilcrow-only,
  5000-word paragraphs).
* All tests pass.

### Known limitations

See `docs/LIMITATIONS.md`. Headline items:

* OCR / Caselist / Tabroom share: out of scope (require external API).
* Mini variant: not needed (Apps Script doesn't trip antivirus).
* 6-minute Apps Script execution cap: irrelevant for normal-sized files.

### Bugs caught and fixed during development

* `paragraph()` parameter shadowed `text()` factory — fixed by renaming.
* `moveHeading_` used stale index after `removeFromParent` — fixed
  by recomputing the live array.
* Shrink size cache returned first range, not last — fixed by tracking
  latest-set per index.

### Bugs caught during testing (and fixed)

* Idempotency on re-condense verified.
* Empty paragraph condense does not throw.
* Pilcrow-only paragraph does not throw.
* 5000-word paragraph does not throw.
* Move-to-bottom relocates correctly.

### Future (not committed, backlog only)

* Quick Cards / Templated Cuts (sidebar templates saved in user props)
* Speech doc auto-numbering (1NC, 2AC, etc.)
* Card sorting (by date, by author)
* Team-level style sharing via a shared "config doc"
* OCR via Google Drive's built-in OCR pipeline
* openCaselist integration (subject to privacy review)