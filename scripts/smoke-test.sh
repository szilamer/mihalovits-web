#!/usr/bin/env bash
# Post-deploy checks against the live site: security headers, redirects, access rules, caching,
# the contact endpoint and the preview gate. Exit code = number of failed checks.
# Env: SITE (default https://mihalovits.eu), PREVIEW_PASSWORD (needed while the gate is on),
#      RESOLVE_IP (pin DNS to the host, e.g. while local resolvers still cache an old record).
# shellcheck disable=SC2015 # pass() only prints, so "check && pass || fail" never runs both.
set -uo pipefail

site="${SITE:-https://mihalovits.eu}"
host="${site#https://}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

base=(-sS --max-time 20 --proto '=http,https')
if [[ -n "${RESOLVE_IP:-}" ]]; then
  base+=(--resolve "$host:443:$RESOLVE_IP" --resolve "www.$host:443:$RESOLVE_IP" --resolve "$host:80:$RESOLVE_IP")
fi
auth=()
if [[ -n "${PREVIEW_PASSWORD:-}" ]]; then
  (umask 077 && printf 'machine %s login elonezet password %s\n' "$host" "$PREVIEW_PASSWORD" > "$tmp/netrc")
  auth=(--netrc-file "$tmp/netrc")
fi

fails=0
pass() { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; fails=$((fails + 1)); }

# fetch <name> [curl args...] -> $tmp/<name>.h (headers), $tmp/<name>.b (body), prints status code
fetch() {
  local name="$1"; shift
  curl "${base[@]}" -D "$tmp/$name.h" -o "$tmp/$name.b" -w '%{http_code}' "$@" || true
}
hdr() { tr -d '\r' < "$tmp/$1.h" | grep -i "^$2:" | head -1 | cut -d' ' -f2-; }
# expected may list alternatives: "403|404"
expect_status() { [[ "|$2|" == *"|$3|"* ]] && pass "$1 → $3" || fail "$1 → expected $2, got $3"; }
expect_header() {
  local value; value="$(hdr "$1" "$2")"
  [[ "$value" == *"$3"* ]] && pass "$1: $2 contains '$3'" || fail "$1: $2 should contain '$3' (got '${value:-<none>}')"
}

echo "Smoke test for $site${RESOLVE_IP:+ (pinned to $RESOLVE_IP)}"

