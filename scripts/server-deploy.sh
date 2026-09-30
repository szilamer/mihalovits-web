#!/usr/bin/env bash
# Publishes the site on the host (installed by scripts/server-setup.sh as ~/bin/mihalovits-deploy).
#   mihalovits-deploy                   from cron, every minute: publish the deploy branch if it moved
#   mihalovits-deploy --approve <sha>   accept the server files (PHP, .htaccess) of that deploy commit
# GitHub Actions publishes each checked build as the single commit of the deploy branch, which only
# its deploy key may write. When the branch moves, this fetches exactly that commit over HTTPS, checks
# it and mirrors it into public_html, so the host accepts nothing from outside. Files that Apache or
# PHP interpret go live only once approved here over SSH: a stolen editor account can change what the
# site shows, but cannot run code on this account, which also holds the firm's mailbox.
# State and log: ~/.cache/mihalovits-deploy/ (current = last published deploy commit).
set -euo pipefail
umask 022

repo="szilamer/mihalovits-web"
branch="${DEPLOY_BRANCH:-deploy}"
state="${DEPLOY_STATE:-$HOME/.cache/mihalovits-deploy}"
webroot="${DEPLOY_WEBROOT:-$HOME/public_html}"
approved="${DEPLOY_APPROVED:-$HOME/.config/mihalovits/deploy-approved}"
# The inline-script hashes change with every content edit and only relax the browser CSP.
csp_hashes="s#script-src 'self'( 'sha256-[A-Za-z0-9+/]+={0,2}')+;#script-src 'self' __CSP_SCRIPT_HASHES__;#"

mkdir -p "$state"
exec 9>"$state/lock"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$state/deploy.log"
  if (( $(wc -l < "$state/deploy.log") > 1000 )); then
    tail -n 500 "$state/deploy.log" > "$state/deploy.log.tmp" && mv "$state/deploy.log.tmp" "$state/deploy.log"
  fi
}

# fetch <sha> <dir>: check out exactly that commit (git, not a tarball: gzip on this host wraps a
# pigz binary that CageFS does not provide).
fetch() {
  git -C "$2" init --quiet &&
    timeout 300 git -C "$2" fetch --quiet --depth 1 "https://github.com/$repo.git" "$1" &&
    git -C "$2" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
}

# "sha256  path" for every file under <dir> that Apache or PHP would interpret, sorted.
server_files() {
  local dir="$1" file rel sum
  find "$dir" -path "$dir/.git" -prune -o -type f \( -name .htaccess -o -name .user.ini -o -name php.ini \
    -o -iname '*.php' -o -iname '*.php[0-9]' -o -iname '*.pht' -o -iname '*.phtml' -o -iname '*.phar' \
    -o -iname '*.phps' \) -print0 |
    while IFS= read -r -d '' file; do
      rel="${file#"$dir"/}"
      if [[ "$rel" == .htaccess ]]; then
        sum="$(sed -E "$csp_hashes" "$file" | sha256sum)"
      else
        sum="$(sha256sum < "$file")"
      fi
      printf '%s  %s\n' "${sum:0:64}" "$rel"
    done | LC_ALL=C sort
}

if [[ "${1:-}" == "--approve" ]]; then
  sha="${2:-}"
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "usage: mihalovits-deploy --approve <deploy commit (40 hex)>" >&2; exit 2; }
  flock -w 300 9 || { echo "another run keeps the lock" >&2; exit 1; }
  work="$(mktemp -d "$state/build.XXXXXX")"
  trap 'rm -rf "$work"' EXIT
  fetch "$sha" "$work" || { echo "cannot fetch $sha" >&2; exit 1; }
  mkdir -p "$(dirname "$approved")"
  (umask 077 && server_files "$work" > "$approved.tmp")
  mv "$approved.tmp" "$approved"
  rm -f "$state/rejected"
  log "server files of $sha approved (source $(head -c 40 "$work/build.txt" 2>/dev/null || echo unknown))"
  echo "Approved; the next run publishes $sha within a minute. Server files:"
  cut -c67- "$approved" | LC_ALL=C sort | sed 's/^/  /'
  exit 0
fi
[[ $# -eq 0 ]] || { echo "usage: mihalovits-deploy [--approve <deploy commit>]" >&2; exit 2; }

exec 2>>"$state/deploy.log"
flock -n 9 || exit 0

sha="$(git ls-remote "https://github.com/$repo.git" "refs/heads/$branch" 2>/dev/null | cut -f1)"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 1
[[ "$sha" == "$(cat "$state/current" 2>/dev/null)" ]] && exit 0
# A rejected build is not retried until the branch moves again or its server files get approved.
[[ "$sha" == "$(cat "$state/rejected" 2>/dev/null)" ]] && exit 0

work="$(mktemp -d "$state/build.XXXXXX")"
trap 'rm -rf "$work"' EXIT
if ! fetch "$sha" "$work"; then
  log "$sha: download failed, retrying next minute"
  exit 1
fi

reject() {
  log "$sha: $1 – not published"
  echo "$sha" > "$state/rejected"
  exit 1
}
for f in index.html 404.html .htaccess contact.php admin/index.html oauth/common.php oauth/auth.php \
  oauth/callback.php build.txt; do
  [[ -f "$work/$f" ]] || reject "$f missing"
done
if grep -q "__CSP_SCRIPT_HASHES__" "$work/.htaccess"; then reject "unprocessed .htaccess"; fi
# A link could expose any file of this account (mail included) through the web server.
if [[ -n "$(find "$work" -path "$work/.git" -prune -o \( -type l -o -name $'*\n*' \) -print -quit)" ]]; then
  reject "symbolic link or line break in a file name"
fi
[[ -s "$approved" ]] || reject "no server files approved yet; after review run: mihalovits-deploy --approve $sha"
# No process substitution: CageFS has no /dev/fd. The listing sits in .git, which is never published.
server_files "$work" > "$work/.git/server-files"
unapproved="$(LC_ALL=C sort -u "$approved" | LC_ALL=C comm -23 "$work/.git/server-files" - | cut -c67- | paste -sd ' ' -)"
[[ -z "$unapproved" ]] || reject "changed server files ($unapproved); after review run: mihalovits-deploy --approve $sha"

# A fresh checkout gives every file a new mtime, so compare contents (-c) and leave unchanged files
# untouched. Excluded paths are also safe from --delete: .well-known holds the ACME challenges.
rsync -rc --delete-after --delay-updates --exclude='/.git/' --exclude='/.well-known/' "$work/" "$webroot/"
echo "$sha" > "$state/current"
log "published $sha (source $(head -c 40 "$work/build.txt"))"
