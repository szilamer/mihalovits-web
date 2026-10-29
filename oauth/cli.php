<?php
declare(strict_types=1);

/*
 * Command line of the admin sign-in, installed on the host as ~/bin/mihalovits-admin:
 *   list                              editor accounts
 *   add <user> <display name>         new account; the password is read from stdin
 *   passwd <user>                     new password, read from stdin
 *   disable | enable | remove <user>
 *   unlock <user>                     lift the lock after failed attempts
 *   github-connect                    authorize the GitHub account the CMS commits as (device flow)
 *   github-status                     which account is connected, and until when
 *   keepalive                         weekly from cron: renews the grant well before it lapses
 * Passwords never go on the command line, where the process list would show them.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/common.php';
require __DIR__ . '/accounts.php';
require __DIR__ . '/github.php';

umask(077);
ini_set('error_log', '');

// Renew once less than this is left of the grant's six months.
const KEEPALIVE_MARGIN = 150 * 86400;

function say(string $line = ''): void
{
    fwrite(STDOUT, $line . "\n");
}

function fail(string $message): never
{
    fwrite(STDERR, "mihalovits-admin: $message\n");
    exit(1);
}

function usage(): never
{
    fwrite(STDERR, "usage: mihalovits-admin list | add <user> <display name> | passwd <user> | disable <user> | enable <user>\n"
        . "                        | remove <user> | unlock <user> | github-connect | github-status | keepalive\n");
    exit(2);
}

function require_config(): array
{
    return oauth_config() ?? fail('missing or incomplete ' . config_path('oauth.php'));
}

function existing_user(array $args): string
{
    $user = (string) ($args[0] ?? '');
    if (!editor_name_valid($user)) {
        usage();
    }
    if (!isset(load_editors()[$user])) {
        fail("no account named $user");
    }
    return $user;
}

function read_password(): string
{
    if (stream_isatty(STDIN)) {
        if (!function_exists('shell_exec')) {
            fail('pipe the password in on stdin');
        }
        $ask = static function (string $prompt): string {
            fwrite(STDERR, $prompt);
            shell_exec('stty -echo');
            $line = fgets(STDIN);
            shell_exec('stty echo');
            fwrite(STDERR, "\n");
            return rtrim((string) $line, "\r\n");
        };
        $password = $ask('New password: ');
        if ($ask('Repeat it: ') !== $password) {
            fail('the two passwords differ');
        }
    } else {
        $password = preg_replace('/\r?\n\z/', '', (string) stream_get_contents(STDIN)) ?? '';
    }
    $problem = password_problem($password);
    return $problem === null ? $password : fail($problem);
}

/** The repository the CMS edits, from the deployed admin configuration. */
function cms_repo(): string
{
    $file = dirname(__DIR__) . '/admin/config.yml';
    $config = json_decode(preg_replace('/^#.*$/m', '', is_file($file) ? (string) file_get_contents($file) : '') ?? '', true);
    $repo = $config['backend']['repo'] ?? null;
    return is_string($repo) && preg_match('#^[\w.-]+/[\w.-]+$#', $repo) === 1 ? $repo : fail("cannot read the repository from $file");
}

function check_repo_access(array $config, string $token, string $repo): void
{
    if ((github_api($config, $token, "/repos/$repo")['permissions']['push'] ?? false) !== true) {
        fail("this GitHub account cannot write to $repo");
    }
    $installations = github_api($config, $token, '/user/installations')['installations'] ?? null;
    if (!is_array($installations)) {
        fail('GitHub did not list the installations of the app');
    }
    foreach ($installations as $installation) {
        if (!is_int($installation['id'] ?? null) || ($installation['permissions']['contents'] ?? '') !== 'write') {
            continue;
        }
        $repos = github_api($config, $token, "/user/installations/{$installation['id']}/repositories?per_page=100")['repositories'] ?? [];
        foreach (is_array($repos) ? $repos : [] as $candidate) {
            if (strcasecmp((string) ($candidate['full_name'] ?? ''), $repo) === 0) {
                return;
            }
        }
    }
    fail("the GitHub App is not installed on $repo with write access to its contents");
}

function cmd_list(): void
{
    $editors = load_editors();
    if ($editors === []) {
        say('no editor accounts yet');
        return;
    }
    ksort($editors);
    foreach ($editors as $user => $account) {
        say(sprintf(
            '%-16s  %s  %-8s  %s',
            $user,
            mb_str_pad((string) ($account['name'] ?? ''), 28),
            empty($account['disabled']) ? 'active' : 'disabled',
            empty($account['last_login']) ? 'never signed in' : 'last signed in ' . local_time((int) $account['last_login'])
        ));
    }
}

function cmd_add(array $args): void
{
    $user = (string) ($args[0] ?? '');
    $name = single_line(implode(' ', array_slice($args, 1)), 80);
    if (!editor_name_valid($user)) {
        fail('user names are 2-32 characters of a-z, 0-9, dot, dash and underscore, starting with a letter or digit');
    }
    if ($name === '') {
        fail('give the display name after the user name, e.g. add mate "Dr. Mihalovits Máté"');
    }
    if (isset(load_editors()[$user])) {
        fail("$user already exists");
    }
    $hash = hash_password(read_password());
    update_editors(function (array &$editors) use ($user, $name, $hash): void {
        if (isset($editors[$user])) {
            fail("$user already exists");
        }
        $now = time();
        $editors[$user] = ['name' => $name, 'hash' => $hash, 'disabled' => false, 'created' => $now, 'password_changed' => $now, 'last_login' => null];
    });
    log_event('account_added', ['user' => $user]);
    say("added $user ($name)");
}

