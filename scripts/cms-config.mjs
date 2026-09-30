// Generates the Sveltia CMS configuration from the content schemas (src/content/schema.ts):
// labels, hints, required flags, length limits, patterns and list bounds all come from the
// same Zod definitions the build validates against, so the admin cannot drift from the site.
import { cmsCollections, SITE_URL } from "../src/content/schema.ts";

export const CMS_REPO = "szilamer/mihalovits-web";
export const CMS_BRANCH = "main";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const RICHTEXT_BUTTONS = [
  "bold",
  "italic",
  "link",
  "heading-two",
  "heading-three",
  "bulleted-list",
  "numbered-list",
  "quote",
];

const typeOf = (schema) => schema._zod.def.type;
const checksOf = (schema) => (schema._zod.def.checks ?? []).map((check) => check._zod.def);

function unwrap(schema) {
  let inner = schema;
  let optional = false;
  while (["optional", "default"].includes(typeOf(inner))) {
    optional = true;
    inner = inner._zod.def.innerType;
  }
  return { inner, optional };
}

function stringField(base, inner, meta, optional) {
  const required = !optional && !inner.safeParse("").success;
  const regex = checksOf(inner).find((c) => c.check === "string_format" && c.format === "regex");

  switch (meta.widget) {
    case "image":
      return { ...base, widget: "image", required, accept: IMAGE_TYPES, choose_url: false };
    case "richtext":
      return {
        ...base,
        widget: "richtext",
        required,
        buttons: RICHTEXT_BUTTONS,
        editor_components: [],
        linked_images: false,
      };
    case "relation": {
      const { collection, file, valueField } = meta.relation;
      return {
        ...base,
        widget: "relation",
        required,
        collection,
        file,
        value_field: valueField,
        search_fields: [valueField],
        display_fields: [valueField],
      };
    }
    default: {
      const field = { ...base, widget: meta.widget === "text" ? "text" : "string", required };
      if (inner.maxLength != null) field.maxlength = inner.maxLength;
      // Sveltia patterns cannot carry regex flags; flagged patterns stay build-time only.
      if (regex && !regex.pattern.flags) field.pattern = [regex.pattern.source, regex.error()];
      return field;
    }
  }
}

function field(name, schema) {
  const { inner, optional } = unwrap(schema);
  const meta = schema.meta() ?? inner.meta();
  if (!meta?.label) throw new Error(`cms-config: field "${name}" has no label in the schema`);
  const base = { name, label: meta.label, ...(meta.hint && { hint: meta.hint }) };

  switch (typeOf(inner)) {
    case "string":
      return stringField(base, inner, meta, optional);
    case "number":
      return {
        ...base,
        widget: "number",
        required: !optional,
        value_type: inner.isInt ? "int" : "float",
        ...(inner.minValue != null && { min: inner.minValue }),
        ...(inner.maxValue != null && { max: inner.maxValue }),
      };
    case "boolean":
      return { ...base, widget: "boolean", required: false };
    case "enum":
      return {
        ...base,
        widget: "select",
        required: !optional,
        options: inner.options.map((value) => ({ label: meta.options?.[value] ?? value, value })),
      };
    case "object":
      return { ...base, widget: "object", required: !optional, fields: fieldsOf(inner) };
    case "array": {
      const checks = checksOf(inner);
      const min = checks.find((c) => c.check === "min_length")?.minimum ?? 0;
      const max = checks.find((c) => c.check === "max_length")?.maximum;
      const list = {
        ...base,
        widget: "list",
        required: min > 0,
        ...(min > 0 && { min }),
        ...(max != null && { max }),
        ...(meta.labelSingular && { label_singular: meta.labelSingular }),
        ...(meta.summary && { summary: meta.summary }),
      };
      const item = inner.element;
      if (typeOf(item) === "object") return { ...list, fields: fieldsOf(item) };
      return { ...list, field: field("item", item) };
    }
    default:
      throw new Error(`cms-config: field "${name}" has unsupported type ${typeOf(inner)}`);
  }
}

function fieldsOf(objectSchema) {
  return Object.entries(objectSchema.shape)
    .filter(([, schema]) => !(schema.meta() ?? unwrap(schema).inner.meta())?.managed)
    .map(([name, schema]) => field(name, schema));
}

function collection(def) {
  const common = { name: def.name, label: def.label, icon: def.icon, description: def.description };
  if ("files" in def) {
    return {
      ...common,
      files: def.files.map((f) => ({
        name: f.name,
        label: f.label,
        file: f.file,
        format: "json",
        ...(f.previewPath && { preview_path: f.previewPath }),
        fields: fieldsOf(f.schema),
      })),
    };
  }
  return {
    ...common,
    label_singular: def.labelSingular,
    folder: def.folder,
    format: "json",
    extension: "json",
    create: true,
    delete: true,
    duplicate: true,
    reorder: true,
    identifier_field: "title",
    slug: "{{title}}",
    summary: "{{title}}",
    preview_path: def.previewPath,
    fields: fieldsOf(def.schema),
  };
}

export function cmsConfig({ backend } = {}) {
  return {
    backend: backend ?? {
      name: "github",
      repo: CMS_REPO,
      branch: CMS_BRANCH,
      base_url: SITE_URL,
      auth_endpoint: "oauth/auth.php",
      auth_methods: ["oauth"],
      commit_messages: {
        create: "Új tartalom: {{collection}} – {{slug}}",
        update: "Tartalom frissítve: {{collection}} – {{slug}}",
        delete: "Tartalom törölve: {{collection}} – {{slug}}",
        uploadMedia: "Kép feltöltve: {{path}}",
        deleteMedia: "Kép törölve: {{path}}",
      },
    },
    app_title: "mihalovits.eu – tartalomkezelő",
    site_url: SITE_URL,
    display_url: SITE_URL,
    logo: { src: "/brand/icon-512.png" },
    show_preview_links: true,
    editor: { preview: false },
    media_folder: "public/uploads",
    public_folder: "/uploads",
    media_libraries: {
      default: {
        config: {
          max_file_size: 10 * 1024 * 1024,
          slugify_filename: true,
          filename_template: "{{filename}}-{{uuid_short}}",
          transformations: { raster_image: { format: "webp", quality: 85, width: 2400, height: 2400 } },
        },
      },
      // Stock photo services would need their own API keys and CSP origins.
      stock_assets: false,
    },
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-" },
    output: { json: { indent_style: "space", indent_size: 2 } },
    collections: cmsCollections.map(collection),
  };
}
