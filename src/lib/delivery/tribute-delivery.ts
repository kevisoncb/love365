import { getSiteBaseUrl } from "@/lib/abacatepay";
import { connectToDatabase, Page } from "@/lib/db";
import { resolveBuyerContact } from "@/lib/delivery/buyer-contact";
import { sendPremiumDeliveryEmail } from "@/lib/delivery/email-channel";
import { generateTributeQr } from "@/lib/delivery/qr-code";
import { sendPremiumDeliveryWhatsApp } from "@/lib/delivery/whatsapp-channel";
import { createLogger } from "@/lib/logger";
import { captureServerErrorAsync } from "@/lib/error-tracking";
import type { DeliveryChannel, DeliveryStatus } from "@/types/delivery";
import type { PageDocument } from "@/types/page";

const log = createLogger("DELIVERY");

export type DeliverPremiumOptions = {
  /** Reenvio manual — ignora status sent */
  force?: boolean;
  channels?: DeliveryChannel[];
};

export type DeliverPremiumResult = {
  token: string;
  email: DeliveryStatus | "unchanged";
  whatsapp: DeliveryStatus | "unchanged";
  deliveredAt: string | null;
  deliveryError: string | null;
};

async function claimChannel(
  token: string,
  channel: DeliveryChannel,
  force: boolean
): Promise<boolean> {
  if (force) return true;

  const field =
    channel === "email"
      ? "emailDeliveryStatus"
      : "whatsappDeliveryStatus";

  const updated = await Page.findOneAndUpdate(
    {
      token,
      $or: [
        { [field]: { $exists: false } },
        { [field]: null },
        { [field]: "pending" },
        { [field]: "failed" },
      ],
    },
    { $set: { [field]: "pending" } },
    { new: true }
  ).lean();

  return !!updated;
}

async function setChannelStatus(
  token: string,
  channel: DeliveryChannel,
  status: DeliveryStatus
): Promise<void> {
  const statusField =
    channel === "email"
      ? "emailDeliveryStatus"
      : "whatsappDeliveryStatus";
  const atField =
    channel === "email" ? "emailDeliveredAt" : "whatsappDeliveredAt";

  const set: Record<string, unknown> = {
    [statusField]: status,
  };

  if (status === "sent") {
    set[atField] = new Date();
    if (channel === "email") {
      set.emailSentAt = new Date();
    }
  }

  await Page.updateOne({ token }, { $set: set });
  await finalizeDeliveryState(token);
}

async function finalizeDeliveryState(token: string): Promise<void> {
  const page = (await Page.findOne({ token }).lean()) as PageDocument | null;
  if (!page) return;

  const parts: string[] = [];
  if (page.emailDeliveryStatus === "failed") {
    parts.push("e-mail: falhou");
  }
  if (page.whatsappDeliveryStatus === "failed") {
    parts.push("WhatsApp: falhou");
  }

  const anySent =
    page.emailDeliveryStatus === "sent" ||
    page.whatsappDeliveryStatus === "sent";

  const patch: Record<string, unknown> = {};

  if (anySent && !page.deliveredAt) {
    patch.deliveredAt = new Date();
  }
  patch.deliveryError =
    parts.length > 0 ? parts.join(" · ").slice(0, 500) : null;

  await Page.updateOne({ token }, { $set: patch });
}

async function markSkipped(
  token: string,
  channel: DeliveryChannel,
  reason: string
): Promise<void> {
  await setChannelStatus(token, channel, "skipped");
  log.info(`${channel} skipped`, { token, meta: { reason } });
}

/**
 * Entrega premium pós-pagamento para o comprador (e-mail + WhatsApp dele).
 * Idempotente por canal — não reenvia se já estiver "sent", salvo force.
 */