function cmd_passwd(array $args): void
{
    $user = existing_user($args);
    $hash = hash_password(read_password());
    update_editors(function (array &$editors) use ($user, $hash): void {
        $editors[$user]['hash'] = $hash;
        $editors[$user]['password_changed'] = time();
    });
    $config = oauth_config();
    if ($config !== null) {
        clear_failures(limit_key('account', $user, $config));
    }
    log_event('password_changed', ['user' => $user]);
    say("new password set for $user");
}

function cmd_set_disabled(array $args, bool $disabled): void
{
    $user = existing_user($args);
    update_editors(function (array &$editors) use ($user, $disabled): void {
        $editors[$user]['disabled'] = $disabled;
    });
    log_event($disabled ? 'account_disabled' : 'account_enabled', ['user' => $user]);
    say(($disabled ? 'disabled ' : 'enabled ') . $user);
}

function cmd_remove(array $args): void
{
    $user = existing_user($args);
    update_editors(function (array &$editors) use ($user): void {
        unset($editors[$user]);
    });
    log_event('account_removed', ['user' => $user]);
    say("removed $user");
}

function cmd_unlock(array $args): void
{
    $user = existing_user($args);
    clear_failures(limit_key('account', $user, require_config()));
    log_event('account_unlocked', ['user' => $user]);
    say("unlocked $user");
}

function cmd_github_connect(): void
{
    $config = require_config();
    $repo = cms_repo();
    $current = load_grant();
    try {
        $start = device_start($config);
    } catch (RuntimeException $e) {
        $hint = str_contains($e->getMessage(), 'device_flow_disabled') ? "; enable \"Device Flow\" in the GitHub App's settings" : '';
        fail($e->getMessage() . $hint);
    }
    if ($current !== null) {
        say("Currently connected as {$current['login']}; a successful approval replaces that connection.");
    }
    say("Open {$start['verification_uri']}, signed in as the GitHub account the CMS should commit as, and enter:");
    say();
    say('    ' . $start['user_code']);
    say();
    say('The code is valid for ' . intdiv($start['expires_in'], 60) . ' minutes. Waiting for the approval...');

    $interval = max(1, $start['interval']);
    $deadline = time() + $start['expires_in'];
    $troubles = 0;
    while (true) {
        if (time() >= $deadline) {
            fail('the code expired; run github-connect again');
        }
        sleep($interval);
        $data = device_poll($config, $start['device_code']);
        $error = $data['error'] ?? null;
        if ($error === null) {
            break;
        }
        match ($error) {
            'authorization_pending' => null,
            'slow_down' => $interval = max($interval + 5, (int) ($data['interval'] ?? 0)),
            'unreachable' => ++$troubles < 5 ? null : fail('GitHub is not answering (' . single_line($data['detail'] ?? '', 200) . ')'),
            'access_denied' => fail('the request was declined on GitHub'),
            'expired_token' => fail('the code expired; run github-connect again'),
            default => fail('GitHub refused the device flow (' . single_line((string) $error, 100) . ')'),
        };
    }

    $token = valid_token($data['access_token'] ?? null) ?? fail('GitHub returned no usable access token');
    $grant = grant_from($data, '', time())
        ?? fail("GitHub returned no refresh token: in the GitHub App's settings enable \"Expire user authorization tokens\", then run github-connect again");
    $login = github_api($config, $token, '/user')['login'] ?? null;
    if (!is_string($login) || $login === '') {
        fail('GitHub did not tell which account approved the code');
    }
    check_repo_access($config, $token, $repo);
    $grant['login'] = $login;
    try {
        with_lock('grant', fn () => save_grant($grant));
    } catch (GrantError $e) {
        fail('cannot store the grant: ' . $e->getMessage());
    }
    log_event('github_connected', ['login' => $login]);
    say("Connected as $login, who can write to $repo. Each save in the CMS is committed as $login.");
    say('The grant is valid until ' . local_time($grant['refresh_expires_at'], 'Y-m-d') . '; every sign-in and the weekly keepalive renew it.');
}

function cmd_github_status(): void
{
    $grant = load_grant() ?? fail('not connected; run github-connect');
    say(sprintf(
        'connected as %s since %s; last renewed %s; valid until %s',
        $grant['login'],
        local_time((int) ($grant['connected_at'] ?? 0), 'Y-m-d'),
        local_time((int) ($grant['refreshed_at'] ?? 0)),
        local_time((int) ($grant['refresh_expires_at'] ?? 0), 'Y-m-d')
    ));
}

function cmd_keepalive(): void
{
    $config = require_config();
    $grant = load_grant() ?? fail('not connected; run github-connect');
    if ((int) ($grant['refresh_expires_at'] ?? 0) - time() > KEEPALIVE_MARGIN) {
        return;
    }
    try {
        $renewed = refresh_grant($config)['grant'];
    } catch (GrantError $e) {
        report_grant_problem($e, 'keepalive');
        fail('renewal failed: ' . $e->getMessage());
    }
    log_event('keepalive', ['login' => $renewed['login']]);
    say('renewed; valid until ' . local_time($renewed['refresh_expires_at'], 'Y-m-d'));
}

$args = array_slice($argv, 1);
$command = array_shift($args);
try {
    match ($command) {
        'list' => cmd_list(),
        'add' => cmd_add($args),
        'passwd' => cmd_passwd($args),
        'disable' => cmd_set_disabled($args, true),
        'enable' => cmd_set_disabled($args, false),
        'remove' => cmd_remove($args),
        'unlock' => cmd_unlock($args),
        'github-connect' => cmd_github_connect(),
        'github-status' => cmd_github_status(),
        'keepalive' => cmd_keepalive(),
        default => usage(),
    };
} catch (Throwable $e) {
    fail($e->getMessage());
}
