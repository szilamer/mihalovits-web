import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/oauth/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
