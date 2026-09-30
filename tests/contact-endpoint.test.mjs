// Integration tests for public/contact.php against PHP's built-in server.
// Mirrors the hosting layout: <home>/public_html/contact.php plus config and
// rate-limit storage in <home>/.config and <home>/.cache (outside the web root).
import { spawn, spawnSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";

const SECRET = "test-secret-" + "a".repeat(40);
const SITE = "https://mihalovits.eu";
const hasPhp = spawnSync("php", ["-v"]).status === 0;

const root = mkdtempSync(join(tmpdir(), "contact-test-"));
const home = join(root, "home");
const webroot = join(home, "public_html");
const configFile = join(home, ".config/mihalovits/contact.php");
const cacheDir = join(home, ".cache/mihalovits-contact");
const mailDir = join(root, "mail");
const port = 18000 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}/contact.php`;
let server;

function forgeToken(ageSeconds) {
  const ts = String(Math.floor(Date.now() / 1000) - ageSeconds);
  const nonce = randomBytes(8).toString("hex");
  return `${ts}.${nonce}.${createHmac("sha256", SECRET).update(`contact|${ts}|${nonce}`).digest("hex")}`;
}

const valid = () => ({
  name: "Teszt Elek",
  email: "teszt.elek@example.com",
  phone: "+36 30 123 4567",
  topic: "Ingatlanjog",
  message: "Ez egy automatikus teszt üzenet, kérem hagyja figyelmen kívül.",
  consent: true,
  company: "",
  token: forgeToken(10),
});

async function post(body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { res, json: await res.json().catch(() => null) };
}

const mails = () => (existsSync(mailDir) ? readdirSync(mailDir).sort().map((f) => readFileSync(join(mailDir, f), "utf8")) : []);

describe("contact.php", { skip: !hasPhp && "php binary not available" }, () => {
  before(async () => {
    mkdirSync(webroot, { recursive: true });
    mkdirSync(join(home, ".config/mihalovits"), { recursive: true });
    mkdirSync(mailDir);
    copyFileSync(new URL("../public/contact.php", import.meta.url), join(webroot, "contact.php"));
    writeFileSync(
      configFile,
      `<?php return ['to' => 'info@mihalovits.eu', 'from' => 'info@mihalovits.eu', 'from_name' => 'mihalovits.eu – weboldal', 'site' => '${SITE}', 'secret' => '${SECRET}'];\n`,
    );
    const sendmail = join(root, "sendmail.sh");
    writeFileSync(sendmail, `#!/bin/sh\n{ echo "ARGS: $*"; cat; } > "${mailDir}/$(date +%s)-$$.eml"\n`);
    chmodSync(sendmail, 0o755);

    server = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", webroot, "-d", `sendmail_path=${sendmail}`, "-d", "display_errors=0", "-d", `error_log=${join(root, "php.log")}`], { stdio: "ignore" });
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(url);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error("php -S did not start");
  });

  after(() => {
    server?.kill();
    rmSync(root, { recursive: true, force: true });
  });

  test("rejects non-POST with 405 and hardening headers", async () => {
    const res = await fetch(url);
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("allow"), "POST");
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("content-security-policy") ?? "", /default-src 'none'/);
  });

  test("rejects non-JSON content type", async () => {
    const { res } = await post("name=x", { "Content-Type": "application/x-www-form-urlencoded" });
    assert.equal(res.status, 415);
  });

  test("rejects foreign origins and cross-site fetches", async () => {
    assert.equal((await post({ action: "token" }, { Origin: "https://evil.example" })).res.status, 403);
    assert.equal((await post({ action: "token" }, { "Sec-Fetch-Site": "cross-site" })).res.status, 403);
    assert.equal((await post({ action: "token" }, { Origin: SITE, "Sec-Fetch-Site": "same-origin" })).res.status, 200);
  });

  test("rejects oversized and malformed bodies", async () => {
    assert.equal((await post({ ...valid(), message: "x".repeat(25000) })).res.status, 413);
    const { res, json } = await post("{not json");
    assert.equal(res.status, 400);
    assert.equal(json.code, "bad_request");
    assert.equal((await post(Buffer.from('{"name":"\xff\xfe"}', "latin1"))).res.status, 400);
  });

  test("issues signed tokens that are refused when used too fast", async () => {
    const { json } = await post({ action: "token" });
    assert.match(json.token, /^\d{10}\.[a-f0-9]{16}\.[a-f0-9]{64}$/);
    const { res, json: reply } = await post({ ...valid(), token: json.token });
    assert.equal(res.status, 400);
    assert.equal(reply.code, "token_too_fast");
  });

  test("refuses tampered, missing and expired tokens", async () => {
    const tampered = forgeToken(10).replace(/.$/, (c) => (c === "0" ? "1" : "0"));
    assert.equal((await post({ ...valid(), token: tampered })).json.code, "token_invalid");
    assert.equal((await post({ ...valid(), token: undefined })).json.code, "token_invalid");
    assert.equal((await post({ ...valid(), token: forgeToken(7300) })).json.code, "token_expired");
  });

  test("silently accepts honeypot submissions without sending", async () => {
    const before = mails().length;
    const { res, json } = await post({ ...valid(), company: "Spam Kft." });
    assert.equal(res.status, 200);
    assert.equal(json.ok, true);
    assert.equal(mails().length, before);
  });

  test("sends a well-formed, injection-safe e-mail", async () => {
    const payload = { ...valid(), name: "Árvíztűrő Tükörfúró\r\nBcc: victim@example.com", message: "Első sor.\nMásodik sor: ügyvédi titok védi?\r\nBcc: x@y.z" };
    const { res, json } = await post(payload);
    assert.equal(res.status, 200, JSON.stringify(json));
    const mail = mails().at(-1);
    const [head, ...rest] = mail.split(/\r?\n\r?\n/);
    assert.match(head, /^ARGS: .*-finfo@mihalovits\.eu/m);
    assert.doesNotMatch(head, /^Bcc:/im);
    assert.match(head, /^To: info@mihalovits\.eu$/m);
    assert.match(head, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m);
    const replyTo = head.match(/^Reply-To: =\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?= <([^>]+)>$/m);
    assert.ok(replyTo, "Reply-To must be RFC 2047 encoded");
    assert.equal(Buffer.from(replyTo[1], "base64").toString("utf8"), "Árvíztűrő Tükörfúró Bcc: victim@example.com");
    assert.equal(replyTo[2], "teszt.elek@example.com");
    assert.match(head, /^Content-Transfer-Encoding: base64$/m);
    const body = Buffer.from(rest.join("\n").replace(/\s+/g, ""), "base64").toString("utf8");
    assert.match(body, /Név: Árvíztűrő Tükörfúró Bcc: victim@example.com/);
    assert.match(body, /Első sor\.\nMásodik sor: ügyvédi titok védi\?\nBcc: x@y\.z/);
    assert.doesNotMatch(body, /127\.0\.0\.1/, "client IP must not be e-mailed");
  });

  test("rejects header-injection in the e-mail field", async () => {
    const { res, json } = await post({ ...valid(), email: "a@b.hu\r\nBcc: x@y.z" });
    assert.equal(res.status, 422);
    assert.ok(json.errors.email);
  });

  test("returns field errors mirroring the client schema", async () => {
    const { res, json } = await post({ token: forgeToken(10), name: "a", email: "nope", phone: "abc", topic: "", message: "rövid", consent: false });
    assert.equal(res.status, 422);
    assert.deepEqual(Object.keys(json.errors).sort(), ["consent", "email", "message", "name", "phone", "topic"]);
  });

  test("rate-limits per client and stores only hashed keys", async () => {
    rmSync(cacheDir, { recursive: true, force: true });
    const bad = () => ({ ...valid(), message: "rövid" });
    for (let i = 0; i < 5; i++) assert.equal((await post(bad())).res.status, 422, `request ${i + 1}`);
    const { res, json } = await post(bad());
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "600");
    assert.equal(json.code, "rate_limited");
    const files = readdirSync(cacheDir);
    assert.ok(files.includes("global.json"));
    assert.ok(files.every((f) => /^(global|[a-f0-9]{32})\.json$/.test(f)), files.join(","));
    assert.ok(!readFileSync(join(cacheDir, files.find((f) => f !== "global.json")), "utf8").includes("127.0.0.1"));
  });

  test("fails closed with 503 when the server config is missing", async () => {
    renameSync(configFile, configFile + ".off");
    try {
      const { res, json } = await post({ action: "token" });
      assert.equal(res.status, 503);
      assert.equal(json.code, "unavailable");
    } finally {
      renameSync(configFile + ".off", configFile);
    }
  });
});
