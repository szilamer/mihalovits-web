<?php
declare(strict_types=1);

/*
 * The admin's sign-in window. The CMS opens it as a popup (config.yml: auth_endpoint); editors sign in
 * with their own name and password (editors.json), and on success the window hands the CMS a fresh
 * GitHub access token made from the stored grant (github.php), so editors need no GitHub account.
 * Failed attempts are limited per account, per address and in total; each sign-in is reported by mail.
 */

require __DIR__ . '/common.php';
require __DIR__ . '/accounts.php';
require __DIR__ . '/github.php';

const FORM_COOKIE = '__Host-mihalovits_login';
const FORM_TTL = 3600;
const MAX_BODY_BYTES = 2048;

function set_form_cookie(string $value, int $expires): void
{
    setcookie(FORM_COOKIE, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function page_heading(): string
{
    return '<p class="eyebrow">mihalovits.eu</p>' . "\n" . '<h1>Belépés a tartalomkezelőbe</h1>';
}

/** The sign-in form with a new form token, which must come back both as cookie and as field. */
function show_form(int $status = 200, string $error = '', string $username = ''): never
{
    $token = base64url(random_bytes(32));
    set_form_cookie($token, time() + FORM_TTL);
    $heading = page_heading();
    $alert = $error === '' ? '' : '<p class="alert" role="alert">' . h($error) . '</p>';
    $user = h($username);
    $main = <<<HTML
    $heading
    $alert
    <form method="post" action="/oauth/auth.php" id="signin">
    <input type="hidden" name="form" value="$token">
    <label for="username">Felhasználónév</label>
    <input id="username" name="username" type="text" value="$user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="64" required>
    <label for="password">Jelszó</label>
    <input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>
    <button type="submit">Belépés</button>
    </form>
    <p class="note" id="note">Biztonsági okból minden belépésről értesítő e-mail megy az iroda címére.</p>
    <p class="note" id="orphan" hidden>Ezt az ablakot a tartalomkezelő nyitja meg: <a href="/admin/">tartalomkezelő megnyitása</a>.</p>
    HTML;
    $script = <<<'JS'
    (() => {
      const form = document.getElementById("signin");
      if (!window.opener) {
        form.hidden = true;
        document.getElementById("note").hidden = true;
        document.getElementById("orphan").hidden = false;
        return;
      }
      document.getElementById(form.username.value ? "password" : "username").focus();
      const button = form.querySelector("button");
      form.addEventListener("submit", () => {
        button.disabled = true;
        button.textContent = "Belépés folyamatban…";
      });
      window.addEventListener("pageshow", () => {
        button.disabled = false;
        button.textContent = "Belépés";
      });
    })();
    JS;
    render_page('Belépés – mihalovits.eu', $main, $script, $status, true);
}

function show_message(string $text, int $status): never
{
    render_page('Belépés – mihalovits.eu', page_heading() . "\n" . '<p class="alert" role="alert">' . h($text) . '</p>', '', $status);
}

function wait_text(int $seconds): string
{
    $minutes = (int) ceil($seconds / 60);
    return $minutes < 120 ? "$minutes perc múlva" : (int) ceil($minutes / 60) . ' óra múlva';
}

function send_lockout_notice(string $reason, ?string $user, string $ip): void
{
    $what = match ($reason) {
        'account' => "A(z) „{$user}” fiókba többször hibás jelszóval próbáltak belépni, ezért ez a fiók átmenetileg zárolva van.",
        'address' => "A(z) {$ip} IP-címről rövid idő alatt sokszor próbáltak hibás adatokkal belépni, ezért erről a címről a belépés átmenetileg tiltva van.",
        default => 'Rövid idő alatt szokatlanul sok sikertelen belépési kísérlet történt, ezért a belépés átmenetileg korlátozva van.',
    };
    send_notice('Sikertelen belépési kísérletek a tartalomkezelőben', implode("\n", [
        $what,
        '',
        'Utolsó próbálkozás: ' . local_time() . ' (Budapest), IP-cím: ' . $ip,
        '',
        'Ha nem Ön próbálkozott: a helyes jelszó nélkül senki sem tud belépni, teendője nincs. Ha gyakran kap ilyen levelet, szóljon a weboldal üzemeltetőjének.',
    ]));
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    exit;
}

$config = oauth_config();
if ($config === null) {
    show_message('A belépés átmenetileg nem érhető el. Kérem, próbálja újra később.', 503);
}
$site = (string) $config['site'];

if ($method === 'GET') {
    show_form();
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$fetchSite = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
if (($origin !== '' && $origin !== $site) || ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'none'], true))) {
    http_response_code(403);
    exit;
}
if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/x-www-form-urlencoded')) {
    http_response_code(415);
    exit;
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY_BYTES) {
    http_response_code(413);
    exit;
}