gate_status="$(fetch anon "$site/")"
if [[ "$gate_status" == "401" ]]; then
  echo "Preview gate: ON"
  expect_header anon x-robots-tag "noindex"
  expect_header anon strict-transport-security "max-age=31536000"
  [[ ${#auth[@]} -gt 0 ]] || { fail "PREVIEW_PASSWORD not set – cannot test behind the gate"; exit "$fails"; }
else
  echo "Preview gate: OFF"
  expect_status "anonymous /" 200 "$gate_status"
fi

expect_status "/" 200 "$(fetch home "${auth[@]}" "$site/")"
expect_header home content-security-policy "script-src 'self' 'sha256-"
expect_header home content-security-policy "frame-ancestors 'none'"
expect_header home strict-transport-security "includeSubDomains"
expect_header home x-frame-options "DENY"
expect_header home x-content-type-options "nosniff"
expect_header home referrer-policy "strict-origin-when-cross-origin"
expect_header home permissions-policy "camera=()"
expect_header home cross-origin-opener-policy "same-origin"
expect_header home cache-control "no-cache"
[[ -z "$(hdr home x-powered-by)" ]] && pass "no X-Powered-By" || fail "X-Powered-By leaked"

asset="$(grep -oE '/_next/static/[^"]+\.js' "$tmp/home.b" | head -1)"
if [[ -n "$asset" ]]; then
  expect_status "static asset" 200 "$(fetch asset "${auth[@]}" "$site$asset")"
  expect_header asset cache-control "max-age=31536000"
else
  fail "no /_next/static script found in the home page"
fi

for page in rolam kapcsolat szakteruletek szakteruletek/ingatlanjog adatkezeles impresszum; do
  expect_status "/$page/" 200 "$(fetch page "${auth[@]}" "$site/$page/")"
done

expect_status "/rolam (no slash)" 301 "$(fetch slash "${auth[@]}" "$site/rolam")"
expect_header slash location "$site/rolam/"
expect_status "www host" 301 "$(fetch www "https://www.$host/rolam/?q=1")"
expect_header www location "$site/rolam/?q=1"
expect_status "plain http" 301 "$(fetch http "http://$host/kapcsolat/")"
expect_header http location "https://$host/kapcsolat/"

expect_status "unknown page" 404 "$(fetch missing "${auth[@]}" "$site/nincs-ilyen-oldal/")"
grep -q "<html" "$tmp/missing.b" && pass "404 page is the site's own page" || fail "404 body is not the site's page"

expect_status "ACME path without password" 404 "$(fetch acme "$site/.well-known/acme-challenge/smoke-test")"

expect_status "/admin/" 200 "$(fetch admin "${auth[@]}" "$site/admin/")"
expect_header admin content-security-policy "connect-src 'self' blob: data: https://api.github.com"
expect_header admin content-security-policy "frame-ancestors 'none'"
expect_header admin cross-origin-opener-policy "same-origin-allow-popups"
expect_header admin x-robots-tag "noindex"
expect_header admin cache-control "no-cache"
cms_entry="$(grep -oE '/admin/cms/sveltia-cms-[A-Za-z0-9]+\.js' "$tmp/admin.b" | head -1)"
if [[ -n "$cms_entry" ]]; then
  expect_status "admin bundle" 200 "$(fetch cmsjs "${auth[@]}" "$site$cms_entry")"
else
  fail "admin page does not reference the CMS bundle"
fi
expect_status "/admin/config.yml" 200 "$(fetch cmsconfig "${auth[@]}" "$site/admin/config.yml")"
expect_header cmsconfig cache-control "no-cache"
grep -q '"auth_endpoint": "oauth/auth.php"' "$tmp/cmsconfig.b" && pass "admin config uses this site's sign-in" || fail "admin config is not the production one"

# Imunify360 WebShield answers PHP requests from greylisted IPs – often cloud ranges such as GitHub's
# runners – with a JavaScript challenge before Apache sees them. The PHP checks are then skipped, not
# failed; after approving PHP or .htaccess changes, run this script from an ordinary network.
helper_status="$(fetch oauthlib "$site/oauth/common.php")"
if [[ "$helper_status" == 200 ]] && grep -qF 'setTimeout(function()' "$tmp/oauthlib.b" && ! grep -qF '<?php' "$tmp/oauthlib.b"; then
  echo "  SKIP  PHP endpoints: the host's bot protection challenges this client (Imunify360 WebShield)"
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
    echo "::warning::PHP endpoints not checked: the host's bot protection challenges this runner's IP. Run scripts/smoke-test.sh from an ordinary network after approving PHP or .htaccess changes."
  fi
else
  expect_status "sign-in helper not reachable" 403 "$helper_status"
  expect_status "sign-in start" 302 "$(fetch oauth "$site/oauth/auth.php")"
  expect_header oauth location "https://github.com/login/oauth/authorize?client_id="
  expect_header oauth set-cookie "__Host-mihalovits_oauth="
  expect_status "sign-in callback without state" 400 "$(fetch oauthcb "$site/oauth/callback.php?code=x&state=y")"
  expect_header oauthcb content-security-policy "default-src 'none'"
  expect_header oauthcb cache-control "no-store"

  expect_status "contact GET" 405 "$(fetch cget "$site/contact.php")"
  expect_header cget cache-control "no-store"
  expect_status "contact foreign origin" 403 "$(fetch corigin -X POST -H 'Content-Type: application/json' -H 'Origin: https://evil.example' --data '{"action":"token"}' "$site/contact.php")"
  expect_status "contact token" 200 "$(fetch ctoken -X POST -H 'Content-Type: application/json' -H "Origin: $site" --data '{"action":"token"}' "$site/contact.php")"
  grep -qE '"token":"[0-9]{10}\.[a-f0-9]{16}\.[a-f0-9]{64}"' "$tmp/ctoken.b" && pass "contact token is signed" || fail "contact token malformed: $(head -c 200 "$tmp/ctoken.b")"
fi

# Requests for hidden, backup and stray files look like a vulnerability scan: the host's firewall
# (Imunify360) blocks the client's IP seconds later, so these run last and not from CI. Its runners
# are flagged anyway, and the rules behind them only change with an approved .htaccess.
if [[ -n "${GITHUB_ACTIONS:-}" && "${SMOKE_PROBES:-}" != 1 ]]; then
  echo "  SKIP  forbidden-path probes (they would trip the host's firewall; SMOKE_PROBES=1 forces them)"
else
  expect_status "/.htaccess" "403|404" "$(fetch dot1 "${auth[@]}" "$site/.htaccess")"
  expect_status "/.git/config" "403|404" "$(fetch dot2 "${auth[@]}" "$site/.git/config")"
  expect_status "backup file" 403 "$(fetch bak "${auth[@]}" "$site/contact.php.bak")"
  expect_status "stray PHP" 403 "$(fetch php "${auth[@]}" "$site/info.php")"
fi

echo "Failed checks: $fails"
exit "$fails"
