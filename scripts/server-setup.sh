#!/usr/bin/env bash
# Idempotent preparation of the hosting account (run from a machine with SSH access).
#   scripts/server-setup.sh                      contact-form config if missing; installs or updates
#                                                the publishing job (scripts/server-deploy.sh + cron),
#                                                the admin account tool and its weekly keepalive
#   PREVIEW_PASSWORD=... scripts/server-setup.sh also (re)set the preview-gate password
# The contact-form secret is generated on the server and never leaves it; the preview password
# travels over SSH stdin only and is stored there as a bcrypt hash. Approving changed server files
# of a build: ssh mihalovits '~/bin/mihalovits-deploy --approve <deploy commit>'.
# Admin accounts and the GitHub connection: ssh mihalovits '~/bin/mihalovits-admin' (see README).
set -euo pipefail

host="${DEPLOY_HOST:-mihalovits}"

ssh "$host" 'set -e; umask 022; mkdir -p ~/bin; cat > ~/bin/mihalovits-deploy.tmp
  chmod 755 ~/bin/mihalovits-deploy.tmp; mv ~/bin/mihalovits-deploy.tmp ~/bin/mihalovits-deploy' \
  < "$(dirname "$0")/server-deploy.sh"
ssh "$host" 'bash -s' <<'REMOTE'
set -euo pipefail
umask 022
cat > ~/bin/mihalovits-admin.tmp <<'SH'
#!/usr/bin/env bash
# Editor accounts and GitHub connection of the admin sign-in (installed by scripts/server-setup.sh).
exec /opt/alt/php84/usr/bin/php "$HOME/public_html/oauth/cli.php" "$@"
SH
chmod 755 ~/bin/mihalovits-admin.tmp
mv ~/bin/mihalovits-admin.tmp ~/bin/mihalovits-admin

jobs="$(crontab -l 2>/dev/null || true)"
add_job() { # <marker> <crontab line> <description>
  if grep -qF "$1" <<<"$jobs"; then
    echo "server-setup: $3 already in crontab"
  else
    jobs="$(printf '%s\n%s' "$jobs" "$2")"
    printf '%s\n' "$jobs" | crontab -
    echo "server-setup: $3 added to crontab"
  fi
}
add_job "bin/mihalovits-deploy" "* * * * * $HOME/bin/mihalovits-deploy >/dev/null 2>&1" "publishing job (every minute)"
# Renews the GitHub grant when no one has signed in for a month; failures are mailed by the tool.
add_job "bin/mihalovits-admin keepalive" "17 4 * * 1 $HOME/bin/mihalovits-admin keepalive >/dev/null 2>&1" \
  "GitHub grant renewal (weekly)"
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
