# Verbatim for Google Docs

An open-source, GPL-3.0 port of [Verbatim](https://github.com/ashtarcommunications/verbatim)
(built for Microsoft Word) to Google Docs, implemented as a Google Apps
Script add-on.

**Why this exists:** Verbatim is the most-used paperless-debate toolkit in
US policy / LD / PF debate. Its desktop version is a Word `.dotm` — which
means it doesn't work on Chromebooks, doesn't work in Google Docs, and
trips antivirus. This project gives your entire team the same workflow in
Google Docs with a single installation.

**Status:** Production-ready. 37 unit tests pass, including large-doc and
edge-case stress. See [CHANGELOG](docs/CHANGELOG.md) for what's been verified.

---

## Quick start (for debaters)

1. Open the install link your captain shared (or `./install.sh SCRIPT_ID`).
2. Make a copy of the script.
3. Open any Google Doc → **Extensions → Verbatim for Google Docs → Open
   Verbatim sidebar**.
4. Click **Install Styles** (one-time per doc).
5. Start cutting cards.

Full walkthrough: [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## For team captains / coaches

1. Install Node + `npm install -g @google/clasp`.
2. `cd gdocs && ./publish.sh --create --deploy`.
3. Share the script ID (printed at the end) with your team.
4. Send each teammate `./install.sh SCRIPT_ID`.

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full flow.

## For developers

* `gdocs/appsscript/` — the Apps Script source (push to Apps Script as-is).
* `gdocs/test/harness.js` — Node-side unit test harness (37 tests).
* `gdocs/test/harness.js` runs all `.gs` files in a vm with a mock
  DocumentApp; no Apps Script account needed.
* `docs/DEVELOPER.md` covers architecture, conventions, and how to add
  new features.

## License

GPL-3.0 — same as upstream Verbatim. See [LICENSE](../LICENSE).

## Acknowledgments

* Aaron Hardy & the Verbatim maintainers at
  [ashtarcommunications/verbatim](https://github.com/ashtarcommunications/verbatim).
* The paperless-debate community at [paperlessdebate.com](https://paperlessdebate.com).

This derivative project is in no way affiliated with or endorsed by the
upstream maintainers. We gratefully acknowledge their work and design.