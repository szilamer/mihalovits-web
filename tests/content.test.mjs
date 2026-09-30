// Validates everything in content/ against the schemas the site build uses, so a broken admin
// save or hand edit fails CI with a readable message before it reaches the build or the server.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { contentFiles, practiceAreaFolder, practiceAreaSchema, SLUG_PATTERN } from "../src/content/schema.ts";

const root = new URL("../", import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, root), "utf8"));

function assertValid(schema, data, rel) {
  const result = schema.safeParse(data);
  assert.ok(result.success, result.success ? "" : `${rel}:\n${z.prettifyError(result.error)}`);
}

function* strings(value) {
  if (typeof value === "string") yield value;
  else if (value && typeof value === "object") for (const item of Object.values(value)) yield* strings(item);
}

const areaFiles = readdirSync(new URL(`${practiceAreaFolder}/`, root)).filter((f) => f.endsWith(".json"));
const allContent = [
  ...Object.values(contentFiles).map((entry) => entry.file),
  ...areaFiles.map((f) => `${practiceAreaFolder}/${f}`),
];

describe("content", () => {
  for (const entry of Object.values(contentFiles)) {
    test(`${entry.file} matches its schema`, () => assertValid(entry.schema, read(entry.file), entry.file));
  }

  test("there is at least one practice area", () => assert.ok(areaFiles.length > 0));

  for (const file of areaFiles) {
    const rel = `${practiceAreaFolder}/${file}`;
    test(`${rel} has a URL-safe name and matches its schema`, () => {
      assert.match(file.replace(/\.json$/, ""), SLUG_PATTERN);
      assertValid(practiceAreaSchema, read(rel), rel);
    });
  }

  test("every referenced image exists in public/", () => {
    const missing = allContent.flatMap((rel) =>
      [...strings(read(rel))]
        .filter((s) => /^\/(?:uploads|brand)\//.test(s))
        .filter((src) => !existsSync(new URL(`public${src}`, root)))
        .map((src) => `${rel}: ${src}`),
    );
    assert.deepEqual(missing, []);
  });

  test("practice-area contact topics are offered by the contact form", () => {
    const { topics } = read(contentFiles.contact.file);
    const unknown = areaFiles
      .map((f) => [f, read(`${practiceAreaFolder}/${f}`).contactTopic])
      .filter(([, topic]) => topic && !topics.includes(topic));
    assert.deepEqual(unknown, []);
  });

  test("content files use the admin's formatting (2-space JSON, trailing newline)", () => {
    for (const rel of allContent) {
      const raw = readFileSync(new URL(rel, root), "utf8");
      assert.equal(raw, `${JSON.stringify(JSON.parse(raw), null, 2)}\n`, rel);
    }
  });
});
