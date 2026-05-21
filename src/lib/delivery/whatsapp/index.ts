import { createCodechatWhatsAppProvider } from "./codechat";
import { createEvolutionWhatsAppProvider } from "./evolution";
import { createNoopWhatsAppProvider } from "./noop";
import { createZapiWhatsAppProvider } from "./zapi";
import type { WhatsAppProvider } from "./types";

let cached: WhatsAppProvider | null | undefined;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (cached !== undefined) {
    return cached ?? createNoopWhatsAppProvider();
  }

  const preferred = (
    process.env.WHATSAPP_PROVIDER || "evolution"
  )
    .trim()
    .toLowerCase();

  const factories: Record<string, () => WhatsAppProvider | null> = {
    evolution: createEvolutionWhatsAppProvider,
    zapi: createZapiWhatsAppProvider,
    codechat: createCodechatWhatsAppProvider,
    none: () => null,
  };

  const order =
    preferred === "auto"
      ? ["evolution", "zapi", "codechat"]
      : [
          preferred,
          "evolution",
          "zapi",
          "codechat",
        ].filter((v, i, a) => a.indexOf(v) === i);

  for (const key of order) {
    const factory = factories[key];
    if (!factory) continue;
    const provider = factory();
    if (provider) {
      cached = provider;
      return provider;
    }
  }

  cached = null;
  return createNoopWhatsAppProvider();
}

export function resetWhatsAppProviderCache(): void {
  cached = undefined;
}

export type { WhatsAppProvider, WhatsAppSendResult } from "./types";
