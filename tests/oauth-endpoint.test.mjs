// Integration tests for the admin's GitHub sign-in (public/oauth/*.php) against PHP's built-in
// server, with a local stand-in for GitHub's authorize and token endpoints.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

const hasPhp = spawnSync("php", ["-v"]).status === 0;
const root = mkdtempSync(join(tmpdir(), "oauth-test-"));
const home = join(root, "home");
const webroot = join(home, "public_html");
const configFile = join(home, ".config/mihalovits/oauth.php");
const phpPort = 19000 + Math.floor(Math.random() * 500);
const githubPort = phpPort + 500;
const site = `http://127.0.0.1:${phpPort}`;
const TOKEN = "ghu_" + "T".repeat(36);
let php;
let github;
let tokenRequests = [];
let tokenResponse;

const base64url = (buffer) => buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function startAuth() {
  const res = await fetch(`${site}/oauth/auth.php?provider=github&site_id=mihalovits.eu&scope=repo`, { redirect: "manual" });
  const location = new URL(res.headers.get("location"));
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  return { res, location, setCookie, cookie, state: location.searchParams.get("state") };
}

const callback = (query, cookie) =>
  fetch(`${site}/oauth/callback.php?${new URLSearchParams(query)}`, { headers: cookie ? { Cookie: cookie } : {} });

function popupMessage(html) {
  const match = html.match(/const message = (".*?");\n/);
  return match ? JSON.parse(match[1]) : null;
}

