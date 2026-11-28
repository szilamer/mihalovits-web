<?php
declare(strict_types=1);

/*
 * Editor accounts of the admin sign-in and the limits on failed attempts. editors.json maps each user
 * name to {name, hash, disabled, created, password_changed, last_login}; passwords are kept only as
 * Argon2id hashes. Failures are counted per account, per client address and in total, in counter
 * files named by an HMAC, so neither names nor addresses appear in file names.
 */

const USERNAME_PATTERN = '/^[a-z0-9][a-z0-9._-]{1,31}$/';
const PASSWORD_MIN_CHARS = 16;
const PASSWORD_MAX_BYTES = 256;
// [window in seconds, failures allowed within it]
const LIMIT_ACCOUNT = [[900, 5], [86400, 20]];
const LIMIT_ADDRESS = [[900, 10], [86400, 50]];
const LIMIT_TOTAL = [[3600, 300]];
// Checked against unknown names as well, so they take as long to refuse as a real account.
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=4,p=1$ajRURk1jZlY5dm9Fd0Y0NA$lFEHjKMJ3yQYz6Y9xrwoknNoZ0ZvZUmQ4VUxiNdwA4Q';

function editor_name_valid(string $user): bool
{
    return preg_match(USERNAME_PATTERN, $user) === 1;
}

/** Why $password may not be set, or null if it is acceptable. */
function password_problem(string $password): ?string
{
    if (!mb_check_encoding($password, 'UTF-8') || preg_match('/\p{Cc}/u', $password) === 1) {
        return 'the password contains control characters or is not valid UTF-8';
    }
    if (mb_strlen($password) < PASSWORD_MIN_CHARS) {
        return 'the password must be at least ' . PASSWORD_MIN_CHARS . ' characters long';
    }
    if (strlen($password) > PASSWORD_MAX_BYTES) {
        return 'the password may be at most ' . PASSWORD_MAX_BYTES . ' bytes long';
    }
    return null;
}

function load_editors(): array
{
    $file = config_path('editors.json');
    if (!is_file($file)) {
        return [];
    }
    $editors = json_decode((string) file_get_contents($file), true);
    if (!is_array($editors)) {
        throw new RuntimeException('editors.json is unreadable');
    }
    return $editors;
}

/** Loads, changes and saves the accounts under one lock; $change receives the list by reference. */
function update_editors(callable $change): mixed
{
    return with_lock('editors', function () use ($change): mixed {
        $editors = load_editors();
        $result = $change($editors);
        $flags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT | JSON_THROW_ON_ERROR;
        write_private_file(config_path('editors.json'), json_encode($editors, $flags) . "\n");
        return $result;
    });
}

function hash_password(string $password): string
{
    return password_hash($password, PASSWORD_ARGON2ID);
}

/** The account of $user if $password is right and the account is active, otherwise null. */
function verify_editor(string $user, string $password): ?array
{
    $account = load_editors()[$user] ?? null;
    $hash = is_array($account) && is_string($account['hash'] ?? null) ? $account['hash'] : DUMMY_HASH;
    if (!password_verify($password, $hash) || !is_array($account) || !empty($account['disabled'])) {
        return null;
    }
    if (password_needs_rehash($hash, PASSWORD_ARGON2ID)) {
        update_editors(function (array &$editors) use ($user, $password): void {
            if (isset($editors[$user])) {
                $editors[$user]['hash'] = hash_password($password);
            }
        });
    }
    return $account;
}

function record_login(string $user): void
{
    update_editors(function (array &$editors) use ($user): void {
        if (isset($editors[$user])) {
            $editors[$user]['last_login'] = time();
        }
    });
}

function limit_key(string $kind, string $value, array $config): string
{
    return $kind . '-' . substr(hash_hmac('sha256', "$kind|$value", (string) $config['client_secret']), 0, 32);
}

/** Recent failures of $key; with $add, one more is recorded first. */
function failure_times(string $key, array $rules, bool $add = false): array
{
    $dir = state_path('limits');
    $file = "$dir/$key.json";
    if (!$add && !is_file($file)) {
        return [];
    }
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        error_log('oauth: failure counters not writable');
        return [];
    }
    flock($handle, LOCK_EX);
    $now = time();
    $horizon = max(array_column($rules, 0));
    $times = json_decode(stream_get_contents($handle) ?: '[]', true);
    $times = array_values(array_filter(is_array($times) ? $times : [], fn ($t) => is_int($t) && $t > $now - $horizon));
    if ($add) {
        $times[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($times));
        fflush($handle);
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $times;
}

/** Seconds until $key may try again; 0 if it may try now. */
function failure_wait(string $key, array $rules, ?array $times = null): int
{
    $times ??= failure_times($key, $rules);
    $now = time();
    $wait = 0;
    foreach ($rules as [$window, $max]) {
        $recent = array_values(array_filter($times, fn (int $t) => $t > $now - $window));
        if (count($recent) >= $max) {
            sort($recent);
            // The window reopens when the oldest of the last $max failures leaves it.
            $wait = max($wait, $recent[count($recent) - $max] + $window - $now);
        }
    }
    return $wait;
}

/** Records a failure of $key; true when this one used up a limit. */
function record_failure(string $key, array $rules): bool
{
    return failure_wait($key, $rules, failure_times($key, $rules, true)) > 0;
}

function clear_failures(string $key): void
{
    @unlink(state_path("limits/$key.json"));
}

function purge_failures(): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    foreach (glob(state_path('limits/*.json')) ?: [] as $file) {
        if (filemtime($file) < time() - 2 * 86400) {
            @unlink($file);
        }
    }
}
