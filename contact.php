<?php
declare(strict_types=1);

/*
 * Contact form endpoint for the static site.
 *
 * Secrets and mutable state live outside the web root:
 *   ~/.config/mihalovits/contact.php   returns ['to','from','from_name','site','secret']
 *   ~/.cache/mihalovits-contact/       rate-limit counters keyed by HMAC(IP), purged after 2 days,
 *                                      plus error.log (never inside public_html)
 * Message contents are never written to disk; they are only e-mailed.
 */

const MAX_BODY_BYTES = 20000;
const TOKEN_MIN_AGE = 3;
const TOKEN_MAX_AGE = 7200;
const RATE_RULES_IP = [[600, 5], [86400, 20]];
const RATE_RULES_GLOBAL = [[3600, 40]];

$stateDir = dirname(__DIR__) . '/.cache/mihalovits-contact';
if (!is_dir($stateDir)) {
    @mkdir($stateDir, 0700, true);
}
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', $stateDir . '/error.log');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $code, string $message): never
{
    respond($status, ['ok' => false, 'code' => $code, 'error' => $message]);
}

function load_config(): array
{
    $file = dirname(__DIR__) . '/.config/mihalovits/contact.php';
    $config = is_file($file) ? require $file : null;
    $required = ['to', 'from', 'from_name', 'site', 'secret'];
    if (!is_array($config) || array_diff($required, array_keys($config)) !== [] || strlen((string) $config['secret']) < 32) {
        error_log('contact.php: missing or incomplete config');
        fail(503, 'unavailable', 'Az űrlap átmenetileg nem érhető el. Kérem, hívjon vagy írjon e-mailt.');
    }
    return $config;
}

function clean_line(mixed $value, int $max): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        return '';
    }
    $value = preg_replace('/[\p{Cc}\p{Cf}\x{2028}\x{2029}]+/u', ' ', $value) ?? '';
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return mb_substr($value, 0, $max);
}

function clean_text(mixed $value): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        return '';
    }
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[^\P{Cc}\n\t]/u', '', $value) ?? '';
    return trim($value);
}

function encode_header_text(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

function issue_token(string $secret): string
{
    $ts = (string) time();
    $nonce = bin2hex(random_bytes(8));
    return $ts . '.' . $nonce . '.' . hash_hmac('sha256', "contact|$ts|$nonce", $secret);
}

function check_token(mixed $token, string $secret): ?string
{
    if (!is_string($token) || !preg_match('/^(\d{10})\.([a-f0-9]{16})\.([a-f0-9]{64})$/', $token, $m)) {
        return 'invalid';
    }
    if (!hash_equals(hash_hmac('sha256', "contact|{$m[1]}|{$m[2]}", $secret), $m[3])) {
        return 'invalid';
    }
    $age = time() - (int) $m[1];
    if ($age < TOKEN_MIN_AGE) {
        return 'too_fast';
    }
    if ($age > TOKEN_MAX_AGE) {
        return 'expired';
    }
    return null;
}

/** Sliding-window limiter; returns true when the request must be rejected. */
function rate_limited(string $dir, string $key, array $rules): bool
{
    $handle = @fopen("$dir/$key.json", 'c+');
    if ($handle === false) {
        error_log('contact.php: rate-limit store not writable');
        return false;
    }
    flock($handle, LOCK_EX);
    $now = time();
    $horizon = max(array_column($rules, 0));
    $hits = json_decode(stream_get_contents($handle) ?: '[]', true);
    $hits = array_values(array_filter(is_array($hits) ? $hits : [], fn ($t) => is_int($t) && $t > $now - $horizon));

    $limited = false;
    foreach ($rules as [$window, $max]) {
        if (count(array_filter($hits, fn ($t) => $t > $now - $window)) >= $max) {
            $limited = true;
            break;
        }
    }
    if (!$limited) {
        $hits[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($hits));
        fflush($handle);
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

function purge_old_counters(string $dir): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    foreach (glob("$dir/*.json") ?: [] as $file) {
        if (filemtime($file) < time() - 2 * 86400) {
            @unlink($file);
        }
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'method', 'Csak POST kérés engedélyezett.');
}

$config = load_config();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$fetchSite = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
if (($origin !== '' && $origin !== $config['site']) || ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'none'], true))) {
    fail(403, 'origin', 'Érvénytelen kérés.');
}

