import { postJson } from "./fetch-json";
import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

function parseError(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
  }
  return "Falha Z-API";
}

export function createZapiWhatsAppProvider(): WhatsAppProvider | null {
  const instanceId = process.env.ZAPI_INSTANCE_ID?.trim();
  const token = process.env.ZAPI_TOKEN?.trim();
  const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim();

  if (!instanceId || !token) {
    return null;
  }

  const base = `https://api.z-api.io/instances/${instanceId}/token/${token}`;
  const headers: Record<string, string> = {};
  if (clientToken) {
    headers["Client-Token"] = clientToken;
  }

  return {
    id: "zapi",
    async sendText({ toE164, text }) {
      const { ok, json } = await postJson(
        `${base}/send-text`,
        { phone: toE164, message: text },
        headers,
        "wa:zapi:text"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
    async sendImage({ toE164, imageBase64, caption }) {
      const { ok, json } = await postJson(
        `${base}/send-image`,
        {
          phone: toE164,
          image: `data:image/png;base64,${imageBase64}`,
          caption: caption || "",
        },
        headers,
        "wa:zapi:image"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
  };
}
