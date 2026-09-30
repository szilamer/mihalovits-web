import type { MetadataRoute } from "next";
import { getPracticeAreas, SITE_URL } from "@/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/szakteruletek`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...getPracticeAreas().map((p) => ({
      url: `${SITE_URL}/szakteruletek/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/rolam`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/kapcsolat`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
