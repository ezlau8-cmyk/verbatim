# Troubleshooting

## The menu doesn't appear in Extensions

1. **Wait 30 seconds.** Apps Script caches add-on registration.
2. **Make sure you saved the script.** In the Apps Script editor,
   press Ctrl/Cmd+S. Save state is shown in the title bar.
3. **Hard reload** the Google Doc (Ctrl/Cmd+Shift+R) and reopen the
   Extensions menu.
4. **Confirm the script is bound to the doc**, not standalone.
   Apps Script add-ons are doc-bound. Standalone scripts can still
   work but require a different setup.

If the menu is grayed out or missing, the OAuth scopes weren't
approved. Re-visit `https://script.google.com` and click "Run" on any
function — that triggers the OAuth consent flow.

## "Permission denied" or "This app is blocked"

Workspace admins can restrict which OAuth scopes are permitted. The
admin needs to allow:

* `https://www.googleapis.com/auth/documents.currentonly`
* `https://www.googleapis.com/auth/script.container.ui`
* `https://www.googleapis.com/auth/drive.file`

If you're not the admin, talk to your IT person. The end-user can
also click "Advanced → Go to project (unsafe)" to proceed.

## "Scripts may not contain a function called X" or compile error

You probably copy-pasted code with smart quotes (`'` instead of `'`)
or em-dashes. Apps Script is strict about ASCII.

Open the script editor, find/replace:

* `'` → `'`
* `'` → `'`
* `"` → `"`
* `—` → `-`

Then save.

## Verbatim styles don't show after Install Styles

1. Re-open the doc — sometimes the Outline Pane caches.
2. View → Show document outline (or press Ctrl/Cmd+Alt+H in some
   browsers) — does it list headings?
3. If yes, the styles are there; you just need to use F4–F7 to apply
   them.
4. If no, the install didn't run. Re-click **Install Styles** in the
   sidebar.

## Condense deleted my pilcrows

Condense without pilcrows (Ctrl/Cmd+F3) does exactly that. Run
**Uncondense** (Ctrl/Cmd+Alt+Shift+F3) to restore.

## Send To Speech added cards in the wrong place

You probably had the cursor mid-paragraph when you hit **\`**. The
menu warns before doing so; if you didn't see the warning, your
prompt was auto-dismissed.

Use **\` + Shift** (Send To Speech End) for an unconditional append.

## Send To Speech says "no speech document"

Click **Speech Doc → Bind** in the sidebar and paste the URL of your
speech doc. The binding is per-document; switching to a new doc
requires re-binding.

## Keyboard shortcuts don't fire

**Browser conflict:** Chrome/Safari/Firefox capture F-keys for their
own use. Click in the document body first (not the sidebar). If the
shortcut still doesn't fire, use the sidebar button.

**Workspace conflict:** Ctrl/Cmd+Alt+key combinations are sometimes
reserved by Docs' built-in shortcuts (Table of contents, etc.).
Use the sidebar.

## "Quota exceeded" on a big doc

Google Apps Script has a 6-minute per-execution limit. If a single
command (like **Unshrink All** on a 5000-card doc) hits it:

1. Undo via Ctrl/Cmd+Z.
2. Run the command again — Apps Script resumes from where it left
   off (sort of; the operation is per-paragraph so each paragraph
   is idempotent).

Or split the file.

## I deleted a tag accidentally

Ctrl/Cmd+Z. Apps Script groups operations into one undoable batch when
they originate from a single menu call.

## The Cite paragraph is in the outline

It shouldn't be — Cite is NORMAL_TEXT with bold. If you see it in the
outline, you accidentally applied Heading 1 to it. Click the paragraph,
press F12 (Clear Formatting), then F8 (Cite).

## Migration from Word lost my custom styles

**Tools → Convert To Default Styles** maps unknown styles to the
closest canonical one. If a custom style is too exotic, the migration
preserves its name and the card remains a normal paragraph. You can
re-apply your custom mapping manually.

## Specific to Mac / Safari

* `Cmd+Opt+letter` shortcuts are sometimes captured by macOS itself
  (Spotlight, Mission Control). If a shortcut doesn't fire, disable
  the OS shortcut in System Settings → Keyboard → Shortcuts.
* F11 toggles "Show Desktop" by default. Disable in System Settings.

## Specific to school Chromebooks

* Some school policies block Apps Script entirely. There's no
  workaround from inside the policy — talk to your IT admin.
* If Apps Script is allowed but Drive file creation is restricted,
  the "New Speech Document" command will fail. Create the doc
  manually, then bind it via the sidebar.

## Still stuck?

Check `view → Show execution transcript` in the script editor after
running a command — it shows any errors. Or open `script.google.com`,
find the project, and read the Executions panel for stack traces.

If the issue is a code bug, file an issue on the upstream repo with
the transcript.