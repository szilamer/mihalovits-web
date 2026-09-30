#!/usr/bin/env bash
# One-time, idempotent preparation of the hosting account (run from a machine with SSH access).
#   scripts/server-setup.sh                      create the contact-form config if missing
#   PREVIEW_PASSWORD=... scripts/server-setup.sh also (re)set the preview-gate password
# The contact-form secret is generated on the server and never leaves it; the preview password
# travels over SSH stdin only and is stored there as a bcrypt hash.
set -euo pipefail

host="${DEPLOY_HOST:-mihalovits}"

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
