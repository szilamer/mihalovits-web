// Integration tests for the admin's sign-in window (public/oauth/auth.php) against PHP's built-in
// server: editor accounts come from the account CLI, GitHub is played by a local stand-in.
import { existsSync, renameSync, rmSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createAdminEnv, hasPhp, REFRESH_TOKEN_LIFETIME } from "./helpers/admin-env.mjs";

const PASSWORD = "helyes-jelszo-2026-teszt";
const SIGN_IN_PATH = "/oauth/auth.php?provider=github&site_id=mihalovits.eu&scope=repo%2Cuser";
let env;

async function openForm() {
  const res = await fetch(env.site + SIGN_IN_PATH);
  const html = await res.text();
  const setCookie = res.headers.get("set-cookie") ?? "";
  return { res, html, setCookie, cookie: setCookie.split(";")[0], form: html.match(/name="form" value="([\w-]+)"/)?.[1] };
}

async function post({ cookie, body, headers = {} }) {
  const res = await fetch(`${env.site}/oauth/auth.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: env.site, ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body,
  });
  return { res, html: await res.text() };
}

async function signIn({ username = "teszt", password = PASSWORD, headers } = {}) {
  const { cookie, form } = await openForm();
  return post({ cookie, headers, body: new URLSearchParams({ form, username, password }) });
}

function popupMessage(html) {
  const match = html.match(/const message = (".*?");\n/);
  return match ? JSON.parse(match[1]) : null;
}

const tokenRequests = () => env.github.requests.filter((r) => r.path === "/login/oauth/access_token");

describe("admin sign-in window", { skip: !hasPhp && "php with Argon2 and curl not available" }, () => {
  before(async () => {
    env = await createAdminEnv();
    await env.startSite();
    const added = await env.cli(["add", "teszt", "Teszt Elek"], `${PASSWORD}\n`);
    assert.equal(added.status, 0, added.stderr);
  });

  after(() => env?.stop());

  beforeEach(() => env.reset());

  test("is a Hungarian sign-in form with a same-site form token and a strict CSP", async () => {
    const { res, html, setCookie, form } = await openForm();
    assert.equal(res.status, 200);
    assert.match(html, /<html lang="hu">/);
    for (const part of ['name="username"', 'autocomplete="username"', 'type="password"', 'autocomplete="current-password"', 'action="/oauth/auth.php"']) {
      assert.ok(html.includes(part), part);
    }
    assert.match(form, /^[\w-]{43}$/);
    assert.ok(setCookie.startsWith(`__Host-mihalovits_login=${form};`), setCookie);
    const attributes = setCookie.toLowerCase().split(/;\s*/);
    for (const attribute of ["path=/", "secure", "httponly", "samesite=strict"]) assert.ok(attributes.includes(attribute), attribute);

    const csp = res.headers.get("content-security-policy");
    for (const directive of ["default-src 'none'", "form-action 'self'", "frame-ancestors 'none'", "base-uri 'none'"]) {
      assert.ok(csp.includes(directive), directive);
    }
    const nonce = csp.match(/script-src 'nonce-([\w-]+)'/)[1];
    assert.ok(html.includes(`<script nonce="${nonce}">`));
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(env.github.requests.length, 0);
  });

  test("the right password trades the stored grant for a fresh GitHub token, handed to the site origin only", async () => {
    const grant = env.readGrant();
    const { res, html } = await signIn({ username: " TESZT " });
    assert.equal(res.status, 200);

    assert.equal(tokenRequests().length, 1);
    const { params } = tokenRequests()[0];
    assert.deepEqual(params, {
      client_id: "Iv23test",
      client_secret: "test-client-secret",
      grant_type: "refresh_token",
      refresh_token: grant.refresh_token,
    });
    const issued = env.github.issued.at(-1);
    assert.equal(popupMessage(html), `authorization:github:success:{"provider":"github","token":"${issued.access_token}"}`);
    assert.ok(html.includes(`const origin = "${env.site}";`));
    assert.ok(html.includes('if (event.source !== opener || event.origin !== origin || event.data !== "authorizing:github") return;'));
    assert.ok(html.includes("opener.postMessage(message, origin);"));
    assert.match(res.headers.get("set-cookie"), /__Host-mihalovits_login=deleted/);

    const stored = env.readGrant();
    assert.equal(stored.refresh_token, issued.refresh_token);
    assert.equal(stored.login, "szilamer");
    assert.equal(stored.connected_at, grant.connected_at);
    assert.ok(Math.abs(stored.refresh_expires_at - (Date.now() / 1000 + REFRESH_TOKEN_LIFETIME)) < 60);
    assert.equal(env.fileMode(env.grantFile), 0o600);

    const mails = env.mails();
    assert.equal(mails.length, 1);
    assert.equal(mails[0].to, "info@mihalovits.eu");
    assert.match(mails[0].subject, /Belépés/);
    assert.ok(mails[0].body.includes("Teszt Elek (teszt)"), mails[0].body);
    assert.ok(mails[0].body.includes("127.0.0.1"));

    const log = env.authLog();
    assert.deepEqual(log.map((e) => [e.event, e.user]), [["login", "teszt"]]);
    assert.equal(env.readEditors().teszt.last_login > 0, true);
    for (const secret of [PASSWORD, issued.access_token, issued.refresh_token]) {
      assert.ok(!env.authLogText().includes(secret));
      assert.ok(!mails[0].raw.includes(secret) && !mails[0].body.includes(secret));
    }
  });

  test("a wrong password and an unknown name get the same answer and never reach GitHub", async () => {
    const wrong = await signIn({ password: "rossz-jelszo-12345678" });
    const unknown = await signIn({ username: "nincs-ilyen" });
    for (const { res, html } of [wrong, unknown]) {
      assert.equal(res.status, 401);
      assert.ok(html.includes("Hibás felhasználónév vagy jelszó."));
      assert.equal(popupMessage(html), null);
      assert.match(html, /name="form" value="[\w-]{43}"/);
    }
    assert.ok(wrong.html.includes('value="teszt"'));
    assert.equal(env.github.requests.length, 0);
    assert.deepEqual(env.mails(), []);
    assert.deepEqual(env.authLog().map((e) => e.event), ["failure", "failure"]);
  });

  test("the fifth wrong password locks the account, even against the right one, until it is unlocked", async () => {
    for (let i = 0; i < 4; i++) assert.equal((await signIn({ password: `rossz-jelszo-${i}` })).res.status, 401);
    const fifth = await signIn({ password: "rossz-jelszo-4" });
    assert.equal(fifth.res.status, 429);
    assert.ok(fifth.html.includes("Túl sok sikertelen próbálkozás"));
    assert.match(fifth.html, /próbálja újra 15 perc múlva/);
    const locked = await signIn();
    assert.equal(locked.res.status, 429);
    assert.equal(env.github.requests.length, 0);

    const mails = env.mails();
    assert.equal(mails.length, 1);
    assert.match(mails[0].subject, /Sikertelen belépési kísérletek/);
    assert.ok(mails[0].body.includes("„teszt”"));

    const unlocked = await env.cli(["unlock", "teszt"]);
    assert.equal(unlocked.status, 0, unlocked.stderr);
    assert.equal((await signIn()).res.status, 200);
  });

  test("a successful sign-in resets the account's failure count", async () => {
    for (let i = 0; i < 4; i++) await signIn({ password: `rossz-jelszo-${i}` });
    assert.equal((await signIn()).res.status, 200);
    for (let i = 0; i < 4; i++) await signIn({ password: `rossz-jelszo-${i}` });
    assert.equal((await signIn()).res.status, 200);
  });

  test("an address that keeps failing is refused for every account", async () => {
    for (let i = 0; i < 10; i++) await signIn({ username: `ismeretlen${i}`, password: `rossz-jelszo-${i}` });
    const refused = await signIn();
    assert.equal(refused.res.status, 429);
    assert.equal(env.github.requests.length, 0);
    assert.equal(env.mails().length, 1);
  });

  test("the form token must come back in both the cookie and the form", async () => {
    const { form, cookie } = await openForm();
    const body = () => new URLSearchParams({ form, username: "teszt", password: PASSWORD });
    for (const attempt of [{ body: body() }, { body: body(), cookie: "__Host-mihalovits_login=masik-token" }, { body: new URLSearchParams({ username: "teszt", password: PASSWORD }), cookie }]) {
      const { res, html } = await post(attempt);
      assert.equal(res.status, 400);
      assert.ok(html.includes("Az űrlap lejárt"));
      assert.match(html, /name="form" value="[\w-]{43}"/);
    }
    assert.equal(env.github.requests.length, 0);
    assert.deepEqual(env.authLog().map((e) => e.event), []);
  });

  test("requests from another site are refused before anything else", async () => {
    for (const headers of [{ Origin: "https://evil.example" }, { "Sec-Fetch-Site": "cross-site" }]) {
      const { res } = await signIn({ headers });
      assert.equal(res.status, 403);
    }
    assert.equal(env.github.requests.length, 0);
    assert.deepEqual(env.authLog(), []);
  });

  test("only small form posts are accepted", async () => {
    const { cookie, form } = await openForm();
    const json = await post({ cookie, body: JSON.stringify({ form, username: "teszt", password: PASSWORD }), headers: { "Content-Type": "application/json" } });
    assert.equal(json.res.status, 415);
    const huge = await post({ cookie, body: new URLSearchParams({ form, username: "teszt", password: "x".repeat(5000) }) });
    assert.equal(huge.res.status, 413);
    assert.equal(env.github.requests.length, 0);
  });

  test("a disabled account cannot sign in until it is enabled again", async () => {
    assert.equal((await env.cli(["disable", "teszt"])).status, 0);
    const refused = await signIn();
    assert.equal(refused.res.status, 401);
    assert.ok(refused.html.includes("Hibás felhasználónév vagy jelszó."));
    assert.equal((await env.cli(["enable", "teszt"])).status, 0);
    assert.equal((await signIn()).res.status, 200);
  });

  test("when GitHub no longer accepts the grant, the editor is sent to the operator and nothing reaches the CMS", async () => {
    env.github.validRefresh = "ghr_revoked";
    const grant = env.readGrant();
    const { res, html } = await signIn();
    assert.equal(res.status, 503);
    assert.ok(html.includes("üzemeltető"));
    assert.equal(popupMessage(html), null);
    assert.deepEqual(env.readGrant(), grant);
    const mails = env.mails();
    assert.equal(mails.length, 1);
    assert.ok(mails[0].body.includes("mihalovits-admin github-connect"));
    assert.deepEqual(env.authLog().map((e) => e.event), ["grant_error"]);
  });

  test("without a GitHub connection the right password gets the same clear answer", async () => {
    rmSync(env.grantFile);
    const { res, html } = await signIn();
    assert.equal(res.status, 503);
    assert.ok(html.includes("üzemeltető"));
    assert.equal(env.github.requests.length, 0);
  });

  test("when GitHub is down or answers oddly the grant is kept and nothing odd reaches the page", async () => {
    const grant = env.readGrant();
    env.github.handlers.refresh = () => ({ status: 500, body: {} });
    const down = await signIn();
    assert.equal(down.res.status, 502);
    assert.ok(down.html.includes("próbálja újra"));
    assert.deepEqual(env.readGrant(), grant);

    const rotated = "ghr_" + "R".repeat(76);
    env.github.handlers.refresh = () => ({
      status: 200,
      body: { access_token: 'ghu_x"</script><script>alert(1)</script>', refresh_token: rotated, expires_in: 28800, refresh_token_expires_in: REFRESH_TOKEN_LIFETIME },
    });
    const odd = await signIn();
    assert.equal(odd.res.status, 502);
    assert.ok(!odd.html.includes("alert(1)"));
    assert.equal(popupMessage(odd.html), null);
    assert.equal(env.readGrant().refresh_token, rotated, "a valid rotated refresh token is kept even when the access token is unusable");
  });

  test("two sign-ins at the same moment each get a token from the rotating refresh token", async () => {
    env.github.delay = 300;
    const results = await Promise.all([signIn(), signIn()]);
    assert.deepEqual(results.map((r) => r.res.status), [200, 200]);
    const used = tokenRequests().map((r) => r.params.refresh_token);
    assert.equal(new Set(used).size, 2);
    assert.equal(env.readGrant().refresh_token, env.github.issued.at(-1).refresh_token);
  });

  test("other methods are refused", async () => {
    const res = await fetch(`${env.site}/oauth/auth.php`, { method: "PUT" });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("allow"), "GET, POST");
  });

  test("the helper files do nothing when requested directly", async () => {
    for (const file of ["common.php", "accounts.php", "github.php"]) {
      const res = await fetch(`${env.site}/oauth/${file}`);
      assert.equal((await res.text()).trim(), "", file);
    }
    const cli = await fetch(`${env.site}/oauth/cli.php?list`);
    assert.equal(cli.status, 404);
    assert.equal((await cli.text()).trim(), "");
  });

  test("without configuration the window says sign-in is unavailable", async () => {
    renameSync(env.configFile, `${env.configFile}.off`);
    try {
      const res = await fetch(env.site + SIGN_IN_PATH);
      assert.equal(res.status, 503);
      assert.ok((await res.text()).includes("nem érhető el"));
    } finally {
      renameSync(`${env.configFile}.off`, env.configFile);
    }
  });

  test("the GitHub callback of the former sign-in is gone", () => {
    assert.equal(existsSync(new URL("../public/oauth/callback.php", import.meta.url)), false);
  });
});