export async function deliverPremiumTribute(
  token: string,
  options: DeliverPremiumOptions = {}
): Promise<DeliverPremiumResult> {
  const force = options.force === true;
  const channels = options.channels ?? ["email", "whatsapp"];

  await connectToDatabase();

  const page = (await Page.findOne({
    token: token.trim(),
  }).lean()) as PageDocument | null;

  if (!page) {
    throw new Error("Página não encontrada");
  }

  const buyer = resolveBuyerContact(page);
  const tributeNames = page.names || "sua homenagem";
  const baseUrl = getSiteBaseUrl();
  const pageUrl = baseUrl
    ? `${baseUrl}/p/${page.token}`
    : `/p/${page.token}`;

  let emailResult: DeliveryStatus | "unchanged" = "unchanged";
  let whatsappResult: DeliveryStatus | "unchanged" = "unchanged";
  const errors: string[] = [];

  let qr: Awaited<ReturnType<typeof generateTributeQr>> | null =
    null;

  const ensureQr = async () => {
    if (!qr) {
      qr = await generateTributeQr(pageUrl);
    }
    return qr;
  };

  if (channels.includes("email")) {
    if (!buyer.email) {
      if (!page.emailDeliveryStatus) {
        await markSkipped(token, "email", "sem e-mail do comprador");
      }
      emailResult = "skipped";
    } else if (
      !force &&
      page.emailDeliveryStatus === "sent"
    ) {
      emailResult = "unchanged";
    } else if (await claimChannel(token, "email", force)) {
      const qrAssets = await ensureQr();
      const sent = await sendPremiumDeliveryEmail({
        to: buyer.email,
        tributeNames,
        token: page.token,
        qr: qrAssets,
      });

      if (sent.success) {
        await setChannelStatus(token, "email", "sent");
        emailResult = "sent";
        log.info("email delivered", { token });
      } else {
        const err = sent.error || "falha e-mail";
        errors.push(err);
        await setChannelStatus(token, "email", "failed");
        emailResult = "failed";
        captureServerErrorAsync(new Error(err), {
          scope: "DELIVERY",
          route: "deliver/email",
          token,
        });
      }
    }
  }

  if (channels.includes("whatsapp")) {
    if (!buyer.whatsapp) {
      if (!page.whatsappDeliveryStatus) {
        await markSkipped(
          token,
          "whatsapp",
          "sem WhatsApp do comprador"
        );
      }
      whatsappResult = "skipped";
    } else if (
      !force &&
      page.whatsappDeliveryStatus === "sent"
    ) {
      whatsappResult = "unchanged";
    } else if (await claimChannel(token, "whatsapp", force)) {
      const qrAssets = await ensureQr();
      const sent = await sendPremiumDeliveryWhatsApp({
        toE164: buyer.whatsapp,
        tributeNames,
        token: page.token,
        qr: qrAssets,
      });

      if (sent.skipped) {
        await setChannelStatus(token, "whatsapp", "skipped");
        whatsappResult = "skipped";
      } else if (sent.success) {
        await setChannelStatus(token, "whatsapp", "sent");
        whatsappResult = "sent";
        log.info("whatsapp delivered", {
          token,
          meta: { partial: !!sent.error },
        });
        if (sent.error) {
          errors.push(sent.error);
        }
      } else {
        const err = sent.error || "falha WhatsApp";
        errors.push(err);
        await setChannelStatus(token, "whatsapp", "failed");
        whatsappResult = "failed";
        captureServerErrorAsync(new Error(err), {
          scope: "DELIVERY",
          route: "deliver/whatsapp",
          token,
        });
      }
    }
  }

  if (errors.length > 0) {
    await Page.updateOne(
      { token },
      {
        $set: {
          deliveryError: errors.join(" · ").slice(0, 500),
        },
      }
    );
  }

  const fresh = (await Page.findOne({ token }).lean()) as PageDocument | null;

  return {
    token,
    email: emailResult,
    whatsapp: whatsappResult,
    deliveredAt: fresh?.deliveredAt
      ? new Date(fresh.deliveredAt).toISOString()
      : null,
    deliveryError: fresh?.deliveryError ?? null,
  };
}

/** Chamado após pagamento confirmado (webhook / sync / admin) */
export async function deliverPremiumTributeAfterPayment(
  page: PageDocument,
  newlyPaid: boolean
): Promise<void> {
  if (!newlyPaid) {
    return;
  }

  try {
    await deliverPremiumTribute(page.token);
  } catch (e) {
    log.error("delivery failed", {
      token: page.token,
      error: e,
    });
    captureServerErrorAsync(e, {
      scope: "DELIVERY",
      route: "deliver/after-payment",
      token: page.token,
    });
  }
}
