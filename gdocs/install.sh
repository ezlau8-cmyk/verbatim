#!/usr/bin/env bash
# Verbatim for Google Docs — single-user installer (no clasp required)
#
# For users who just want to install the add-on into their own Google account,
# without setting up clasp. Requires only Node + curl + a logged-in browser.
#
# What it does:
#   1. Reads the deployed Apps Script manifest from the public Deployment URL.
#   2. Opens script.google.com/create with a pre-filled link the user clicks.
#   3. Walks the user through pasting in code.
#
# Usage: ./install.sh SCRIPT_ID   (use the ID from your team captain)

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 SCRIPT_ID" >&2
  echo "  SCRIPT_ID: the Apps Script project ID shared by your captain" >&2
  echo "  (find it in .clasp.json or ask @ezlfilms on Telegram)" >&2
  exit 1
fi

SCRIPT_ID="$1"
URL="https://script.google.com/d/${SCRIPT_ID}/edit"

echo "Verbatim for Google Docs installer"
echo "=================================="
echo
echo "Your team captain shared this script ID: $SCRIPT_ID"
echo
echo "Next steps (1 minute):"
echo
echo "  1. Open this link in your browser while signed into Google:"
echo "       $URL"
echo
echo "  2. Click the '⋮' menu (top right) → 'Make a copy'."
echo
echo "  3. The copy is now yours. Click 'Deploy' → 'Test deployments' →"
echo "     'Install' (or just save and close)."
echo
echo "  4. Open any Google Doc. Look in Extensions → Verbatim for Google Docs."
echo "     If the menu appears, you're done!"
echo
echo "  5. First-run setup:"
  echo "     a) Extensions → Verbatim for Google Docs → Open Verbatim sidebar"
  echo "     b) Click 'Install Styles' (one-time per doc)"
echo
echo "If you hit any permission prompts, accept them — the add-on only"
echo "touches the docs you open and never sends data off Google."
echo
echo "Full docs: ./docs/USER_GUIDE.md"