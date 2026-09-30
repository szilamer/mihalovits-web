<?php
declare(strict_types=1);

/*
 * GitHub sends the CMS popup back here. The one-time state must match the cookie set by auth.php;
 * the code is exchanged server-side (the client secret never reaches the browser) and the
 * resulting user token is handed to the CMS window via finish_popup().
 */

require __DIR__ . '/common.php';

function exchange_code(array $config, string $code, string $verifier): ?string
{
    $url = $config['token_url'] ?? GITHUB_TOKEN_URL;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'code' => $code,
            'redirect_uri' => $config['site'] . '/oauth/callback.php',
            'code_verifier' => $verifier,
        ]),
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: mihalovits.eu-admin-signin'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_PROTOCOLS => isset($config['token_url']) ? CURLPROTO_HTTPS | CURLPROTO_HTTP : CURLPROTO_HTTPS,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $transportError = curl_error($ch);

    $data = is_string($body) ? json_decode($body, true) : null;
    $token = is_array($data) ? ($data['access_token'] ?? null) : null;
    if ($status !== 200 || !is_string($token) || preg_match('/^[A-Za-z0-9_]{20,255}$/', $token) !== 1) {
        $reason = is_array($data) && is_string($data['error'] ?? null) ? $data['error'] : ($transportError ?: "HTTP $status");
        error_log('oauth: token exchange failed: ' . substr($reason, 0, 200));
        return null;
    }
    return $token;
}

$config = oauth_config();
$site = $config['site'] ?? 'https://mihalovits.eu';
$fail = static fn (string $message, int $status = 400) => finish_popup($site, false, ['error' => $message], $status);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    $fail('Érvénytelen kérés.', 405);
}
if ($config === null) {
    $fail('A bejelentkezés átmenetileg nem érhető el.', 503);
}

$cookie = (string) ($_COOKIE[STATE_COOKIE] ?? '');
set_state_cookie('', 1);
[$state, $verifier] = array_pad(explode('.', $cookie, 2), 2, '');

if (isset($_GET['error'])) {
    $fail('A bejelentkezés megszakadt vagy nem lett jóváhagyva.');
}
if ($state === '' || $verifier === '' || !hash_equals($state, (string) ($_GET['state'] ?? ''))) {
    $fail('A bejelentkezés lejárt vagy érvénytelen. Kérem, próbálja újra.');
}
$code = (string) ($_GET['code'] ?? '');
if (preg_match('/^[A-Za-z0-9_-]{1,100}$/', $code) !== 1) {
    $fail('Érvénytelen válasz érkezett a GitHubtól.');
}

$token = exchange_code($config, $code, $verifier);
if ($token === null) {
    $fail('A GitHub nem erősítette meg a bejelentkezést. Kérem, próbálja újra.', 502);
}
finish_popup($site, true, ['provider' => 'github', 'token' => $token]);
