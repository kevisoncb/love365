import { postJson } from "./fetch-json";
import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

function parseError(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
  }
  return "Falha CodeChat";
}

/** CodeChat — API compatível com padrão instance + bearer */
export function createCodechatWhatsAppProvider(): WhatsAppProvider | null {
  const baseUrl = process.env.CODECHAT_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.CODECHAT_API_KEY?.trim();
  const instance = process.env.CODECHAT_INSTANCE?.trim();

  if (!baseUrl || !apiKey || !instance) {
    return null;
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    id: "codechat",
    async sendText({ toE164, text }) {
      const { ok, json } = await postJson(
        `${baseUrl}/message/sendText/${instance}`,
        { number: toE164, text },
        headers,
        "wa:codechat:text"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
    async sendImage({ toE164, imageBase64, caption }) {
      const { ok, json } = await postJson(
        `${baseUrl}/message/sendMedia/${instance}`,
        {
          number: toE164,
          mediatype: "image",
          media: imageBase64,
          caption: caption || "",
        },
        headers,
        "wa:codechat:image"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
  };
}
