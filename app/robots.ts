import type { MetadataRoute } from "next";

import { getCanonicalSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getCanonicalSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/criar"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
