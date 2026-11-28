<?php
declare(strict_types=1);

/*
 * The GitHub side of the admin sign-in. The CMS commits as one GitHub account, which authorized the
 * site's GitHub App once through the device flow (cli.php github-connect). Only its refresh token is
 * kept, in github-grant.json: every sign-in trades it for a new 8-hour access token, and GitHub
 * rotates the refresh token each time, valid for six months from then. The exchange and the write of
 * the rotated token run under one lock, so simultaneous sign-ins never race for it.
 */

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_DEVICE_URL = 'https://github.com/login/device/code';
const GITHUB_API_URL = 'https://api.github.com';
const DEVICE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';
const REFRESH_TOKEN_LIFETIME = 15897600;
const TOKEN_PATTERN = '/^[A-Za-z0-9_]{20,255}$/';

enum GrantProblem: string
{
    /** Never connected, or the grant file is gone. */
    case Missing = 'missing';
    /** GitHub refused the refresh token or the app credentials: only github-connect helps. */
    case Revoked = 'revoked';
    /** Network error, an error status or an odd answer: the next attempt may work. */
    case Unreachable = 'unreachable';
    /** The rotated refresh token could not be saved. */
    case Storage = 'storage';
}

final class GrantError extends RuntimeException
{
    public function __construct(public readonly GrantProblem $problem, string $detail = '')
    {
        parent::__construct($problem->value . ($detail === '' ? '' : ": $detail"));
    }
}

function github_url(array $config, string $endpoint): string
{
    return match ($endpoint) {
        'token' => (string) ($config['token_url'] ?? GITHUB_TOKEN_URL),
        'device' => (string) ($config['device_url'] ?? GITHUB_DEVICE_URL),
        'api' => rtrim((string) ($config['api_url'] ?? GITHUB_API_URL), '/'),
    };
}

/**
 * POSTs $form to an OAuth endpoint, or GETs a REST path with $token.
 * @return array{status: int, data: ?array, error: string}
 */
function github_request(array $config, string $url, ?array $form = null, ?string $token = null): array
{
    $testing = isset($config['token_url']) || isset($config['device_url']) || isset($config['api_url']);
    $headers = ['User-Agent: mihalovits.eu-admin'];
    if ($token === null) {
        $headers[] = 'Accept: application/json';
    } else {
        array_push($headers, 'Accept: application/vnd.github+json', 'X-GitHub-Api-Version: 2022-11-28', "Authorization: Bearer $token");
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_PROTOCOLS => $testing ? CURLPROTO_HTTPS | CURLPROTO_HTTP : CURLPROTO_HTTPS,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    if ($form !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($form));
    }
    $body = curl_exec($ch);
    $data = is_string($body) ? json_decode($body, true) : null;
    return [
        'status' => (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE),
        'data' => is_array($data) ? $data : null,
        'error' => curl_error($ch),
    ];
}

function github_api(array $config, string $token, string $path): ?array
{
    $response = github_request($config, github_url($config, 'api') . $path, null, $token);
    return $response['status'] === 200 ? $response['data'] : null;
}

function valid_token(mixed $token): ?string
{
    return is_string($token) && preg_match(TOKEN_PATTERN, $token) === 1 ? $token : null;
}

function load_grant(): ?array
{
    $file = config_path('github-grant.json');
    if (!is_file($file)) {
        return null;
    }
    $grant = json_decode((string) file_get_contents($file), true);
    if (!is_array($grant) || valid_token($grant['refresh_token'] ?? null) === null || !is_string($grant['login'] ?? null)) {
        error_log('oauth: github-grant.json is unreadable');
        return null;
    }
    return $grant;
}

