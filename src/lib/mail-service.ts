import { deliverPremiumTribute } from "@/lib/delivery/tribute-delivery";

/** @deprecated Preferir deliverPremiumTribute — mantido para compatibilidade */
export async function sendSuccessEmail(
  _email: string,
  _names: string,
  token: string
) {
  const result = await deliverPremiumTribute(token, {
    channels: ["email"],
    force: true,
  });

  if (result.email === "sent") {
    return { success: true as const };
  }

  return {
    success: false as const,
    error:
      result.deliveryError ||
      (result.email === "skipped"
        ? "E-mail não disponível"
        : "Falha ao enviar e-mail"),
  };
}

export { deliverPremiumTribute };
