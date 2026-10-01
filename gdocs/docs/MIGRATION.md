# Migrating from Word Verbatim

If you've been using the Word `.dotm` template, you can move your whole
library to Google Docs with minimal rework.

## The fast path

1. **Open your Word file in Drive.** Drag the `.docx` (or `.docm`) into
   Google Drive in your browser. Drive auto-converts it to a Google Doc
   and opens it in Docs.

2. **Run the migration menu.**
   *Extensions → Verbatim for Google Docs → Tools → Migrate From Word.*

   This walks the document and re-applies the canonical Verbatim styles
   to anything that came through as Word's built-in Headings 1–4.
   Bold paragraphs that look like cite lines become Cite-styled.

3. **Install Styles.** If this is a fresh doc, click **Install Styles**
   in the sidebar first.

4. **Spot-check.**
   * Open the outline (View → Show document outline). The Pocket/Hat/
     Block/Tag hierarchy should be exactly what you had in Word.
   * Click on a "Tag" line — its paragraph style should say **Tag**.
   * Click on a card paragraph — it should be default body text.

5. **Fix-up if needed.** Common issues after migration:

   | Symptom | Fix |
   |---|---|
   | Empty heading entries in the outline | Sidebar → **Remove Blanks** |
   | A bold normal paragraph that *isn't* a cite | Select it → **Clear Formatting** (F12), then mark it as the right level |
   | Pilcrows missing or extra | **Uncondense** first; then re-condense with the mode you want |
   | Custom Verbatim styles you used | **Tools → Convert To Default Styles** maps them to canonical ones |

## What's lost in conversion

* **Word's per-character style attributes** (e.g. character spacing,
  manual letter widths). Google Docs handles these differently; the
  *visual* result is usually identical.
* **Word's Find/Replace formatting metadata**. Most Verbatim macros
  use Find/Replace, but the Apps Script equivalents operate on the
  in-memory document model.
* **Footnotes, endnotes, comments.** Comments migrate (they're
  preserved by Drive's conversion). Footnotes become inline
  references — not catastrophic but worth reviewing.
* **Tracked changes** are accepted or rejected by Drive on import.

## Bulk migration

For more than a few files, ask your team captain to run the script in
batch. There's a one-off helper at `appsscript/Migrate.gs` with
`migrateFromWord_(doc)` that takes a Document object. You can wire it
to a folder picker that iterates and converts:

```javascript
function migrateFolder() {
  const folder = DriveApp.getFolderById('FOLDER_ID');
  const files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
  let n = 0;
  while (files.hasNext()) {
    const f = files.next();
    const doc = DocumentApp.openById(f.getId());
    migrateFromWord_(doc);
    n++;
  }
  Logger.log('Migrated ' + n + ' files.');
}
```

Run that once on your backfiles folder and you're done.

## Verbatim ↔ Google Docs compatibility matrix

| Verbatim Word feature | Verbatim GDocs equivalent | Notes |
|---|---|---|
| Pocket/Hat/Block/Tag | Same — Heading 1–4 | Identical behavior |
| Cite paragraph | Bold NORMAL_TEXT | Use F8 |
| Highlight | Background color | Toggle F11 |
| Underline | Underline | Toggle F9 |
| Emphasis | Border + Bold | Toggle F10 |
| Shrink | Font size 11→8→7→6→5→4 | Toggle Alt+F3 |
| Condense | Whitespace collapse + ¶ insert | F3 / Ctrl+F3 |
| Pilcrow | U+00B6 character | Round-trips cleanly |
| Paste Text | Plain text paste | F2 |
| Send To Speech | Cross-doc append | Backtick |
| Mark Card | Red 16pt timestamp | Sidebar |
| Invisibility | White-on-white text | Ctrl+Shift+V |
| Reading View | Docs native reader | View → Mode |
| Custom styles | Mapped to Verbatim canon | Tools → Convert |
| OCR (capture2text) | NOT implemented | See LIMITATIONS |
| Caselist (openCaselist) | NOT implemented | Use caselist.paperlessdebate.com |
| Tabroom share | NOT implemented | Use Tabroom directly |
| AutoOpen folder | NOT implemented | Use Drive folder sync |
| Search (Everything) | Docs Ctrl+F | Native |
| Plugins (AHK) | NOT applicable | See LIMITATIONS |
| Mini (no-OCR) variant | N/A — already minimal | |

## Compatibility: round-tripping

Verbatim GDocs files saved as `.docx` (File → Download → Word) preserve:

* Headings 1–4
* Bold/italic/underline
* Background color (highlight)
* Font size
* Borders

What does NOT round-trip:

* ¶ pilcrow characters stay (good) but the "paragraph integrity"
  attribute is lost.
* Verbatim style names (`Pocket`, etc.) become generic `Heading 1`, etc.

So you can hand a Verbatim GDocs file to a Word Verbatim user and
they'll see almost everything — but they should re-run **Install
Styles** (which is what `Convert To Default Styles` does in Word) on
the file to recover the canonical names.