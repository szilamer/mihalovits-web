/**
 * Build-time access to the editable content in `content/` (server components only: reads the
 * file system). Every file is validated against src/content/schema.ts, so a malformed edit fails
 * the build instead of shipping a broken page.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import MarkdownIt from "markdown-it";
import { cache } from "react";
import { z } from "zod";
import {
  contentFiles,
  practiceAreaFolder,
  practiceAreaSchema,
  SITE_URL,
  SLUG_PATTERN,
  type PracticeAreaContent,
} from "./schema";

export { SITE_URL };
export type { IconName } from "./schema";

const root = process.cwd();

function readContent<T extends z.ZodType>(rel: string, schema: T): z.output<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path.join(root, rel), "utf8"));
  } catch (err) {
    throw new Error(`Content file ${rel} could not be read: ${(err as Error).message}`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid content in ${rel}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export type SiteImage = { src: string; width: number; height: number };

const siteImages = new Map<string, SiteImage>();

/**
 * Resolves an image path from the content. The URL carries a content hash because nginx caches
 * static files for a year, so a replaced upload must get a new URL.
 */
function siteImage(src: string): SiteImage {
  let image = siteImages.get(src);
  if (!image) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(path.join(root, "public", src));
    } catch {
      throw new Error(`Image ${src} is referenced in the content but missing from public/.`);
    }
    const { width, height } = imageSize(bytes);
    image = {
      src: `${src}?v=${createHash("sha256").update(bytes).digest("hex").slice(0, 10)}`,
      width,
      height,
    };
    siteImages.set(src, image);
  }
  return image;
}

export const getFirm = cache(() => {
  const firm = readContent(contentFiles.firm.file, contentFiles.firm.schema);
  return {
    ...firm,
    phoneHref: `tel:${firm.phone.replace(/[^\d+]/g, "")}`,
    images: {
      portrait: siteImage(firm.images.portrait),
      office: siteImage(firm.images.office),
      share: siteImage(firm.images.share),
    },
  };
});

export type Firm = ReturnType<typeof getFirm>;

export const getHome = cache(() => readContent(contentFiles.home.file, contentFiles.home.schema));
export const getAbout = cache(() => readContent(contentFiles.about.file, contentFiles.about.schema));
export const getPracticeAreasPage = cache(() =>
  readContent(contentFiles.practiceAreas.file, contentFiles.practiceAreas.schema),
);
export const getContactPage = cache(() =>
  readContent(contentFiles.contact.file, contentFiles.contact.schema),
);
export const getPrivacyPage = cache(() =>
  readContent(contentFiles.privacy.file, contentFiles.privacy.schema),
);
export const getImprintPage = cache(() =>
  readContent(contentFiles.imprint.file, contentFiles.imprint.schema),
);

export type PracticeArea = PracticeAreaContent & { slug: string };

export const getPracticeAreas = cache((): PracticeArea[] => {
  const files = readdirSync(path.join(root, practiceAreaFolder)).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error(`${practiceAreaFolder}/ contains no practice areas.`);
  return files
    .map((file) => {
      const slug = file.slice(0, -".json".length);
      if (!SLUG_PATTERN.test(slug)) {
        throw new Error(`${practiceAreaFolder}/${file}: file names must be lowercase ASCII words joined by hyphens.`);
      }
      return { slug, ...readContent(`${practiceAreaFolder}/${file}`, practiceAreaSchema) };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "hu"));
});

export function getPracticeArea(slug: string): PracticeArea | undefined {
  return getPracticeAreas().find((p) => p.slug === slug);
}

// Raw HTML and images stay disabled: editors format with Markdown only, which keeps the pages
// within the Content-Security-Policy and free of injected markup.
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false }).disable("image");

markdown.core.ruler.push("demote_h1", (state) => {
  for (const token of state.tokens) {
    if ((token.type === "heading_open" || token.type === "heading_close") && token.tag === "h1") {
      token.tag = "h2";
    }
  }
});

markdown.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const href = String(tokens[idx].attrGet("href") ?? "");
  if (/^https?:\/\//i.test(href) && !href.startsWith(SITE_URL)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noreferrer");
  }
  return self.renderToken(tokens, idx, options);
};

export function renderMarkdown(source: string): string {
  return markdown.render(source);
}
