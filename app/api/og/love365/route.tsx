import { ImageResponse } from "next/og";

import { API_RUNTIME } from "@/lib/api-config";

export const runtime = API_RUNTIME;

export async function GET() {
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
            "linear-gradient(160deg, #0a0a0f 0%, #1a0a14 50%, #0a0a0f 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 32,
            letterSpacing: 8,
            color: "#ff2f92",
            marginBottom: 20,
          }}
        >
          LOVE365
        </div>
        <div
          style={{
            fontSize: 56,
            fontStyle: "italic",
            textAlign: "center",
            padding: "0 48px",
          }}
        >
          Eternize seu amor com uma página única
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
