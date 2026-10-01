# Deploying Verbatim for Google Docs to your team

Two deployment models:

* **Self-hosted, single captain.** One captain publishes the Apps Script
  and shares the script ID with teammates. Each teammate makes a
  personal copy. **(Recommended for most debate teams.)**
* **Workspace Marketplace listing.** (Not viable for this repo in the
  short term; covered briefly at the end.)

## Self-hosted deployment

### Prerequisites

* Node 18+ (`node --version`)
* A Google account that can create Apps Script projects (any Gmail or
  Workspace account, unless explicitly disabled by your org's admin)
* `npm install -g @google/clasp` and `clasp login` (one-time)

### First-time publish

```sh
git clone <this-repo>
cd verbatim-gdocs/gdocs
./publish.sh --create --deploy
```

The script will:

1. Create a new Apps Script project bound to a Google Doc container.
2. Push all `.gs` and `.html` files.
3. Print the resulting script ID.

### Sharing with your team

Send each teammate:

1. The **script ID** (a 44-character string).
2. The `./install.sh` script (or just the install instructions in
   [INSTALL.md](INSTALL.md)).

Each teammate does:

```sh
./install.sh SCRIPT_ID
# Follow the on-screen instructions: open URL, Make a copy.
```

Each teammate now has their **own copy** of the script. They can install
it themselves; no OAuth sharing with the captain is needed.

### Updating

When you push a new version:

```sh
./publish.sh --deploy
# or:
clasp push --force && clasp deploy -1 "v$(date +%Y.%m.%d)"
```

Teammates don't auto-update. To roll out, send them the new script ID
(after the new deployment). They re-run `install.sh` to copy the
updated version. (Apps Script doesn't have a "managed deployment"
channel for add-ons shared via Make-a-copy.)

### How the captain's account gets involved

The captain's account is the **owner of the Apps Script project**.
It owns no user data. The OAuth scopes granted by each teammate
when they Make-a-copy go from *their* account to *their* copy.

So:

* The captain's account is **not** involved in any teammate's doc
  accesses.
* Nothing flows through the captain's account.
* If the captain revokes access on their account, existing
  teammates' copies keep working (they're independent Apps Script
  projects).

This is the safest "1 captain → 30 teammates" model Google Apps
Script offers without a Marketplace listing.

## Workspace Marketplace listing

Requires:

* A Google Cloud project.
* A verified publisher account.
* OAuth verification (multi-week).
* Listing review.

Not recommended unless you're going to deploy across many schools.
The self-hosted model above is sufficient for a single team.

If you do want to list on Marketplace, the relevant configuration:

* `oauthScopes` in `appsscript.json` already restrict to:
  * `documents.currentonly`
  * `script.container.ui`
  * `drive.file`
* Add `addOns.common.homepageTrigger.runFunction = "onHomepage"`.
* Build a Marketplace listing via Google Cloud Console.

## Permissions & security

Verbatim for Google Docs requests only the minimum scopes:

| Scope | Why |
|---|---|
| `documents.currentonly` | Read/edit the **currently open** document. Cannot touch other docs in your Drive. |
| `script.container.ui` | Show the sidebar and modals. Required by any add-on. |
| `drive.file` | Create new docs (e.g. "New Speech Document"). Scoped to files this script creates. |

It does **not** request:

* `drive` (full Drive access) — we never read other docs you didn't open.
* `gmail.send` or any mail scope.
* Any contact/calendar/photos scope.

The script never makes external HTTP requests. All processing is
client-side in Apps Script. Your documents stay inside your Google account.

For workspace admins: this is the same scope set as Google Docs'
built-in "Outline" / "Translate" add-ons.

## Troubleshooting a deployment

* **`clasp push` fails with permission denied.** Re-run `clasp login`
  and ensure the account you sign in with has Apps Script enabled.
* **Teammate gets "Apps Script is disabled for your organization".**
  Workspace admin needs to allow Apps Script in the Admin Console.
* **Teammate gets OAuth consent screen with "unverified app"
  warning.** That's normal for self-published scripts; click
  "Advanced → Go to project (unsafe)" once. To remove the warning
  entirely, the captain can file an OAuth verification request, but
  that's usually overkill for a debate team.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for user-side problems.