export function buildWhatsAppDeliveryText(input: {
  tributeNames: string;
  pageUrl: string;
}): string {
  const { tributeNames, pageUrl } = input;

  return [
    "✨ *Seu presente Love365 está pronto*",
    "",
    `A homenagem *${tributeNames}* já está no ar — um presente especial para você entregar com o coração.`,
    "",
    `🔗 *Abrir agora:*`,
    pageUrl,
    "",
    "📲 *Mostre o QR Code* que enviamos em seguida — é só apontar a câmera.",
    "",
    "_Mostre para quem você ama ♥_",
    "",
    "Love365 — feito com carinho para você entregar.",
  ].join("\n");
}

export function buildWhatsAppQrCaption(): string {
  return "Mostre para quem você ama ♥ — escaneie para abrir a homenagem";
}

export function buildPremiumEmailHtml(input: {
  tributeNames: string;
  pageUrl: string;
  token: string;
  qrDataUrl: string;
}): string {
  const { tributeNames, pageUrl, token, qrDataUrl } = input;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seu presente Love365</title>
</head>
<body style="margin:0;padding:0;background:#18181b;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%);padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#27272a;border:1px solid rgba(255,47,146,0.22);border-radius:24px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.35);">
          <tr>
            <td style="padding:40px 36px 20px;text-align:center;">
              <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#ff2f92;font-family:system-ui,sans-serif;">Love365</p>
              <h1 style="margin:0;font-size:30px;font-weight:500;font-style:italic;color:#fafafa;line-height:1.3;">
                Seu presente está pronto
              </h1>
              <p style="margin:14px 0 0;font-size:15px;color:rgba(250,250,250,0.72);font-family:system-ui,sans-serif;">
                A homenagem <em>${tributeNames}</em> já está no ar.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 28px;text-align:center;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(250,250,250,0.78);font-family:system-ui,sans-serif;">
                Você criou algo único. Agora é só abrir, emocionar e entregar esse momento para quem você ama — no seu tempo, do seu jeito.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(135deg,#ff2f92,#e91e8c);">
                    <a href="${pageUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,sans-serif;">
                      Abrir homenagem ♥
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(250,250,250,0.45);font-family:system-ui,sans-serif;">
                Ou escaneie o QR Code
              </p>
              <img src="${qrDataUrl}" alt="QR Code da homenagem" width="200" height="200" style="display:block;margin:0 auto;border-radius:16px;border:8px solid #fafafa;background:#fafafa;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.55;color:rgba(250,250,250,0.5);font-family:system-ui,sans-serif;text-align:center;word-break:break-all;">
                <a href="${pageUrl}" style="color:#ff6eb4;text-decoration:none;">${pageUrl}</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:rgba(250,250,250,0.35);font-family:system-ui,sans-serif;text-align:center;">
                Guarde este e-mail — seu presente digital está seguro aqui.<br />Ref. ${token}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(250,250,250,0.45);font-family:system-ui,sans-serif;">
                Com carinho · equipe Love365
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
