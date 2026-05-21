import { getSiteBaseUrl } from "@/lib/abacatepay";
import { resend } from "@/lib/resend";
import { buildPremiumEmailHtml } from "@/lib/delivery/messages";
import type { TributeQrAssets } from "@/lib/delivery/qr-code";

export async function sendPremiumDeliveryEmail(input: {
  to: string;
  tributeNames: string;
  token: string;
  qr: TributeQrAssets;
}): Promise<{ success: boolean; error?: string }> {
  const baseUrl = getSiteBaseUrl();
  const pageUrl = baseUrl
    ? `${baseUrl}/p/${input.token}`
    : `/p/${input.token}`;

  if (!resend) {
    return {
      success: false,
      error: "RESEND_API_KEY não configurada",
    };
  }

  const html = buildPremiumEmailHtml({
    tributeNames: input.tributeNames,
    pageUrl,
    token: input.token,
    qrDataUrl: input.qr.dataUrl,
  });

  try {
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Love365 <onboarding@resend.dev>",
      to: input.to,
      subject: `Seu presente para ${input.tributeNames} está pronto ♥`,
      html,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao enviar e-mail",
    };
  }
}
