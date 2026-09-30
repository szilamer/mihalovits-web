<?php
declare(strict_types=1);

/*
 * Starts the admin's GitHub sign-in in the CMS popup: remembers a one-time state and PKCE
 * verifier in a short-lived cookie, then sends the browser to GitHub's consent page.
 */

require __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    exit;
}

$config = oauth_config();
if ($config === null) {
    finish_popup('https://mihalovits.eu', false, ['error' => 'A bejelentkezés átmenetileg nem érhető el.'], 503);
}

$state = base64url(random_bytes(32));
$verifier = base64url(random_bytes(48));
set_state_cookie("$state.$verifier", time() + STATE_TTL);

$query = http_build_query([
    'client_id' => $config['client_id'],
    'redirect_uri' => $config['site'] . '/oauth/callback.php',
    'state' => $state,
    'code_challenge' => base64url(hash('sha256', $verifier, true)),
    'code_challenge_method' => 'S256',
    'allow_signup' => 'false',
]);
header('Location: ' . ($config['authorize_url'] ?? GITHUB_AUTHORIZE_URL) . '?' . $query, true, 302);
