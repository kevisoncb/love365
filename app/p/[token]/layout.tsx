import type { Metadata } from "next";

import { connectToDatabase, Page } from "@/lib/db";
import { buildTributeMetadata } from "@/lib/seo";
import type { PageDocument } from "@/types/page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  if (!token || token.startsWith("preview")) {
    return {
      title: "Prévia | Love365",
      robots: { index: false, follow: false },
    };
  }

  try {
    await connectToDatabase();
    const page = (await Page.findOne({ token }).lean()) as PageDocument | null;

    if (!page) {
      return {
        title: "Página não encontrada",
        robots: { index: false, follow: false },
      };
    }

    const photoUrl =
      page.photoUrls?.[0] &&
      String(page.photoUrls[0]).startsWith("http")
        ? String(page.photoUrls[0])
        : null;

    return buildTributeMetadata({
      token,
      names: page.names || "Casal",
      plan: page.plan,
      photoUrl,
    });
  } catch {
    return buildTributeMetadata({
      token,
      names: "Nossa história",
    });
  }
}

export default function TributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
