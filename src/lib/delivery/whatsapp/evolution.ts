import { postJson } from "./fetch-json";
import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

function parseError(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
  }
  return "Falha Evolution API";
}

export function createEvolutionWhatsAppProvider(): WhatsAppProvider | null {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();
  const instance = process.env.EVOLUTION_INSTANCE?.trim();

  if (!baseUrl || !apiKey || !instance) {
    return null;
  }

  const headers = { apikey: apiKey };

  return {
    id: "evolution",
    async sendText({ toE164, text }) {
      const url = `${baseUrl}/message/sendText/${instance}`;
      const { ok, json } = await postJson(
        url,
        { number: toE164, text },
        headers,
        "wa:evolution:text"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
    async sendImage({ toE164, imageBase64, caption }) {
      const url = `${baseUrl}/message/sendMedia/${instance}`;
      const { ok, json } = await postJson(
        url,
        {
          number: toE164,
          mediatype: "image",
          media: imageBase64,
          caption: caption || "",
        },
        headers,
        "wa:evolution:image"
      );
      if (!ok) {
        return { success: false, error: parseError(json) };
      }
      return { success: true };
    },
  };
}
