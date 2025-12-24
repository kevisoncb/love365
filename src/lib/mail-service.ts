import { resend } from './resend';

export async function sendSuccessEmail(email: string, names: string, token: string) {
  const pageUrl = `${process.env.NEXT_PUBLIC_URL}/p/${token}`;

  // PROTEÇÃO: Se a chave não estiver configurada, apenas loga o aviso e não quebra o site
  if (!resend) {
    console.warn('⚠️ E-mail não enviado: RESEND_API_KEY não configurada nas variáveis de ambiente.');
    return { success: false, error: 'Chave não configurada' };
  }

  try {
    await resend.emails.send({
      from: 'Love365 <onboarding@resend.dev>',
      to: email,
      subject: `Seu presente para ${names} está pronto! ❤️`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e11d48;">Seu presente chegou!</h1>
          <p>Olá, o pagamento da sua página <strong>${names}</strong> foi confirmado com sucesso.</p>
          <p>Você pode acessar, salvar e compartilhar o seu link através do botão abaixo:</p>
          <a href="${pageUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">Acessar Minha Página</a>
          <p>Link direto: <br /> <a href="${pageUrl}">${pageUrl}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Equipe Love365</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, error };
  }
}