$user = is_string($_POST['username'] ?? null) ? strtolower(trim($_POST['username'])) : '';
$user = editor_name_valid($user) ? $user : null;
$password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
$formToken = $_POST['form'] ?? null;
$cookieToken = (string) ($_COOKIE[FORM_COOKIE] ?? '');
if ($cookieToken === '' || !is_string($formToken) || !hash_equals($cookieToken, $formToken)) {
    show_form(400, 'Az űrlap lejárt. Kérem, adja meg újra az adatait.', $user ?? '');
}

$ip = client_ip();
try {
    $keys = [
        'account' => $user === null ? null : limit_key('account', $user, $config),
        'address' => limit_key('address', $ip, $config),
        'total' => 'total',
    ];
    $waitNeeded = static fn (): int => max(
        $keys['account'] === null ? 0 : failure_wait($keys['account'], LIMIT_ACCOUNT),
        failure_wait($keys['address'], LIMIT_ADDRESS),
        failure_wait($keys['total'], LIMIT_TOTAL)
    );
    $refuse = static function (int $wait) use ($user): never {
        header("Retry-After: $wait");
        show_form(429, 'Túl sok sikertelen próbálkozás. Kérem, próbálja újra ' . wait_text($wait) . '.', $user ?? '');
    };

    $wait = $waitNeeded();
    if ($wait > 0) {
        log_event('refused', ['user' => $user, 'ip' => $ip]);
        $refuse($wait);
    }

    $account = $user !== null && strlen($password) <= PASSWORD_MAX_BYTES ? verify_editor($user, $password) : null;
    if ($account === null) {
        $reached = [
            'account' => $keys['account'] !== null && record_failure($keys['account'], LIMIT_ACCOUNT),
            'address' => record_failure($keys['address'], LIMIT_ADDRESS),
            'total' => record_failure($keys['total'], LIMIT_TOTAL),
        ];
        log_event('failure', ['user' => $user, 'ip' => $ip]);
        purge_failures();
        $locked = array_search(true, $reached, true);
        if ($locked === false) {
            show_form(401, 'Hibás felhasználónév vagy jelszó.', $user ?? '');
        }
        if (notice_due('lockout', 3600)) {
            send_lockout_notice($locked, $user, $ip);
        }
        $refuse($waitNeeded());
    }
    clear_failures($keys['account']);

    try {
        $minted = refresh_grant($config);
    } catch (GrantError $e) {
        report_grant_problem($e, "sign-in of $user");
        if ($e->problem === GrantProblem::Unreachable) {
            show_form(502, 'A GitHub most nem válaszol, ezért a belépés nem sikerült. Kérem, próbálja újra néhány perc múlva.', $user);
        }
        show_message('A belépés most nem lehetséges, mert megszakadt a kapcsolat a weboldal és a GitHub között. Kérem, szóljon a weboldal üzemeltetőjének.', 503);
    }
} catch (Throwable $e) {
    error_log('oauth: sign-in failed: ' . $e->getMessage());
    show_message('A belépés átmenetileg nem érhető el. Kérem, próbálja újra később.', 500);
}

// The editor is in: bookkeeping problems from here on are logged, never shown.
try {
    record_login($user);
    log_event('login', ['user' => $user, 'ip' => $ip]);
    send_notice('Belépés a weboldal tartalomkezelőjébe', implode("\n", [
        'Belépés történt a ' . (parse_url($site, PHP_URL_HOST) ?: $site) . ' tartalomkezelőjébe.',
        '',
        'Felhasználó: ' . single_line($account['name'] ?? '', 80) . " ($user)",
        'Időpont: ' . local_time() . ' (Budapest)',
        'IP-cím: ' . $ip,
        'Böngésző: ' . (single_line($_SERVER['HTTP_USER_AGENT'] ?? '', 200) ?: 'ismeretlen'),
        '',
        'Ha nem Ön lépett be, kérem, szóljon a weboldal üzemeltetőjének, hogy letiltsa a hozzáférést és új jelszót állítson be.',
    ]));
} catch (Throwable $e) {
    error_log('oauth: after sign-in: ' . $e->getMessage());
}

set_form_cookie('', 1);
hand_token_to_cms($site, $minted['token']);