function save_grant(array $grant): void
{
    try {
        write_private_file(config_path('github-grant.json'), json_encode($grant, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    } catch (RuntimeException $e) {
        throw new GrantError(GrantProblem::Storage, $e->getMessage());
    }
}

/** The grant described by a token answer of GitHub, or null if it holds no usable refresh token. */
function grant_from(array $data, string $login, int $connectedAt): ?array
{
    $refresh = valid_token($data['refresh_token'] ?? null);
    if ($refresh === null) {
        return null;
    }
    $now = time();
    return [
        'login' => $login,
        'refresh_token' => $refresh,
        'refresh_expires_at' => $now + (int) ($data['refresh_token_expires_in'] ?? REFRESH_TOKEN_LIFETIME),
        'connected_at' => $connectedAt,
        'refreshed_at' => $now,
    ];
}

/**
 * Trades the stored refresh token for a new access token and keeps the rotated refresh token.
 * @return array{token: string, grant: array}
 */
function refresh_grant(array $config): array
{
    return with_lock('grant', function () use ($config): array {
        $grant = load_grant();
        if ($grant === null) {
            throw new GrantError(GrantProblem::Missing);
        }
        $response = github_request($config, github_url($config, 'token'), [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'grant_type' => 'refresh_token',
            'refresh_token' => $grant['refresh_token'],
        ]);
        $data = $response['data'] ?? [];
        if ($response['status'] === 200 && is_string($data['error'] ?? null)) {
            throw new GrantError(GrantProblem::Revoked, single_line($data['error'], 100));
        }
        $next = $response['status'] === 200 ? grant_from($data, $grant['login'], (int) ($grant['connected_at'] ?? time())) : null;
        if ($next === null) {
            throw new GrantError(GrantProblem::Unreachable, $response['error'] !== '' ? single_line($response['error'], 200) : 'HTTP ' . $response['status']);
        }
        save_grant($next);
        $token = valid_token($data['access_token'] ?? null);
        if ($token === null) {
            throw new GrantError(GrantProblem::Unreachable, 'unusable access token');
        }
        return ['token' => $token, 'grant' => $next];
    });
}

/** Logs a failed renewal; problems only github-connect can fix are mailed as well, once a day. */
function report_grant_problem(GrantError $e, string $during): void
{
    log_event('grant_error', ['problem' => $e->problem->value, 'detail' => $e->getMessage(), 'during' => $during]);
    if ($e->problem === GrantProblem::Unreachable || !notice_due('grant-' . $e->problem->value, 86400)) {
        return;
    }
    send_notice('A tartalomkezelő belépése nem működik', implode("\n", [
        'Most senki sem tud belépni a weboldal tartalomkezelőjébe, mert megszakadt a kapcsolat a weboldal és a GitHub között. Maga a weboldal ettől függetlenül működik.',
        '',
        'Kérem, továbbítsa ezt a levelet a weboldal üzemeltetőjének.',
        '',
        '-- ',
        'Az üzemeltetőnek: a tárhelyen futtassa a ~/bin/mihalovits-admin github-connect parancsot. Ok: ' . $e->getMessage(),
    ]));
}

/** @return array{device_code: string, user_code: string, verification_uri: string, expires_in: int, interval: int} */
function device_start(array $config): array
{
    $response = github_request($config, github_url($config, 'device'), ['client_id' => $config['client_id']]);
    $data = $response['data'] ?? [];
    if ($response['status'] !== 200 || !is_string($data['device_code'] ?? null) || !is_string($data['user_code'] ?? null)) {
        $reason = is_string($data['error'] ?? null) ? $data['error'] : ($response['error'] !== '' ? $response['error'] : 'HTTP ' . $response['status']);
        throw new RuntimeException('GitHub did not start the device flow (' . single_line($reason, 100) . ')');
    }
    return [
        'device_code' => $data['device_code'],
        'user_code' => single_line($data['user_code'], 20),
        'verification_uri' => single_line($data['verification_uri'] ?? 'https://github.com/login/device', 200),
        'expires_in' => (int) ($data['expires_in'] ?? 900),
        'interval' => (int) ($data['interval'] ?? 5),
    ];
}

/** One poll of the device flow: GitHub's token answer, or ['error' => 'unreachable'] on transport problems. */
function device_poll(array $config, string $deviceCode): array
{
    $response = github_request($config, github_url($config, 'token'), [
        'client_id' => $config['client_id'],
        'device_code' => $deviceCode,
        'grant_type' => DEVICE_GRANT_TYPE,
    ]);
    if ($response['status'] !== 200 || $response['data'] === null) {
        return ['error' => 'unreachable', 'detail' => $response['error'] !== '' ? $response['error'] : 'HTTP ' . $response['status']];
    }
    return $response['data'];
}
