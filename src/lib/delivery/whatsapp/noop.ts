import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

const skipped: WhatsAppSendResult = {
  success: false,
  skipped: true,
  error: "WhatsApp não configurado",
};

export function createNoopWhatsAppProvider(): WhatsAppProvider {
  return {
    id: "none",
    async sendText() {
      return skipped;
    },
    async sendImage() {
      return skipped;
    },
  };
}
