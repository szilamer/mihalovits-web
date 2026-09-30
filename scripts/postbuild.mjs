#!/usr/bin/env node
// Finalises the static export in out/ for the Apache host:
//  - allows exactly the inline <script> blocks Next.js emitted by adding their SHA-256 hashes to the CSP,
//  - keeps the preview gate (password + noindex) unless SITE_PREVIEW=off,
//  - fails when the output contains something the CSP would silently break.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const out = fileURLToPath(new URL("../out/", import.meta.url));
const htaccessPath = join(out, ".htaccess");
const preview = (process.env.SITE_PREVIEW ?? "on").toLowerCase() !== "off";
const EXECUTABLE_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);
// Every hash listed here is trusted by the CSP, so only the two shapes Next.js emits for its
// flight data are accepted; any other inline script (e.g. markup smuggled in through editable
// content) fails the build instead of being allowed.
const NEXT_INLINE_SCRIPTS = [
  /^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)$/,
  /^self\.__next_f\.push\(\[\d+,[\s\S]*\]\)$/,
];

const fail = (message) => {
  console.error(`postbuild: ${message}`);
  process.exit(1);
};

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );

if (!existsSync(htaccessPath)) fail("out/.htaccess is missing – run `next build` first");

// The dev-only Next route handler must never reach the host.
rmSync(join(out, "api"), { recursive: true, force: true });

const hashes = new Set();
const problems = [];
const pages = walk(out).filter((file) => file.endsWith(".html"));

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const where = relative(out, file);

  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1];
    if (src !== undefined) {
      if (!src.startsWith("/") || src.startsWith("//")) problems.push(`${where}: third-party script ${src}`);
      continue;
    }
    const type = (attrs.match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").toLowerCase();
    if (!EXECUTABLE_TYPES.has(type)) continue;
    if (!NEXT_INLINE_SCRIPTS.some((shape) => shape.test(body))) {
      problems.push(`${where}: unexpected inline script ${JSON.stringify(body.slice(0, 60))}`);
      continue;
    }
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }

  const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(markup)) problems.push(`${where}: inline event handler attribute`);
  if (/\b(?:href|src|action)\s*=\s*["']\s*javascript:/i.test(markup)) problems.push(`${where}: javascript: URL`);
}

if (problems.length > 0) fail(`output violates the CSP:\n  ${problems.join("\n  ")}`);
if (pages.length === 0 || hashes.size === 0) fail("no pages or inline scripts found – unexpected export shape");

const template = readFileSync(htaccessPath, "utf8");
if (template.split("__CSP_SCRIPT_HASHES__").length !== 2) fail("public/.htaccess must contain the CSP placeholder exactly once");
let htaccess = template.replace("__CSP_SCRIPT_HASHES__", [...hashes].sort().join(" "));
if (!preview) {
  htaccess = htaccess.replace(/^# BEGIN preview-gate\n[\s\S]*?^# END preview-gate\n\n?/m, "");
}
if (/__[A-Z_]+__/.test(htaccess)) fail("unresolved placeholder left in out/.htaccess");
if (preview !== htaccess.includes("# BEGIN preview-gate")) fail("preview-gate block not found in public/.htaccess");
writeFileSync(htaccessPath, htaccess);

console.log(
  `postbuild: ${pages.length} pages, ${hashes.size} inline script hashes, preview gate ${preview ? "ON (password + noindex)" : "OFF (public)"}`,
);