describe("oauth endpoints", { skip: !hasPhp && "php binary not available" }, () => {
  before(async () => {
    mkdirSync(join(webroot, "oauth"), { recursive: true });
    mkdirSync(join(home, ".config/mihalovits"), { recursive: true });
    for (const file of ["common.php", "auth.php", "callback.php"]) {
      copyFileSync(new URL(`../public/oauth/${file}`, import.meta.url), join(webroot, "oauth", file));
    }
    const config = {
      client_id: "Iv23test",
      client_secret: "test-client-secret",
      site,
      authorize_url: `http://127.0.0.1:${githubPort}/login/oauth/authorize`,
      token_url: `http://127.0.0.1:${githubPort}/login/oauth/access_token`,
    };
    const entries = Object.entries(config).map(([key, value]) => `'${key}' => '${value}'`);
    writeFileSync(configFile, `<?php return [${entries.join(", ")}];\n`);

    github = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        tokenRequests.push({ url: req.url, headers: req.headers, params: Object.fromEntries(new URLSearchParams(body)) });
        res.writeHead(tokenResponse.status, { "Content-Type": "application/json" }).end(JSON.stringify(tokenResponse.body));
      });
    }).listen(githubPort, "127.0.0.1");

    php = spawn("php", ["-S", `127.0.0.1:${phpPort}`, "-t", webroot], { stdio: "ignore" });
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(`${site}/`);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error("php server did not start");
  });

  after(() => {
    php?.kill();
    github?.close();
    rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    tokenRequests = [];
    tokenResponse = { status: 200, body: { access_token: TOKEN, token_type: "bearer", expires_in: 28800 } };
  });

  test("auth.php redirects to GitHub with state and PKCE, remembered in a __Host- cookie", async () => {
    const { res, location, setCookie, state } = await startAuth();
    assert.equal(res.status, 302);
    assert.equal(location.origin + location.pathname, `http://127.0.0.1:${githubPort}/login/oauth/authorize`);
    assert.equal(location.searchParams.get("client_id"), "Iv23test");
    assert.equal(location.searchParams.get("redirect_uri"), `${site}/oauth/callback.php`);
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    assert.match(state, /^[\w-]{43}$/);
    assert.match(setCookie, /^__Host-mihalovits_oauth=/);
    const attributes = setCookie.toLowerCase().split(/;\s*/);
    for (const attribute of ["path=/", "secure", "httponly", "samesite=lax"]) assert.ok(attributes.includes(attribute), attribute);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });

  test("a valid callback exchanges the code with PKCE and hands the token to the site origin only", async () => {
    const { location, cookie, state } = await startAuth();
    const res = await callback({ code: "abc123", state }, cookie);
    const html = await res.text();
    assert.equal(res.status, 200);

    assert.equal(tokenRequests.length, 1);
    const { params, headers } = tokenRequests[0];
    assert.equal(params.client_id, "Iv23test");
    assert.equal(params.client_secret, "test-client-secret");
    assert.equal(params.code, "abc123");
    assert.equal(params.redirect_uri, `${site}/oauth/callback.php`);
    assert.equal(base64url(createHash("sha256").update(params.code_verifier).digest()), location.searchParams.get("code_challenge"));
    assert.equal(headers.accept, "application/json");

    assert.equal(popupMessage(html), `authorization:github:success:{"provider":"github","token":"${TOKEN}"}`);
    assert.ok(html.includes(`const origin = "${site}";`));
    assert.ok(html.includes('event.data !== "authorizing:github"'));
    const nonce = res.headers.get("content-security-policy").match(/'nonce-([\w-]+)'/)[1];
    assert.ok(html.includes(`<script nonce="${nonce}">`));
    assert.match(res.headers.get("content-security-policy"), /default-src 'none'/);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("referrer-policy"), "no-referrer");
    assert.match(res.headers.get("set-cookie"), /__Host-mihalovits_oauth=deleted/);
  });

  test("a state that does not match the cookie is rejected without contacting GitHub", async () => {
    const { cookie } = await startAuth();
    const res = await callback({ code: "abc123", state: "forged-state" }, cookie);
    assert.equal(res.status, 400);
    assert.match(popupMessage(await res.text()), /^authorization:github:error:/);
    assert.equal(tokenRequests.length, 0);
  });

  test("a callback without the state cookie is rejected", async () => {
    const { state } = await startAuth();
    const res = await callback({ code: "abc123", state });
    assert.equal(res.status, 400);
    assert.equal(tokenRequests.length, 0);
  });

  test("a denied consent is reported as an error", async () => {
    const { cookie, state } = await startAuth();
    const res = await callback({ error: "access_denied", state }, cookie);
    const message = popupMessage(await res.text());
    assert.match(message, /^authorization:github:error:/);
    assert.ok(JSON.parse(message.split(":error:")[1]).error.length > 0);
    assert.equal(tokenRequests.length, 0);
  });

  test("a malformed code is rejected before the exchange", async () => {
    const { cookie, state } = await startAuth();
    const res = await callback({ code: "abc<script>", state }, cookie);
    assert.equal(res.status, 400);
    assert.equal(tokenRequests.length, 0);
  });

  test("a failed exchange or an odd token never reaches the page", async () => {
    for (const response of [
      { status: 200, body: { error: "bad_verification_code" } },
      { status: 500, body: {} },
      { status: 200, body: { access_token: 'ghu_x"</script><script>alert(1)</script>' } },
    ]) {
      tokenResponse = response;
      const { cookie, state } = await startAuth();
      const res = await callback({ code: "abc123", state }, cookie);
      const html = await res.text();
      assert.equal(res.status, 502);
      assert.match(popupMessage(html), /^authorization:github:error:/);
      assert.ok(!html.includes("alert(1)"));
    }
  });

  test("other methods are refused", async () => {
    const auth = await fetch(`${site}/oauth/auth.php`, { method: "POST", redirect: "manual" });
    assert.equal(auth.status, 405);
    const cb = await fetch(`${site}/oauth/callback.php`, { method: "POST" });
    assert.equal(cb.status, 405);
  });

  test("without configuration the popup reports that sign-in is unavailable", async () => {
    renameSync(configFile, `${configFile}.off`);
    try {
      const res = await fetch(`${site}/oauth/auth.php`, { redirect: "manual" });
      assert.equal(res.status, 503);
      assert.match(popupMessage(await res.text()), /^authorization:github:error:/);
    } finally {
      renameSync(`${configFile}.off`, configFile);
    }
  });
});
