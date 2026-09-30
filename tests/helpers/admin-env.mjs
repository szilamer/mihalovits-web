// Fixture for the admin sign-in tests: a throwaway hosting account laid out like the real one
// (public_html/oauth/*.php, ~/.config/mihalovits, ~/.cache/mihalovits-oauth), a stand-in for the
// GitHub OAuth and REST endpoints the PHP code calls, and a sendmail that keeps each message as a file.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const hasPhp =
  spawnSync("php", ["-r", 'exit(defined("PASSWORD_ARGON2ID") && extension_loaded("curl") ? 0 : 1);']).status === 0;

export const REPO = "szilamer/mihalovits-web";
export const GITHUB_LOGIN = "szilamer";
export const REFRESH_TOKEN_LIFETIME = 15897600;

const token = (prefix, length) => prefix + randomBytes(length).toString("base64url").replace(/[-_]/g, "x").slice(0, length);
const phpString = (value) => `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const writePhpConfig = (file, values) =>
  writeFileSync(file, `<?php return [${Object.entries(values).map(([k, v]) => `${phpString(k)} => ${phpString(v)}`).join(", ")}];\n`);

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer()
      .on("error", reject)
      .listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        server.close(() => resolve(port));
      });
  });

function decodeMail(raw) {
  const [head, ...rest] = raw.replace(/\r\n/g, "\n").split("\n\n");
  const header = (name) => head.match(new RegExp(`^${name}: (.*)$`, "mi"))?.[1] ?? "";
  const words = (text) => text.replace(/=\?UTF-8\?B\?([^?]*)\?=/g, (_, b64) => Buffer.from(b64, "base64").toString("utf8"));
  return {
    to: header("To"),
    from: words(header("From")),
    subject: words(header("Subject")),
    body: Buffer.from(rest.join("\n\n").replace(/\s+/g, ""), "base64").toString("utf8"),
    raw,
  };
}

/** Plays GitHub: the token endpoint (refresh and device grants), the device-code endpoint and the REST calls. */
function createGithubStub() {
  const stub = {
    requests: [],
    issued: [],
    validRefresh: null,
    handlers: {},
    issue() {
      const tokens = { access_token: token("ghu_", 36), refresh_token: token("ghr_", 76) };
      stub.issued.push(tokens);
      stub.validRefresh = tokens.refresh_token;
      return {
        status: 200,
        body: { ...tokens, expires_in: 28800, refresh_token_expires_in: REFRESH_TOKEN_LIFETIME, scope: "", token_type: "bearer" },
      };
    },
    authorized: (req) => stub.issued.some((t) => req.headers.authorization === `Bearer ${t.access_token}`),
    reset() {
      stub.requests = [];
      stub.issued = [];
      stub.delay = 0;
      stub.validRefresh = token("ghr_", 76);
      let devicePolls = 0;
      stub.handlers = {
        refresh: (req) =>
          req.params.refresh_token === stub.validRefresh ? stub.issue() : { status: 200, body: { error: "bad_refresh_token" } },
        deviceCode: () => ({
          status: 200,
          body: { device_code: "d".repeat(40), user_code: "WDJB-MJHT", verification_uri: "https://github.com/login/device", expires_in: 900, interval: 1 },
        }),
        deviceToken: () => (++devicePolls === 1 ? { status: 200, body: { error: "authorization_pending" } } : stub.issue()),
        user: (req) => (stub.authorized(req) ? { status: 200, body: { login: GITHUB_LOGIN, id: 1 } } : { status: 401, body: {} }),
        repo: (req) =>
          stub.authorized(req)
            ? { status: 200, body: { full_name: REPO, permissions: { admin: true, push: true, pull: true } } }
            : { status: 401, body: {} },
        installations: (req) =>
          stub.authorized(req)
            ? { status: 200, body: { total_count: 1, installations: [{ id: 42, app_slug: "mihalovits-web-admin", permissions: { contents: "write", metadata: "read" } }] } }
            : { status: 401, body: {} },
        installationRepos: (req) =>
          stub.authorized(req) ? { status: 200, body: { total_count: 1, repositories: [{ full_name: REPO }] } } : { status: 401, body: {} },
      };
    },
  };

  const route = (method, path, params) => {
    if (method === "POST" && path === "/login/oauth/access_token") {
      return params.grant_type === "refresh_token" ? "refresh" : "deviceToken";
    }
    if (method === "POST" && path === "/login/device/code") return "deviceCode";
    if (method === "GET" && path === "/user") return "user";
    if (method === "GET" && path === "/user/installations") return "installations";
    if (method === "GET" && /^\/user\/installations\/\d+\/repositories$/.test(path)) return "installationRepos";
    if (method === "GET" && path === `/repos/${REPO}`) return "repo";
    return null;
  };

  stub.server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const url = new URL(req.url, "http://stub");
      const request = { method: req.method, path: url.pathname, headers: req.headers, params: Object.fromEntries(new URLSearchParams(body)) };
      stub.requests.push(request);
      const name = route(req.method, url.pathname, request.params);
      const { status, body: payload } = name ? stub.handlers[name](request) : { status: 404, body: { message: "Not Found" } };
      setTimeout(() => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(payload)), stub.delay);
    });
  });
  stub.reset();
  return stub;
}

export async function createAdminEnv() {
  const root = mkdtempSync(join(tmpdir(), "admin-signin-"));
  const home = join(root, "home");
  const webroot = join(home, "public_html");
  const configDir = join(home, ".config/mihalovits");
  const stateDir = join(home, ".cache/mihalovits-oauth");
  const mailDir = join(root, "mail");
  const configFile = join(configDir, "oauth.php");
  const grantFile = join(configDir, "github-grant.json");
  const editorsFile = join(configDir, "editors.json");
  mkdirSync(join(webroot, "admin"), { recursive: true });
  mkdirSync(configDir, { recursive: true });
  mkdirSync(mailDir);
  cpSync(new URL("../../public/oauth/", import.meta.url), join(webroot, "oauth"), { recursive: true });
  writeFileSync(join(webroot, "admin/config.yml"), `# test\n${JSON.stringify({ backend: { name: "github", repo: REPO } }, null, 2)}\n`);

  const github = createGithubStub();
  await new Promise((resolve) => github.server.listen(0, "127.0.0.1", resolve));
  const githubUrl = `http://127.0.0.1:${github.server.address().port}`;
  const site = `http://127.0.0.1:${await freePort()}`;

  writePhpConfig(configFile, {
    client_id: "Iv23test",
    client_secret: "test-client-secret",
    site,
    token_url: `${githubUrl}/login/oauth/access_token`,
    device_url: `${githubUrl}/login/device/code`,
    api_url: githubUrl,
  });
  writePhpConfig(join(configDir, "contact.php"), {
    to: "info@mihalovits.eu",
    from: "info@mihalovits.eu",
    from_name: "mihalovits.eu weboldal",
    site,
    secret: "s".repeat(64),
  });

  const sendmail = join(root, "sendmail.sh");
  writeFileSync(sendmail, `#!/bin/sh\n{ echo "ARGS: $*"; cat; } > "${mailDir}/$(date +%s)-$$.eml"\n`);
  chmodSync(sendmail, 0o755);
  const phpArgs = ["-d", `sendmail_path=${sendmail}`, "-d", "display_errors=0", "-d", `error_log=${join(root, "php.log")}`];

  let php;
  const env = {
    root,
    home,
    webroot,
    site,
    configFile,
    grantFile,
    editorsFile,
    stateDir,
    github,

    async startSite() {
      php = spawn("php", [...phpArgs, "-S", site.slice("http://".length), "-t", webroot], {
        stdio: "ignore",
        env: { ...process.env, PHP_CLI_SERVER_WORKERS: "4" },
      });
      for (let i = 0; i < 50; i++) {
        try {
          await fetch(`${site}/`);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      throw new Error("php -S did not start");
    },

    async stop() {
      php?.kill();
      await new Promise((resolve) => github.server.close(resolve));
      rmSync(root, { recursive: true, force: true });
    },

    /** Runs the account CLI the way ~/bin/mihalovits-admin does; asynchronous so the GitHub stub keeps answering. */
    cli(args, input = "") {
      return new Promise((resolve, reject) => {
        const child = spawn("php", [...phpArgs, join(webroot, "oauth/cli.php"), ...args], { stdio: ["pipe", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => (stdout += chunk));
        child.stderr.on("data", (chunk) => (stderr += chunk));
        child.on("error", reject);
        child.on("close", (status) => resolve({ status, stdout, stderr }));
        child.stdin.end(input);
      });
    },

    writeGrant(overrides = {}) {
      const now = Math.floor(Date.now() / 1000);
      const grant = {
        login: GITHUB_LOGIN,
        refresh_token: github.validRefresh,
        refresh_expires_at: now + REFRESH_TOKEN_LIFETIME,
        connected_at: now - 86400,
        refreshed_at: now - 86400,
        ...overrides,
      };
      writeFileSync(grantFile, JSON.stringify(grant), { mode: 0o600 });
      return grant;
    },
    readGrant: () => (existsSync(grantFile) ? JSON.parse(readFileSync(grantFile, "utf8")) : null),
    readEditors: () => (existsSync(editorsFile) ? JSON.parse(readFileSync(editorsFile, "utf8")) : null),
    fileMode: (file) => statSync(file).mode & 0o777,

    mails: () =>
      readdirSync(mailDir)
        .sort()
        .map((f) => decodeMail(readFileSync(join(mailDir, f), "utf8"))),
    authLog: () =>
      existsSync(join(stateDir, "auth.log"))
        ? readFileSync(join(stateDir, "auth.log"), "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
        : [],
    authLogText: () => (existsSync(join(stateDir, "auth.log")) ? readFileSync(join(stateDir, "auth.log"), "utf8") : ""),

    /** Fresh counters, logs, mailbox and GitHub stub; the grant matches the stub's current refresh token. */
    reset() {
      rmSync(stateDir, { recursive: true, force: true });
      for (const file of readdirSync(mailDir)) rmSync(join(mailDir, file));
      github.reset();
      env.writeGrant();
    },
  };
  return env;
}
