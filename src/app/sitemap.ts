import type { MetadataRoute } from "next";
import { firm, practiceAreas } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = firm.url;
  return [
    { url: base, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/szakteruletek`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...practiceAreas.map((p) => ({
      url: `${base}/szakteruletek/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/rolam`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/kapcsolat`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
