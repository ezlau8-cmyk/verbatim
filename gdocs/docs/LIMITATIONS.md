# Limitations — Verbatim for Google Docs vs Word Verbatim

This is an honest list of what's missing or different. None of these
are blockers for normal debate use, but they are real.

## Not implemented (yet)

### OCR (capture2text)
The Word version integrates with `capture2text.exe` to OCR scanned PDFs.
Apps Script can't drive an OCR binary. Workaround: use Google Drive's
built-in OCR on upload (right-click a PDF in Drive → "Open with Google
Docs"), then run **Migrate From Word** to clean up the result.

### openCaselist / Tabroom share
The Word version talks directly to `api.opencaselist.com` and
`share.tabroom.com`. Apps Script *could* talk to these — we deliberately
don't. Sharing debate evidence through a third party requires a privacy
review that we haven't done.

Workaround: use [openCaselist.com](https://www.opencaselist.com) and
[Tabroom](https://www.tabroom.com) directly in your browser.

### AutoOpen folder
The Word version watches a folder and auto-opens new files when you
add them. There's no equivalent in Apps Script — Drive has no real-time
folder-change API.

Workaround: keep all speech docs in a single Drive folder and pin it.

### Search (Everything / voidtools)
The Word version integrates with Everything Search for ultra-fast file
lookups. Apps Script doesn't have a host-level search hook.

Workaround: Drive's search is good enough for most uses.

### AHK plugins
`GetFromCiteCreator` and `NavPaneCycle` are AutoHotKey scripts that
intercept Word's UI. There's no equivalent in Google Docs.

`GetFromCiteCreator` could be ported as a Chrome extension. Out of
scope here.

### Mini variant
The upstream ships a "Mini" `.dotm` with features most likely to trip
antivirus removed. Apps Script doesn't have antivirus issues, so the
Mini variant is unnecessary.

### Custom mouse cursors / UI forms
Word VBA lets you build custom userforms. Our equivalent is the
sidebar HTML, which has fewer visual primitives.

### Invisibility On / Off via F-keys
Toggle works, but visibility state is per-paragraph-style rather than
per-document-flag (as in Word's View settings). Functionally identical
in practice.

### Style gallery customization
In Word you can change the Pocket/Hat/Block/Tag styles via the
Styles pane and the changes persist with the doc. In Google Docs
this is also true (right-click a Heading 1 → Update heading), but
the menu doesn't add a "Save my styles" button. The Install Styles
macro installs the canonical defaults; per-doc tweaks are saved with
the doc.

## Different (not missing, but worth noting)

### Pilcrow representation
Word: hidden field code, auto-collapses at print.
Google Docs: a literal U+00B6 character in the text run, 6pt when
shrunk. Looks identical to Word. Round-trips through .docx export.

### Selection modes
Word VBA macros use a sophisticated "if nothing selected, use current
heading" priority. Apps Script's `DocumentApp.getSelection()` returns
the current cursor or selection; our `resolveScope_` helper replicates
Word's priority order. There may be edge cases where the priority
differs — if you find one, file an issue.

### Macro execution limit
Word has no real execution-time limit. Apps Script has a 6-minute
hard cap. For multi-thousand-card "Unshrink All" runs, this can be a
real constraint. Mitigation: scripts are idempotent per-paragraph, so
running them again resumes from the start; on a 1000-card doc this is
comfortably under the limit.

### Style metadata round-tripping
A Verbatim GDocs doc saved as `.docx` keeps its heading levels and
formatting but loses Verbatim's named styles (`Pocket, Hat, etc.`).
The .docx imports back into Word with Word's generic `Heading 1`,
etc. — which is exactly what Verbatim Word users expect after a
`Convert To Default Styles` pass.

### OCR / Read-Out
The Word version has **no** send-to-speech either (despite a name
collision with our `Mark Card`). "Send to speech" in Word Verbatim
means send to a speech *document*, not audio. Same semantics here.

## Intentionally omitted

These features are upstream policy choices that we respect:

* **"Analytics" paragraph style** — upstream explicitly does not add
  one. We don't either.
* **Undertags** — upstream doesn't add an "undertags" style for notes
  inside cards, because it breaks automated cite parsing. We don't.
* **Shrinking below 4pt** — upstream caps at 4pt. We cap at 4pt.

## Performance budget

On a 1000-paragraph doc, our test harness exercises:

* `UnshrinkAll` — completes in <100ms on the harness (mock); expected
  ~2-5 seconds on real Docs.
* `RemovePilcrows` — completes in <50ms; expected <1s real.
* `MigrateFromWord` on a 500-paragraph doc — expected ~3-5s.

If you see a script time out (the 6-minute Apps Script limit), split
the doc into smaller files.

## Browser compatibility

Tested mentally for:

* Chrome 110+ (any platform)
* Safari 15+ (macOS / iPad)
* Firefox 110+ (any platform)
* Edge 110+ (Windows)

Internet Explorer is not supported (Apps Script doesn't run in IE).
Microsoft Edge "IE Mode" is not supported.

If you hit a bug specific to one browser, please file an issue with
your browser version.