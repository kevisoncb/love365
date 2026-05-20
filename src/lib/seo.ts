import type { Metadata } from "next";

import { getSiteBaseUrl } from "@/lib/abacatepay";

export function getCanonicalSiteUrl(): string {
  return getSiteBaseUrl() || "https://love365.app";
}

function getMetadataBase(): URL {
  try {
    return new URL(getCanonicalSiteUrl());
  } catch {
    return new URL("https://love365.app");
  }
}

export const defaultSiteMetadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Love365 | Eternize seu amor com uma página única",
    template: "%s | Love365",
  },
  description:
    "Crie uma página cinematográfica para o casal: fotos, contador em tempo real e música. Presente digital pronto em minutos — pagamento PIX seguro.",
  keywords: [
    "presente casal",
    "página do casal",
    "contador de relacionamento",
    "presente digital",
    "Love365",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Love365",
    title: "Love365 | Eternize seu amor",
    description:
      "Surpreenda com uma página eterna: fotos, tempo juntos e música da história de vocês.",
    images: [
      {
        url: "/api/og/love365",
        width: 1200,
        height: 630,
        alt: "Love365 — presente digital para casais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Love365 | Eternize seu amor",
    description:
      "Página exclusiva para casais com fotos, contador e música.",
    images: ["/api/og/love365"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function buildTributeMetadata(input: {
  token: string;
  names: string;
  plan?: string;
  photoUrl?: string | null;
}): Metadata {
  const base = getCanonicalSiteUrl();
  const title = `${input.names} — nossa história`;
  const description = `Uma página especial criada no Love365 para ${input.names}. Reviva cada segundo juntos.`;
  const ogImage =
    input.photoUrl && input.photoUrl.startsWith("http")
      ? input.photoUrl
      : `${base}/api/og/${input.token}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/p/${input.token}`,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: `${base}/p/${input.token}`,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Página do casal ${input.names}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
