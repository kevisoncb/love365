import { getSiteBaseUrl } from "@/lib/abacatepay";
import { resend } from "./resend";

function buildPremiumEmailHtml(input: {
  names: string;
  pageUrl: string;
  token: string;
}): string {
  const { names, pageUrl, token } = input;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seu presente Love365</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#14141f;border:1px solid rgba(255,47,146,0.25);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:36px 32px 24px;text-align:center;">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#ff2f92;">Love365</p>
              <h1 style="margin:0;font-size:28px;font-weight:500;font-style:italic;color:#ffffff;line-height:1.25;">
                ${names}, seu presente está pronto
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.78);font-family:system-ui,sans-serif;">
                O pagamento foi confirmado. Sua página exclusiva já está no ar — compartilhe o link e surpreenda quem você ama.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:24px auto;">
                <tr>
                  <td style="border-radius:999px;background:#ff2f92;">
                    <a href="${pageUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,sans-serif;">
                      Abrir minha página
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.45);font-family:system-ui,sans-serif;word-break:break-all;">
                Link direto:<br />
                <a href="${pageUrl}" style="color:#ff4da3;">${pageUrl}</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.35);font-family:system-ui,sans-serif;">
                Guarde este e-mail para recuperar seu link a qualquer momento.
                <br />Referência: ${token}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);font-family:system-ui,sans-serif;">
                Com carinho, equipe Love365
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendSuccessEmail(
  email: string,
  names: string,
  token: string
) {
  const baseUrl = getSiteBaseUrl();
  const pageUrl = baseUrl
    ? `${baseUrl}/p/${token}`
    : `/p/${token}`;

  if (!resend) {
    console.warn(
      "[EMAIL] RESEND_API_KEY ausente — e-mail não enviado.",
      { token }
    );
    return { success: false, error: "Chave não configurada" };
  }

  const html = buildPremiumEmailHtml({
    names,
    pageUrl,
    token,
  });

  try {
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Love365 <onboarding@resend.dev>",
      to: email,
      subject: `Seu presente para ${names} está pronto ♥`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar:", error);
    return { success: false, error };
  }
}
