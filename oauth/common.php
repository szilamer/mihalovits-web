<?php
declare(strict_types=1);

/*
 * Shared code of the admin sign-in: auth.php is its only web page, cli.php its command line on the
 * host; .htaccess refuses direct requests to the other files here. Everything mutable or secret
 * lives outside the web root:
 *   ~/.config/mihalovits/oauth.php          ['client_id','client_secret','site'] of the GitHub App
 *                                           (optional 'token_url','device_url','api_url' for tests)
 *   ~/.config/mihalovits/editors.json       editor accounts with Argon2id password hashes
 *   ~/.config/mihalovits/github-grant.json  refresh token of the GitHub account the CMS commits as
 *   ~/.config/mihalovits/contact.php        mail sender and recipient, shared with the contact form
 *   ~/.cache/mihalovits-oauth/              failure counters, locks, auth.log and error.log
 */

function home_dir(): string
{
    return dirname(__DIR__, 2);
}

function config_path(string $name): string
{
    return home_dir() . '/.config/mihalovits/' . $name;
}

function state_path(string $name = ''): string
{
    return home_dir() . '/.cache/mihalovits-oauth' . ($name === '' ? '' : '/' . $name);
}

if (!is_dir(state_path())) {
    @mkdir(state_path(), 0700, true);
}
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', state_path('error.log'));

header('Cache-Control: no-store');
// Not no-referrer: with it, browsers send "Origin: null" on the sign-in form's own POST.
header('Referrer-Policy: same-origin');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-Robots-Tag: noindex, nofollow');

function oauth_config(): ?array
{
    $file = config_path('oauth.php');
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

function h(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5 | ENT_SUBSTITUTE, 'UTF-8');
}

/** Printable single line of at most $max characters, for logs and mails. */
function single_line(mixed $value, int $max): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        return '';
    }
    $value = preg_replace('/[\p{Cc}\p{Cf}\x{2028}\x{2029}\s]+/u', ' ', $value) ?? '';
    return mb_substr(trim($value), 0, $max);
}

function local_time(?int $timestamp = null, string $format = 'Y-m-d H:i'): string
{
    return (new DateTimeImmutable('@' . ($timestamp ?? time())))
        ->setTimezone(new DateTimeZone('Europe/Budapest'))
        ->format($format);
}

/** The visitor's address. nginx sits in front of Apache; if the host did not restore the client's address, nginx's header has it. */
function client_ip(): string
{
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if (in_array($remote, ['127.0.0.1', '::1'], true)) {
        $real = trim((string) ($_SERVER['HTTP_X_REAL_IP'] ?? ''));
        if (filter_var($real, FILTER_VALIDATE_IP) !== false) {
            return $real;
        }
    }
    return filter_var($remote, FILTER_VALIDATE_IP) !== false ? $remote : 'unknown';
}

/** Replaces $path atomically with an owner-only file; throws RuntimeException on failure. */
function write_private_file(string $path, string $contents): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        throw new RuntimeException("cannot create $dir");
    }
    $tmp = $dir . '/.' . basename($path) . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $handle = @fopen($tmp, 'xb');
    if ($handle === false) {
        throw new RuntimeException("cannot write in $dir");
    }
    $written = chmod($tmp, 0600) && fwrite($handle, $contents) === strlen($contents) && fflush($handle) && fsync($handle);
    fclose($handle);
    if (!$written || !@rename($tmp, $path)) {
        @unlink($tmp);
        throw new RuntimeException("cannot write $path");
    }
}

