/** Mensagens seguras para o usuário — sem vazar stack/detalhes internos */

const GENERIC =
  "Algo deu errado. Tente novamente em instantes.";

const NETWORK =
  "Conexão instável. Verifique a internet e tente de novo.";

const PAYMENT =
  "Não foi possível iniciar o pagamento. Tente novamente.";

const NOT_FOUND = "Página não encontrada.";

const RATE_LIMIT =
  "Muitas tentativas. Aguarde um momento.";

export function toUserFacingMessage(
  err: unknown,
  fallback = GENERIC
): string {
  if (typeof err === "string" && err.trim()) {
    return sanitizeUserMessage(err) || fallback;
  }

  if (err instanceof Error) {
    const msg = err.message || fallback;

    if (
      err.name === "AbortError" ||
      msg.toLowerCase().includes("abort")
    ) {
      return NETWORK;
    }

    if (msg.includes("Muitas tentativas")) {
      return RATE_LIMIT;
    }

    if (
      msg.includes("pagamento") ||
      msg.includes("Abacate")
    ) {
      return PAYMENT;
    }

    if (msg.includes("não encontrad")) {
      return NOT_FOUND;
    }

    return sanitizeUserMessage(msg) || fallback;
  }

  return fallback;
}

/** Remove detalhes técnicos que não devem ir ao browser */
function sanitizeUserMessage(msg: string): string | null {
  const trimmed = msg.trim();
  if (!trimmed) return null;

  const blocked = [
    /mongodb/i,
    /mongoose/i,
    /MONGODB_URI/i,
    /R2_/i,
    /ABACATEPAY/i,
    /stack/i,
    /at\s+\//,
    /ECONNREFUSED/,
    /undefined/i,
  ];

  for (const pattern of blocked) {
    if (pattern.test(trimmed)) return null;
  }

  if (trimmed.length > 180) {
    return `${trimmed.slice(0, 177)}…`;
  }

  return trimmed;
}

/** Resposta JSON de API — nunca vazar detalhes internos */
export function toApiClientError(
  err: unknown,
  fallback = GENERIC
): string {
  return toUserFacingMessage(err, fallback);
}
