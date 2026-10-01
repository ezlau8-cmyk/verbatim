#!/usr/bin/env bash
# Verbatim for Google Docs — deploy script
#
# Pre-reqs:
#   - npm install -g @google/clasp   (https: https://github.com/google/clasp)
#   - clasp login                    (one-time Google account OAuth)
#
# Usage:
#   ./publish.sh                # push current code to the configured project
#   ./publish.sh --create       # create a NEW Apps Script project, push code
#   ./publish.sh --deploy       # push + create a versioned deployment
#
# The script writes the new script ID into .clasp.json on first run, so
# subsequent pushes Just Work.

set -euo pipefail

CREATE_NEW=false
DO_DEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --create) CREATE_NEW=true ;;
    --deploy) DO_DEPLOY=true ;;
  esac
done

if ! command -v clasp >/dev/null 2>&1; then
  echo "❌ clasp not found. Install: npm install -g @google/clasp" >&2
  exit 1
fi

cd "$(dirname "$0")"

if $CREATE_NEW; then
  echo "Creating new Apps Script project…"
  rm -f .clasp.json
  clasp create --type docs --title "Verbatim for Google Docs" --rootDir ./appsscript
  # Update .clasp.json with our conventions
  cat > .clasp.json <<'JSON'
{
  "rootDir": "./appsscript",
  "projectId": "verbatim-gdocs"
}
JSON
  echo "✅ Project created. ID:"
  clasp deployments 2>/dev/null || true
fi

echo "Pushing code…"
clasp push --force

if $DO_DEPLOY; then
  echo "Creating deployment…"
  VERSION=$(clasp version "v$(date +%Y.%m.%d.%H%M)" 2>/dev/null || echo "")
  clasp deploy -1 "Verbatim GDocs $(date +%Y-%m-%d)" || true
  echo
  echo "Done. To share with your team:"
  echo "  1. Each teammate opens https://script.google.com and signs in."
  echo "  2. They create a new blank script, then in Settings (⚙️) they paste"
  echo "     this project's Script ID into 'Script ID' under 'IDs'."
  echo "  3. Or: distribute this repo and have them run ./install.sh"
fi

echo
echo "Script ID is in .clasp.json. Share that ID or this directory."