/** Runs $fn while holding the exclusive lock $name (a file in the state directory). */
function with_lock(string $name, callable $fn): mixed
{
    $handle = @fopen(state_path($name . '.lock'), 'c');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        throw new RuntimeException("cannot take the $name lock");
    }
    try {
        return $fn();
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/** One JSON line per sign-in event in auth.log; never passwords or tokens. */
function log_event(string $event, array $fields = []): void
{
    $file = state_path('auth.log');
    if ((@filesize($file) ?: 0) > 1_000_000) {
        @rename($file, $file . '.1');
    }
    $line = json_encode(['time' => local_time(null, DATE_ATOM), 'event' => $event] + $fields, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if (@file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX) === false) {
        error_log("oauth: cannot write auth.log ($event)");
    }
}

/** True at most once per $interval seconds for $name, so repeated events send one mail. */
function notice_due(string $name, int $interval): bool
{
    $stamp = state_path('notice-' . $name);
    if (is_file($stamp) && filemtime($stamp) > time() - $interval) {
        return false;
    }
    @touch($stamp);
    return true;
}

/** Mails the firm's address (the contact form's recipient) about the sign-in. */
function send_notice(string $subject, string $body): void
{
    $file = config_path('contact.php');
    $mail = is_file($file) ? require $file : null;
    if (!is_array($mail) || !is_string($mail['to'] ?? null) || !is_string($mail['from'] ?? null)) {
        error_log('oauth: no mail settings for notices');
        return;
    }
    $encode = static fn (string $text): string => '=?UTF-8?B?' . base64_encode($text) . '?=';
    $headers = [
        'From' => $encode((string) ($mail['from_name'] ?? 'mihalovits.eu')) . ' <' . $mail['from'] . '>',
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64',
        'Auto-Submitted' => 'auto-generated',
    ];
    if (!mail($mail['to'], $encode($subject), chunk_split(base64_encode($body), 76, "\n"), $headers, '-f' . $mail['from'])) {
        error_log('oauth: notice mail failed');
    }
}

const PAGE_STYLE = <<<'CSS'
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f8fa;color:#0e151b;font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.card{width:100%;max-width:380px;padding:32px 28px;background:#fff;border:1px solid #dbe2ea;border-radius:16px;box-shadow:0 1px 2px rgba(14,21,27,.04),0 16px 40px -16px rgba(14,21,27,.16)}
.eyebrow{margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b7d}
h1{margin:0 0 24px;font-size:22px;line-height:1.25;font-weight:650;letter-spacing:-.01em}
label{display:block;margin:0 0 6px;font-size:14px;font-weight:600;color:#1f2e3b}
input{display:block;width:100%;margin:0 0 18px;padding:11px 12px;font:inherit;color:inherit;background:#fff;border:1px solid #c5d0db;border-radius:10px}
input:focus{outline:3px solid rgba(79,177,234,.35);outline-offset:0;border-color:#2e8fd0}
button{width:100%;margin-top:6px;padding:12px 16px;font:inherit;font-weight:600;color:#fff;background:#0e151b;border:0;border-radius:10px;cursor:pointer}
button:hover{background:#1f2e3b}
button:focus-visible{outline:3px solid rgba(79,177,234,.6);outline-offset:2px}
button:disabled{opacity:.75;cursor:progress}
.alert{margin:0 0 20px;padding:12px 14px;font-size:15px;color:#8a1c12;background:#fdf1f0;border:1px solid #f3c9c4;border-radius:10px}
.lead{margin:0;font-size:17px}
.note{margin:20px 0 0;font-size:13px;color:#5b6b7d}
a{color:#2e8fd0}
[hidden]{display:none!important}
CSS;

/** Sends a complete page of the sign-in window with a per-response nonce CSP, then stops. */
function render_page(string $title, string $main, string $script, int $status = 200, bool $form = false): never
{
    $nonce = base64url(random_bytes(18));
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $formAction = $form ? "'self'" : "'none'";
    header("Content-Security-Policy: default-src 'none'; script-src 'nonce-$nonce'; style-src 'nonce-$nonce'; base-uri 'none'; form-action $formAction; frame-ancestors 'none'");
    $title = h($title);
    $style = PAGE_STYLE;
    $scriptTag = $script === '' ? '' : "<script nonce=\"$nonce\">\n$script\n</script>";
    echo <<<HTML
    <!doctype html>
    <html lang="hu">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>$title</title>
    <style nonce="$nonce">$style</style>
    </head>
    <body>
    <main class="card">
    $main
    </main>
    $scriptTag
    </body>
    </html>
    HTML;
    exit;
}

/**
 * Hands the GitHub token to the CMS window that opened this popup. It is only ever posted to the
 * site's own origin, and only after that window has answered the "authorizing" handshake, so a
 * foreign page that opens the sign-in window never receives a token.
 */
function hand_token_to_cms(string $site, string $token): never
{
    $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
    $message = 'authorization:github:success:' . json_encode(['provider' => 'github', 'token' => $token], $flags);
    $originJs = json_encode($site, $flags);
    $messageJs = json_encode($message, $flags);
    $script = <<<JS
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
    JS;
    render_page(
        'Sikeres belépés – mihalovits.eu',
        '<p id="status" class="lead">Sikeres belépés. Ez az ablak magától bezárul.</p>',
        $script
    );
}
