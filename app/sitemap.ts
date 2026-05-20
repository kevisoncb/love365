import type { MetadataRoute } from "next";

import { connectToDatabase, Page } from "@/lib/db";
import { getCanonicalSiteUrl } from "@/lib/seo";
import { isPaidPageStatus } from "@/lib/page-status";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getCanonicalSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    await connectToDatabase();
    const pages = await Page.find({
      status: { $in: ["PAID", "APPROVED"] },
    })
      .select("token status paidAt createdAt")
      .limit(500)
      .lean();

    const tributeRoutes = pages
      .filter((p) =>
        isPaidPageStatus(p.status as string)
      )
      .map((p) => ({
        url: `${base}/p/${p.token}`,
        lastModified:
          p.paidAt ||
          p.createdAt ||
          now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [...staticRoutes, ...tributeRoutes];
  } catch {
    return staticRoutes;
  }
}
