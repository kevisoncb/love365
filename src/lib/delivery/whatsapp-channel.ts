import { getSiteBaseUrl } from "@/lib/abacatepay";
import {
  buildWhatsAppDeliveryText,
  buildWhatsAppQrCaption,
} from "@/lib/delivery/messages";
import type { TributeQrAssets } from "@/lib/delivery/qr-code";
import { getWhatsAppProvider } from "@/lib/delivery/whatsapp";

export async function sendPremiumDeliveryWhatsApp(input: {
  toE164: string;
  tributeNames: string;
  token: string;
  qr: TributeQrAssets;
}): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const provider = getWhatsAppProvider();
  const baseUrl = getSiteBaseUrl();
  const pageUrl = baseUrl
    ? `${baseUrl}/p/${input.token}`
    : `/p/${input.token}`;

  const text = buildWhatsAppDeliveryText({
    tributeNames: input.tributeNames,
    pageUrl,
  });

  const textResult = await provider.sendText({
    toE164: input.toE164,
    text,
  });

  if (textResult.skipped) {
    return {
      success: false,
      skipped: true,
      error: textResult.error,
    };
  }

  if (!textResult.success) {
    return { success: false, error: textResult.error };
  }

  const imageBase64 = input.qr.pngBuffer.toString("base64");
  const imageResult = await provider.sendImage({
    toE164: input.toE164,
    imageBase64,
    caption: buildWhatsAppQrCaption(),
  });

  if (!imageResult.success && !imageResult.skipped) {
    return {
      success: true,
      error: `Texto enviado; QR falhou: ${imageResult.error}`,
    };
  }

  return { success: true };
}
