#!/usr/bin/env bash
# Idempotent preparation of the hosting account (run from a machine with SSH access).
#   scripts/server-setup.sh                      contact-form config if missing; installs or updates
#                                                the publishing job (scripts/server-deploy.sh + cron)
#   PREVIEW_PASSWORD=... scripts/server-setup.sh also (re)set the preview-gate password
# The contact-form secret is generated on the server and never leaves it; the preview password
# travels over SSH stdin only and is stored there as a bcrypt hash. Approving changed server files
# of a build: ssh mihalovits '~/bin/mihalovits-deploy --approve <deploy commit>'.
set -euo pipefail

host="${DEPLOY_HOST:-mihalovits}"

ssh "$host" 'set -e; umask 022; mkdir -p ~/bin; cat > ~/bin/mihalovits-deploy.tmp
  chmod 755 ~/bin/mihalovits-deploy.tmp; mv ~/bin/mihalovits-deploy.tmp ~/bin/mihalovits-deploy' \
  < "$(dirname "$0")/server-deploy.sh"
ssh "$host" 'bash -s' <<'REMOTE'
set -euo pipefail
jobs="$(crontab -l 2>/dev/null || true)"
if ! grep -qF "bin/mihalovits-deploy" <<<"$jobs"; then
  printf '%s\n* * * * * %s >/dev/null 2>&1\n' "$jobs" "$HOME/bin/mihalovits-deploy" | crontab -
  echo "server-setup: publishing job added to crontab (every minute)"
else
  echo "server-setup: publishing job already in crontab"
fi
REMOTE

ssh "$host" 'bash -s' <<'REMOTE'
set -euo pipefail
umask 077
mkdir -p ~/.config/mihalovits ~/.cache/mihalovits-contact
cfg=~/.config/mihalovits/contact.php
if [[ ! -f "$cfg" ]]; then
  secret=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  cat > "$cfg" <<PHP
<?php
return [
    'to' => 'info@mihalovits.eu',
    'from' => 'info@mihalovits.eu',
    'from_name' => 'mihalovits.eu weboldal',
    'site' => 'https://mihalovits.eu',
    'secret' => '$secret',
];
PHP
  echo "server-setup: created $cfg"
else
  echo "server-setup: $cfg already present, left unchanged"
fi
chmod 600 "$cfg"
REMOTE

if [[ -n "${PREVIEW_PASSWORD:-}" ]]; then
  printf '%s\n' "$PREVIEW_PASSWORD" | ssh "$host" '
    set -euo pipefail
    php=/opt/alt/php84/usr/bin/php
    mkdir -p ~/.htpasswds
    $php -r '\''$pw = rtrim((string) fgets(STDIN), "\n"); if (strlen($pw) < 12) { fwrite(STDERR, "password too short\n"); exit(1); } echo "elonezet:", password_hash($pw, PASSWORD_BCRYPT), "\n";'\'' > ~/.htpasswds/mihalovits-preview.tmp
    chmod 644 ~/.htpasswds/mihalovits-preview.tmp
    mv ~/.htpasswds/mihalovits-preview.tmp ~/.htpasswds/mihalovits-preview
    echo "server-setup: preview password updated (user: elonezet)"'
fi
