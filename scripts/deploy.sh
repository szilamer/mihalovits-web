#!/usr/bin/env bash
# Manual publishing from a developer machine over SSH (rsync). The regular path is GitHub Actions
# plus the host's pull job (scripts/server-deploy.sh), which replaces a manual upload on its next run.
# The host only accepts SSH from allowed networks, not from GitHub's runners.
#   npm run deploy                build, then upload (preview gate stays on unless SITE_PREVIEW=off)
#   npm run deploy -- --dry-run   list what would change on the server, upload nothing
# Env: DEPLOY_TARGET (default mihalovits:public_html/, the Host alias from ~/.ssh/config),
#      SKIP_BUILD=1 to upload an already built out/.
set -euo pipefail
cd "$(dirname "$0")/.."

target="${DEPLOY_TARGET:-mihalovits:public_html/}"
dry_run=()
if [[ "${1:-}" == "--dry-run" ]]; then dry_run=(--dry-run); fi

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  npm run build
fi

for f in out/index.html out/404.html out/.htaccess out/contact.php; do
  [[ -f "$f" ]] || { echo "deploy: $f missing – aborting" >&2; exit 1; }
done
if grep -q "__CSP_SCRIPT_HASHES__" out/.htaccess; then
  echo "deploy: out/.htaccess was not post-processed – aborting" >&2
  exit 1
fi

# No -p: existing permissions on the host (public_html is 750 root-managed group) stay untouched.
# Excluded paths are also protected from --delete: .well-known holds the host's ACME challenges.
rsync -rltz --delete-after --delay-updates --itemize-changes \
  --exclude='/.well-known/' \
  ${dry_run[@]+"${dry_run[@]}"} \
  out/ "$target"
