<?php
declare(strict_types=1);

/*
 * Shared code of the admin's GitHub sign-in: auth.php starts it, callback.php finishes it.
 * The GitHub App credentials live outside the web root:
 *   ~/.config/mihalovits/oauth.php   returns ['client_id','client_secret','site']
 *                                    (optional 'authorize_url','token_url' for tests)
 *   ~/.cache/mihalovits-oauth/       error.log (never inside public_html)
 * .htaccess refuses direct requests to this file.
 */

const STATE_COOKIE = '__Host-mihalovits_oauth';
const STATE_TTL = 600;
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

$logDir = dirname(__DIR__, 2) . '/.cache/mihalovits-oauth';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0700, true);
}
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', $logDir . '/error.log');

header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-Robots-Tag: noindex, nofollow');

function oauth_config(): ?array
{
    $file = dirname(__DIR__, 2) . '/.config/mihalovits/oauth.php';
    $config = is_file($file) ? require $file : null;
    $required = ['client_id', 'client_secret', 'site'];
    if (!is_array($config) || array_diff($required, array_keys($config)) !== []) {
        error_log('oauth: missing or incomplete config');
        return null;
    }
    return $config;
}

function base64url(string $bytes): string
{
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function set_state_cookie(string $value, int $expires): void
{
    setcookie(STATE_COOKIE, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * Answers the CMS window that opened this popup. The result is only ever posted to the site's
 * own origin, and only after that window has identified itself with the "authorizing" handshake,
 * so a foreign page that opens the sign-in flow never receives a token.
 */
function finish_popup(string $site, bool $ok, array $payload, int $status = 200): never
{
    $nonce = base64url(random_bytes(18));
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header("Content-Security-Policy: default-src 'none'; script-src 'nonce-$nonce'; style-src 'nonce-$nonce'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");

    $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
    $message = 'authorization:github:' . ($ok ? 'success' : 'error') . ':' . json_encode($payload, $flags);
    $originJs = json_encode($site, $flags);
    $messageJs = json_encode($message, $flags);
    $text = htmlspecialchars(
        $ok ? 'Sikeres bejelentkezés. Ez az ablak magától bezárul.' : (string) ($payload['error'] ?? 'Hiba történt.'),
        ENT_QUOTES | ENT_HTML5,
        'UTF-8'
    );

    echo <<<HTML
    <!doctype html>
    <html lang="hu">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bejelentkezés – mihalovits.eu</title>
    <style nonce="$nonce">body{font:16px/1.5 system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem;color:#1f2937}</style>
    </head>
    <body>
    <p id="status">$text</p>
    <script nonce="$nonce">
    (() => {
      const origin = $originJs;
      const message = $messageJs;
      const opener = window.opener;
      if (!opener) {
        document.getElementById("status").textContent = "Ezt az ablakot a tartalomkezelő nyitja meg, most bezárhatja.";
        return;
      }
      window.addEventListener("message", (event) => {
        if (event.source !== opener || event.origin !== origin || event.data !== "authorizing:github") return;
        opener.postMessage(message, origin);
      });
      opener.postMessage("authorizing:github", origin);
    })();
    </script>
    </body>
    </html>
    HTML;
    exit;
}
