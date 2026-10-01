# Verbatim for Google Docs — User Guide

This guide covers the user-facing workflow. If you're new to Verbatim,
read [Quickstart](#quickstart) first.

---

## Quickstart

1. Open a Google Doc.
2. **Extensions → Verbatim for Google Docs → Open Verbatim sidebar.**
3. In the sidebar, click **Install Styles** (one time only).
4. Paste your evidence text into the doc.
5. **F3** to Condense, **⌥F3** to Shrink, **F11** to highlight the
   parts you want to read aloud, **F4–F7** to mark Pocket/Hat/Block/Tag.
6. Hit the **\`** (backtick) key or click **Send To Speech** to push the
   card to your speech doc.

That's it. The rest of this guide is the details.

## Document structure

Verbatim organizes a debate file into a strict hierarchy:

| Level | Style | Shortcut | Use |
|---|---|---|---|
| 1 | **Pocket** (Heading 1) | F4 | The whole file (e.g. "Negative – Warming") |
| 2 | **Hat** (Heading 2) | F5 | A major section ("Uniqueness", "Solvency") |
| 3 | **Block** (Heading 3) | F6 | A group of cards ("Uniqueness – Garcia 2020") |
| 4 | **Tag** (Heading 4) | F7 | One card |

Everything else is **card text** (a paragraph in default style).

A complete card:

```
[Heading 4]  TAG 1AC – Warming causes extinction
[NORMAL]    Aaron Hardy, 1-1-3000, "Verbatim Online Manual", https://paperlessdebate.com
[NORMAL]    Global warming will cause ¶ ¶ mass extinction ¶ by 2050...
            [highlighted: "mass extinction"]  [underlined: "by 2050"]
```

The Verbatim sidebar shows the same hierarchy in a clickable outline
(Google Docs' "Show document outline").

## Cutting workflow (step by step)

### 1. Get the source

You can paste from:

* **A PDF** — open the PDF in your browser, select text, copy. Use **F2**
  (Paste Text) to drop it unformatted into the doc.
* **A website** — same as PDF, but watch for "smart quotes" that become
  weird characters.
* **An existing Verbatim `.docx`** — open it in Google Drive (it auto-
  converts), then run **Tools → Migrate From Word** to re-apply canonical
  styles.

### 2. Condense (F3)

Removes whitespace; inserts ¶ (pilcrow) markers at paragraph breaks if
you have "Paragraph Integrity" on (default). One press cleans most
copy-paste jobs.

* **Ctrl/Cmd + F3** — condense without pilcrows (use this when the
  source already has many paragraph breaks, like a PDF).
* **Ctrl/Cmd + Alt + F3** — force pilcrows.

### 3. Shrink (Alt + F3)

Walks each paragraph's font size down: 11 → 8 → 7 → 6 → 5 → 4 → 11.
Only shrinks *un-underlined* runs. Cyclical.

* `Cmd/Ctrl + Alt + F3` (with pilcrows) → text gets smaller and ¶ stay.
* Use **Unshrink All** in the Tools menu to reset.

### 4. Highlight (F11) what to read

Click **Highlight** in the sidebar (or F11) to toggle yellow
highlighting on a selection. Debaters highlight the parts they actually
plan to read aloud. Cards become much faster at the podium when
un-highlighted text is just there for context.

### 5. Underline (F9) the "tags"

Tags inside the card (e.g. "the plan is net-beneficial") are the words
you emphasize when reading. Click **Underline** to toggle. Use **Auto
Underline** (Alt + F9) to underline the same word in every card at once.

### 6. Cite (F8) — the cite line

Each card has one cite paragraph in bold: `LastName, date, "title", url`.
Cite style is a NORMAL paragraph (not a Tag) so it doesn't show in the
document outline. Run **Auto Format Cite** (Ctrl/Cmd + F8) to detect
and bold the name+date automatically.

### 7. Mark Pocket/Hat/Block/Tag

* **F4** — turn the current paragraph into a Pocket (whole file).
* **F5** — Hat.
* **F6** — Block.
* **F7** — Tag.

The Navigation Pane (View → Show outline) updates immediately.

### 8. Send to Speech

Hit **\`** (backtick) or click **Send To Speech**. The current card
(or selection) is copied to the bound speech doc. The cursor stays in
the source doc.

* **\`** — paste at cursor in speech doc.
* **\` + Shift** (or sidebar button **→ End**) — paste at end of speech doc.

### 9. Mark Card

While you're in the **speech** doc, hit **Mark Card** in the sidebar.
It drops `~ Marked 14:32 ~` (red, 16pt) at the cursor so you can
review what you actually read later.

## Keyboard shortcuts

| Action | PC | Mac |
|---|---|---|
| Paste Text (unformatted) | F2 | F2 |
| Condense | F3 | F3 |
| Condense w/ pilcrows | Ctrl+Alt+F3 | Cmd+Opt+F3 |
| Condense no pilcrows | Ctrl+F3 | Cmd+F3 |
| Shrink | Alt+F3 | Opt+F3 |
| Pocket | F4 | F4 |
| Hat | F5 | F5 |
| Block | F6 | F6 |
| Tag | F7 | F7 |
| Cite | F8 | F8 |
| Auto Format Cite | Ctrl+F8 | Cmd+F8 |
| Underline | F9 | F9 |
| Emphasis | F10 | F10 |
| Highlight | F11 | F11 |
| Clear Formatting | F12 | F12 |
| Send To Speech | \` | \` |
| Send To Speech End | Alt+\` | Opt+\` |
| Move Up | Ctrl+Alt+↑ | Cmd+Opt+↑ |
| Move Down | Ctrl+Alt+↓ | Cmd+Opt+↓ |
| Move To Bottom | Ctrl+Alt+Shift+↓ | Cmd+Opt+Shift+↓ |
| Select Heading | Ctrl+Alt+A | Cmd+Opt+A |
| Delete Heading | Ctrl+Alt+← | Cmd+Opt+← |
| Auto Number Tags | Ctrl+# | Cmd+# |
| Select Similar | Ctrl+F2 | Cmd+F2 |
| New Speech | Ctrl+Shift+N | Cmd+Shift+N |
| Invisibility On/Off | Ctrl+Shift+V | Cmd+Shift+V |

**Browser conflicts:** Many F-keys are stolen by Chrome/Safari/Firefox.
If a shortcut doesn't fire, try the sidebar button instead, or click
in the doc body first (the focus has to be in the document, not the
sidebar or address bar).

## Speech doc workflow

A speech doc is just a regular Google Doc with the same Verbatim styles
installed. The sidebar's "Speech Doc" field binds one specific doc as
your active speech doc.

* **\`** to send cards in order as you cut them.
* **\`** then **→ End** to append.
* **Mark Card** to drop a timestamp.
* **Word Count** gives you a card-text-only count (good for
  self-policing speech length).

## Other useful commands

* **Tools → Insert Header** — your name + school in the doc header
  (good for printing).
* **Tools → Remove Blanks** — deletes empty heading paragraphs.
* **Tools → Remove Pilcrows** — strips ¶ characters.
* **Tools → Auto Number Tags** — `1.`, `2.`, ... prefixes on tags.
* **Tools → Remove Hyperlinks** — strips URLs-as-links.
* **View → Invisibility On/Off** — hides selected text (white-on-white).
  Useful for showing your partner a "shell" version.

## Coming from Word Verbatim

The Word desktop template is the source of truth for this port. Every
core action (cards, tags, citation, highlight, underline, emphasis,
shrink, condense, send-to-speech, mark-card, word count, headers,
pilcrows, marked-card compilation) is implemented.

**What's NOT in this version** (yet):

* OCR (capture2text)
* Caselist integration (openCaselist, tabroom share)
* Quick Cards / Templated Cuts (sidebar templates saved in user props
  are coming)
* Some paperless features that depend on OS-level file watching

See [LIMITATIONS.md](LIMITATIONS.md).

## Where's my stuff stored?

* **Per-document settings:** stored in the doc's properties (visible via
  Apps Script's PropertiesService).
* **Profile (name/school):** stored in your user properties.
* **Bound speech doc ID:** stored per-document.

Nothing leaves your Google account. The add-on makes no network calls
beyond the standard Google APIs.