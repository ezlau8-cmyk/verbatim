# Verbatim for Google Docs — Developer guide

## Architecture

A single Apps Script project. Code lives in `appsscript/`; HTML for the
sidebar / modal dialogs is co-located.

```
appsscript/
├── appsscript.json     Manifest, OAuth scopes, add-on config
├── Code.gs             Entry points: onOpen, onInstall, showSidebar, menu
├── Util.gs             Shared helpers (regex, word count, scope resolution)
├── Styles.gs           Canonical style installation + apply
├── Formatting.gs       Cmd* wrappers + paste/highlight/underline/cite/etc
├── Cards.gs            Card cutting: F4–F7, move up/down, blank removal
├── Condense.gs         Condense / shrink / unshrink / uncondense
├── Paperless.gs        Send-to-speech, mark-card, new doc, word count
├── Migrate.gs          Word → Verbatim conversion (post Drive import)
├── Settings.gs         Profile, document-level prefs (pilcrow mode, etc.)
├── Sidebar.html        The sidebar UI
├── Help.html           Help modal
└── CheatSheet.html     Keyboard shortcuts modal
```

## Conventions

* All public functions are exposed to the menu/sidebar via the `cmd*`
  naming convention.
* "Private" helpers end in `_` (e.g. `condenseParagraph_`).
* Sidebar HTML invokes them via `google.script.run.withSuccessHandler(...).cmdX()`.
* Document model: always go through `DocumentApp.getActiveDocument()`
  and chain `.getBody()` then `.getParagraphs()` — never read raw XML.

## State

* Per-document settings: `PropertiesService.getDocumentProperties()`.
* Per-user profile: `PropertiesService.getUserProperties()`.
* Bound speech doc ID: stored in `DocumentProperties` (per-document).

## Adding a new command

1. Implement the function in the appropriate `*.gs` file. Name it
   `cmd<PascalCase>` for menu wiring and `<verb>_<something>_` for
   internals.
2. Register it in `Code.gs`'s `onOpen` menu.
3. Add a button to `Sidebar.html`.
4. Add a test in `test/harness.js` that:
   - Sets up a doc with the input paragraphs
   - Calls the function
   - Asserts on the resulting paragraph state
5. Run `node test/harness.js`.

## Adding a new paragraph style

Edit `installCanonicalStyles()` in `Styles.gs` and add the new name to
the `CANONICAL_STYLES` array in `Util.gs`. Document it in
`docs/USER_GUIDE.md`.

## Testing

The Node harness in `test/harness.js`:

* Loads `appsscript/*.gs` into a `vm` context.
* Provides a minimal mock `DocumentApp` / paragraph / text model.
* Exercises 37 assertions covering happy path, edge cases, large-doc
  stress.

Run it with `node test/harness.js`.

Limitations of the harness:

* Doesn't model: bookmarks, tables, images, footnotes.
* Doesn't model Google Docs' OAuth quota — those tests would need
  live deployment.
* Doesn't model real network latency.

For full integration testing, deploy to a test Apps Script project and
manually exercise the menu.

## Performance notes

`DocumentApp` API calls are individually cheap but each one round-trips
to Google's backend. For large docs:

* Iterate by `getBody().getParagraphs()` once and cache the array — every
  `paragraphs[i]` re-fetches.
* Batch updates: instead of `p.setBold(0, 100, true); p.setItalic(...)`,
  build a single attribute map: `p.setAttributes({ BOLD: true, ... })`.
* For text-runs with many small changes, prefer `p.editAsText()` once
  and reuse.
* Avoid `p.getText()` in tight loops (each call materializes the string).

For >500-paragraph docs, even simple "shrink all" can hit Apps Script's
6-minute execution limit. The current code is well within that for
docs up to ~3000 paragraphs.

## Security model

The add-on runs entirely on Google's servers via Apps Script. It:

* Has no external HTTP endpoint.
* Does not collect telemetry.
* Does not write to a third-party database.
* Cannot access docs the user hasn't opened in the current session.

The OAuth scopes are deliberately narrow:

* `documents.currentonly` (only the open doc).
* `script.container.ui` (for sidebar/modal).
* `drive.file` (only files the script creates).

That's the minimum needed for any Verbatim functionality. We **do
not** request `drive` (full Drive), `gmail`, `contacts`, or any
read-other-docs scope.

## Differences from Word Verbatim

| Aspect | Word VBA | Apps Script |
|---|---|---|
| Pilcrow representation | Hidden field code | U+00B6 character |
| Reading view | `View.Type = wdReadingView` | Docs' built-in mode |
| AutoHotKey plugins | OS-level hooks | Not applicable |
| Custom mouse cursors | Supported | Not applicable |
| VBA user forms | UI forms | HTML sidebar + modal |
| File-system access | Full | None (Drive only) |
| Macro security | Per-document Trust Center | OAuth consent |
| OCR | capture2text plugin | Not implemented |
| Caselist API | HTTP requests | Not implemented (use opencaselist.com directly) |

## Roadmap

Features on the near-term roadmap (no commitment):

* Quick Cards / Templated Cuts (sidebar templates)
* Speech doc auto-numbering (1NC, 2AC, etc.)
* Card sorting (by date, by author)
* Team-level style sharing (via a shared "config doc")

Contributions welcome. Open an issue or pull request on the upstream
repo.