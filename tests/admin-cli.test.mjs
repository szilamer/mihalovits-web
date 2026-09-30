// Tests for the admin account CLI (public/oauth/cli.php, run on the host as ~/bin/mihalovits-admin):
// editor accounts, the one-time GitHub connection through the device flow, and its renewal.
import { readFileSync, rmSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createAdminEnv, GITHUB_LOGIN, hasPhp, REFRESH_TOKEN_LIFETIME, REPO } from "./helpers/admin-env.mjs";

const PASSWORD = "hosszu-eros-jelszo-2026";
const DAY = 86400;
let env;

const now = () => Math.floor(Date.now() / 1000);

describe("admin account CLI", { skip: !hasPhp && "php with Argon2 and curl not available" }, () => {
  before(async () => {
    env = await createAdminEnv();
  });

  after(() => env?.stop());

  beforeEach(() => {
    env.reset();
    rmSync(env.editorsFile, { force: true });
  });

  test("add stores an Argon2id hash in a private file and never prints the password", async () => {
    const added = await env.cli(["add", "mate", "Dr.", "Mihalovits", "Máté"], `${PASSWORD}\n`);
    assert.equal(added.status, 0, added.stderr);
    const { mate } = env.readEditors();
    assert.equal(mate.name, "Dr. Mihalovits Máté");
    assert.match(mate.hash, /^\$argon2id\$/);
    assert.equal(mate.disabled, false);
    assert.equal(env.fileMode(env.editorsFile), 0o600);
    for (const text of [added.stdout, added.stderr, readFileSync(env.editorsFile, "utf8"), env.authLogText()]) {
      assert.ok(!text.includes(PASSWORD));
    }
  });

  test("add refuses weak passwords, odd names and duplicates", async () => {
    assert.notEqual((await env.cli(["add", "mate", "Máté"], "rovid-jelszo\n")).status, 0);
    assert.notEqual((await env.cli(["add", "Máté", "Máté"], `${PASSWORD}\n`)).status, 0);
    assert.notEqual((await env.cli(["add", "mate"], `${PASSWORD}\n`)).status, 0);
    assert.equal(env.readEditors(), null);
    assert.equal((await env.cli(["add", "mate", "Máté"], `${PASSWORD}\n`)).status, 0);
    const duplicate = await env.cli(["add", "mate", "Máté"], `${PASSWORD}\n`);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /already exists/);
  });

  test("passwd, disable, enable and remove change the account and what list shows", async () => {
    await env.cli(["add", "mate", "Dr. Mihalovits Máté"], `${PASSWORD}\n`);
    const before = env.readEditors().mate.hash;
    assert.equal((await env.cli(["passwd", "mate"], "masik-hosszu-jelszo-2026\n")).status, 0);
    assert.notEqual(env.readEditors().mate.hash, before);

    assert.equal((await env.cli(["disable", "mate"])).status, 0);
    let list = await env.cli(["list"]);
    assert.match(list.stdout, /^mate\s+Dr\. Mihalovits Máté\s+disabled\s+never signed in$/m);
    assert.equal((await env.cli(["enable", "mate"])).status, 0);
    list = await env.cli(["list"]);
    assert.match(list.stdout, /^mate\s+Dr\. Mihalovits Máté\s+active\s+never signed in$/m);

    assert.equal((await env.cli(["remove", "mate"])).status, 0);
    assert.deepEqual(env.readEditors(), {});
    assert.notEqual((await env.cli(["passwd", "nincs"], `${PASSWORD}\n`)).status, 0);
    assert.notEqual((await env.cli(["frobnicate"])).status, 0);
  });

  test("github-connect walks through the device flow and keeps only the refresh token", async () => {
    rmSync(env.grantFile);
    const connect = await env.cli(["github-connect"]);
    assert.equal(connect.status, 0, connect.stderr);
    assert.ok(connect.stdout.includes("https://github.com/login/device"));
    assert.ok(connect.stdout.includes("WDJB-MJHT"));
    assert.ok(connect.stdout.includes(`Connected as ${GITHUB_LOGIN}`));

    const [start, ...rest] = env.github.requests;
    assert.equal(start.path, "/login/device/code");
    assert.deepEqual(start.params, { client_id: "Iv23test" });
    const polls = rest.filter((r) => r.path === "/login/oauth/access_token");
    assert.equal(polls.length, 2);
    for (const poll of polls) {
      assert.deepEqual(poll.params, { client_id: "Iv23test", device_code: "d".repeat(40), grant_type: "urn:ietf:params:oauth:grant-type:device_code" });
    }
    const issued = env.github.issued.at(-1);
    const checks = rest.filter((r) => r.method === "GET").map((r) => r.path);
    assert.deepEqual(checks, ["/user", `/repos/${REPO}`, "/user/installations", "/user/installations/42/repositories"]);

    const grant = env.readGrant();
    assert.equal(grant.login, GITHUB_LOGIN);
    assert.equal(grant.refresh_token, issued.refresh_token);
    assert.ok(Math.abs(grant.refresh_expires_at - (now() + REFRESH_TOKEN_LIFETIME)) < 60);
    assert.equal(env.fileMode(env.grantFile), 0o600);
    assert.ok(!JSON.stringify(grant).includes(issued.access_token));
    for (const secret of [issued.access_token, issued.refresh_token]) {
      assert.ok(!connect.stdout.includes(secret) && !connect.stderr.includes(secret) && !env.authLogText().includes(secret));
    }

    const status = await env.cli(["github-status"]);
    assert.equal(status.status, 0);
    assert.match(status.stdout, new RegExp(`connected as ${GITHUB_LOGIN}`));
  });

  test("github-connect refuses tokens that do not expire, and accounts that cannot write the site repository", async () => {
    rmSync(env.grantFile);
    env.github.handlers.deviceToken = () => ({ status: 200, body: { access_token: "ghu_" + "A".repeat(36), token_type: "bearer", scope: "" } });
    const lasting = await env.cli(["github-connect"]);
    assert.notEqual(lasting.status, 0);
    assert.match(lasting.stderr, /Expire user authorization tokens/);
    assert.equal(env.readGrant(), null);

    env.github.reset();
    env.github.handlers.installationRepos = () => ({ status: 200, body: { total_count: 1, repositories: [{ full_name: "someone/else" }] } });
    const elsewhere = await env.cli(["github-connect"]);
    assert.notEqual(elsewhere.status, 0);
    assert.match(elsewhere.stderr, new RegExp(`not installed on ${REPO}`));
    assert.equal(env.readGrant(), null);

    env.github.reset();
    env.github.handlers.deviceToken = () => ({ status: 200, body: { error: "access_denied" } });
    const denied = await env.cli(["github-connect"]);
    assert.notEqual(denied.status, 0);
    assert.match(denied.stderr, /declined/);
  });

  test("keepalive renews the grant only when it is getting old", async () => {
    const fresh = env.writeGrant({ refresh_expires_at: now() + 170 * DAY });
    const quiet = await env.cli(["keepalive"]);
    assert.equal(quiet.status, 0, quiet.stderr);
    assert.equal(env.github.requests.length, 0);
    assert.deepEqual(env.readGrant(), fresh);

    env.writeGrant({ refresh_expires_at: now() + 100 * DAY });
    const renewed = await env.cli(["keepalive"]);
    assert.equal(renewed.status, 0, renewed.stderr);
    assert.equal(env.github.requests.length, 1);
    assert.equal(env.readGrant().refresh_token, env.github.issued.at(-1).refresh_token);
    assert.deepEqual(env.authLog().map((e) => e.event), ["keepalive"]);
  });

  test("keepalive reports a revoked grant by mail and exit code", async () => {
    env.writeGrant({ refresh_expires_at: now() + 10 * DAY });
    env.github.validRefresh = "ghr_revoked";
    const result = await env.cli(["keepalive"]);
    assert.notEqual(result.status, 0);
    assert.equal(env.mails().length, 1);
    assert.ok(env.mails()[0].body.includes("mihalovits-admin github-connect"));
  });
});