if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    fail(415, 'content_type', 'Érvénytelen kérés.');
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    fail(413, 'too_large', 'Az üzenet túl hosszú.');
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    fail(400, 'bad_request', 'Hibás kérés.');
}

if (($data['action'] ?? null) === 'token') {
    respond(200, ['ok' => true, 'token' => issue_token($config['secret'])]);
}

if (!empty($data['company'])) {
    respond(200, ['ok' => true]);
}

$tokenProblem = check_token($data['token'] ?? null, $config['secret']);
if ($tokenProblem !== null) {
    fail(400, 'token_' . $tokenProblem, 'Az űrlap lejárt, kérem, küldje el újra.');
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipKey = substr(hash_hmac('sha256', "ip|$ip", $config['secret']), 0, 32);
if (rate_limited($stateDir, $ipKey, RATE_RULES_IP) || rate_limited($stateDir, 'global', RATE_RULES_GLOBAL)) {
    header('Retry-After: 600');
    fail(429, 'rate_limited', 'Rövid idő alatt túl sok üzenet érkezett. Kérem, próbálja újra később.');
}
purge_old_counters($stateDir);

$name = clean_line($data['name'] ?? '', 120);
$email = clean_line($data['email'] ?? '', 254);
$phone = clean_line($data['phone'] ?? '', 40);
$topic = clean_line($data['topic'] ?? '', 100);
$message = clean_text($data['message'] ?? '');
$consent = ($data['consent'] ?? false) === true;

$errors = [];
if (mb_strlen($name) < 3) {
    $errors['name'] = 'Kérem, adja meg a teljes nevét.';
}
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $errors['email'] = 'Érvényes e-mail címet adjon meg.';
}
if ($phone !== '' && !preg_match('/^[+\d][\d\s()\/-]{6,}$/', $phone)) {
    $errors['phone'] = 'A telefonszám formátuma nem megfelelő.';
}
if ($topic === '') {
    $errors['topic'] = 'Válasszon témát, hogy gyorsabban tudjak reagálni.';
}
if (mb_strlen($message) < 20) {
    $errors['message'] = 'Kérem, írjon legalább néhány mondatot az ügyről (min. 20 karakter).';
} elseif (mb_strlen($message) > 4000) {
    $errors['message'] = 'Az üzenet túl hosszú (max. 4000 karakter).';
}
if (!$consent) {
    $errors['consent'] = 'Az adatkezelési tájékoztató elfogadása szükséges.';
}
if ($errors !== []) {
    respond(422, ['ok' => false, 'errors' => $errors]);
}

$received = (new DateTimeImmutable('now', new DateTimeZone('Europe/Budapest')))->format('Y-m-d H:i');
$siteHost = (string) parse_url($config['site'], PHP_URL_HOST);
$body = implode("\n", [
    "Új megkeresés érkezett a {$siteHost} kapcsolati űrlapjáról.",
    '',
    'Név: ' . $name,
    'E-mail: ' . $email,
    'Telefon: ' . ($phone !== '' ? $phone : '–'),
    'Téma: ' . $topic,
    'Beérkezett: ' . $received . ' (Budapest)',
    'Adatkezelési hozzájárulás: megadva',
    '',
    'Üzenet:',
    $message,
    '',
    '-- ',
    'A „Válasz” gombbal közvetlenül a feladónak válaszolhat.',
]);

$headers = [
    'From' => encode_header_text($config['from_name']) . ' <' . $config['from'] . '>',
    'Reply-To' => encode_header_text($name) . ' <' . $email . '>',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'base64',
    'Auto-Submitted' => 'auto-generated',
];

$sent = mail(
    $config['to'],
    encode_header_text('Új megkeresés a weboldalról: ' . $topic),
    chunk_split(base64_encode($body), 76, "\n"),
    $headers,
    '-f' . $config['from']
);

if (!$sent) {
    error_log('contact.php: mail() returned false');
    fail(502, 'send_failed', 'Az üzenet küldése nem sikerült.');
}

respond(200, ['ok' => true]);
