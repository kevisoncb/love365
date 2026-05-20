import { ImageResponse } from "next/og";

import { API_DYNAMIC, API_RUNTIME } from "@/lib/api-config";
import { connectToDatabase, Page } from "@/lib/db";
import type { PageDocument } from "@/types/page";

export const runtime = API_RUNTIME;
export const dynamic = API_DYNAMIC;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let names = "Nossa história";
  let subtitle = "Uma página especial no Love365";

  try {
    await connectToDatabase();
    const page = await Page.findOne({ token }).lean<PageDocument>();
    if (page?.names) {
      names = page.names.slice(0, 60);
      subtitle = "Reviva cada segundo juntos ♥";
    }
  } catch {
    /* fallback visual */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #0a0a0f 0%, #1a0a14 45%, #0a0a0f 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#ff2f92",
            marginBottom: 24,
          }}
        >
          Love365
        </div>
        <div
          style={{
            fontSize: 64,
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {names}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
