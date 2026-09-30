// Checks the generated admin configuration: valid for the bundled Sveltia CMS version, pointing
// at the right repository and sign-in endpoint, and not accepting uploads that could run script.
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import Ajv from "ajv";
import { CMS_REPO, cmsConfig } from "../scripts/cms-config.mjs";
import { SITE_URL } from "../src/content/schema.ts";

const root = new URL("../", import.meta.url);
const config = cmsConfig();

function* fieldsIn(fields) {
  for (const field of fields) {
    yield field;
    if (field.fields) yield* fieldsIn(field.fields);
    if (field.field) yield* fieldsIn([field.field]);
  }
}

const allFields = config.collections.flatMap((c) =>
  c.files ? c.files.flatMap((f) => [...fieldsIn(f.fields)]) : [...fieldsIn(c.fields)],
);

describe("admin configuration", () => {
  test("is valid for the installed Sveltia CMS version", () => {
    const schema = JSON.parse(readFileSync(new URL("node_modules/@sveltia/cms/schema/sveltia-cms.json", root), "utf8"));
    const validate = new Ajv({ allErrors: true, strict: false, logger: false }).compile(schema);
    assert.ok(validate(config), JSON.stringify(validate.errors, null, 2));
  });

  test("signs in through this site's OAuth endpoint and edits the site repository", () => {
    assert.deepEqual(
      {
        name: config.backend.name,
        repo: config.backend.repo,
        branch: config.backend.branch,
        base_url: config.backend.base_url,
        auth_endpoint: config.backend.auth_endpoint,
        auth_methods: config.backend.auth_methods,
      },
      {
        name: "github",
        repo: CMS_REPO,
        branch: "main",
        base_url: SITE_URL,
        auth_endpoint: "oauth/auth.php",
        auth_methods: ["oauth"],
      },
    );
    assert.ok(existsSync(new URL("public/oauth/auth.php", root)), "public/oauth/auth.php is missing");
  });

  test("uploads are raster images only, stored locally and converted to WebP", () => {
    const images = allFields.filter((f) => f.widget === "image");
    assert.ok(images.length > 0);
    for (const field of images) {
      assert.doesNotMatch(field.accept, /svg|\*/i, field.name);
      assert.equal(field.choose_url, false, field.name);
    }
    const media = config.media_libraries.default.config;
    assert.equal(media.transformations.raster_image.format, "webp");
    assert.equal(config.media_folder, "public/uploads");
  });

  test("every field has a label and every file or folder exists", () => {
    assert.deepEqual(allFields.filter((f) => !f.label?.trim()).map((f) => f.name), []);
    for (const c of config.collections) {
      for (const path of c.files ? c.files.map((f) => f.file) : [c.folder]) {
        assert.ok(existsSync(new URL(path, root)), path);
      }
    }
  });

  test("practice-area order is managed by drag and drop, not a form field", () => {
    const areas = config.collections.find((c) => c.folder);
    assert.equal(areas.reorder, true);
    assert.equal(areas.fields.some((f) => f.name === "order"), false);
  });
});
