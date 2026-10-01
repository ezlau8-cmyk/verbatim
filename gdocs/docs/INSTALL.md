# Installing Verbatim for Google Docs

You have two paths:

* **(A) Use a pre-built copy from your captain / teammate.** They should
  send you a script ID and a one-liner. Skip to step 3.

* **(B) Build your own copy from source.** You need `npm` and
  `@google/clasp`. See [DEPLOY.md](DEPLOY.md) for full instructions; the
  quick version is:

  ```sh
  npm install -g @google/clasp
  clasp login
  cd gdocs
  ./publish.sh --create --deploy
  # Note the printed SCRIPT_ID
  ```

3. **Install in your account.**

   Open this URL (replace `YOUR_SCRIPT_ID` with the ID from step 1 or 2):

   ```
   https://script.google.com/d/YOUR_SCRIPT_ID/edit
   ```

   Sign in with the Google account you want to use for debate. Click the
   "⋮" menu (top right) → **Make a copy**.

   The copy is now yours. You can rename it ("My Verbatim") if you like.

4. **Verify the menu appears.**

   Open any Google Doc → **Extensions**. You should see "Verbatim for Google
   Docs" in the list. Click it → **Open Verbatim sidebar**.

   If the menu doesn't appear: make sure you saved the script after
   making the copy. Apps Script may need ~30s to register the add-on.

5. **First-run setup per doc:**

   * In the sidebar, click **Install Styles**.
   * The Verbatim styles (`Pocket`, `Hat`, `Block`, `Tag`, `Cite`,
     `VerbatimCard`) are now installed in this document.

6. **Bind your speech doc (optional but recommended):**

   * Create a Google Doc called "Speech" (or open an existing one).
   * Copy its URL.
   * In the Verbatim sidebar, paste the URL under "Speech Doc" → **Bind**.

   Now every "Send To Speech" copies the current card to that doc.

7. **Test the workflow:**

   * Type a paragraph of text.
   * Press **F3** (or click Condense) → whitespace collapses.
   * Press **⌥F3** (or click Shrink) → font shrinks to 8pt.
   * Select a few words, press **F11** → they turn yellow.
   * Press **F4** → the paragraph becomes a Pocket (Heading 1).

   You're set.

---

## School-managed Google Workspace accounts

Some schools restrict Apps Script or block add-on installations. If you
hit "Apps Script is disabled", talk to your IT admin — they need to:

* Allow Apps Script for the OU.
* (Optional) Pre-approve the OAuth scopes `documents.currentonly`,
  `script.container.ui`, and `drive.file` in the Admin Console under
  **Apps → Additional Google services → Drive / Docs**.

Alternatively, your captain can build the project on a personal account
and share copies via "Make a copy" to teammates — that bypasses the
workspace-level restriction for the script itself.

## Chromium / Mac / Windows

Verbatim works the same in any modern browser. Some F-key shortcuts are
captured by the browser on macOS — see [USER_GUIDE.md](USER_GUIDE.md#keyboard-shortcuts)
for workarounds.

## Uninstall

* **Sidebar:** Open the script at `https://script.google.com`, click
  the trash icon next to the project.
* **Per-document:** There's nothing to uninstall per-document. The
  styles are part of the doc; you can leave them or rename them in
  the Styles panel.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if anything goes wrong.