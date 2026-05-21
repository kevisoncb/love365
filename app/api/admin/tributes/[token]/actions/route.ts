import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { requireAdmin } from "@/lib/admin-guard";
import { serializeTributeRow } from "@/lib/admin-serializers";
import {
  deliverPremiumTribute,
  deliverPremiumTributeAfterPayment,
} from "@/lib/delivery/tribute-delivery";
import { getSiteBaseUrl } from "@/lib/abacatepay";
import { connectToDatabase, Page } from "@/lib/db";
import { syncPagePaymentStatus } from "@/lib/payment-sync";
import { markPageAsPaid } from "@/lib/webhook-abacatepay";
import { createLogger } from "@/lib/logger";
import type { PageDocument } from "@/types/page";
import type { DeliveryChannel } from "@/types/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

type RouteCtx = { params: Promise<{ token: string }> };

type ActionBody = {
  action?:
    | "mark_paid"
    | "sync_payment"
    | "reprocess_webhook"
    | "resend_link"
    | "resend_delivery"
    | "resend_email"
    | "resend_whatsapp";
};

export async function POST(req: Request, ctx: RouteCtx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { token: rawToken } = await ctx.params;
    const token = rawToken.trim();
    const body = (await req.json()) as ActionBody;
    const action = body.action;

    if (!action) {
      return NextResponse.json(
        { error: "Ação inválida" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await connectToDatabase();

    const page = (await Page.findOne({ token }).lean()) as PageDocument | null;
    if (!page) {
      return NextResponse.json(
        { error: "Não encontrada" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    let message = "ok";

    switch (action) {
      case "mark_paid": {
        const { newlyPaid, page: paidPage } = await markPageAsPaid(
          token,
          page.abacateBillingId
        );
        message = newlyPaid
          ? "Marcada como paga"
          : "Já estava paga";
        if (newlyPaid && paidPage) {
          await deliverPremiumTributeAfterPayment(paidPage, true);
          message += " · entrega premium disparada";
        }
        break;
      }
      case "sync_payment":
      case "reprocess_webhook": {
        const sync = await syncPagePaymentStatus(token);
        message = sync.updated
          ? "Pagamento sincronizado e aprovado"
          : `Sync: status ${sync.status}`;
        break;
      }
      case "resend_link":
      case "resend_delivery": {
        const result = await deliverPremiumTribute(token, {
          force: true,
        });
        message = `Entrega: e-mail ${result.email}, WhatsApp ${result.whatsapp}`;
        if (result.deliveryError) {
          message += ` · ${result.deliveryError}`;
        }
        break;
      }
      case "resend_email": {
        const result = await deliverPremiumTribute(token, {
          force: true,
          channels: ["email"] as DeliveryChannel[],
        });
        message = `E-mail: ${result.email}`;
        break;
      }
      case "resend_whatsapp": {
        const result = await deliverPremiumTribute(token, {
          force: true,
          channels: ["whatsapp"] as DeliveryChannel[],
        });
        message = `WhatsApp: ${result.whatsapp}`;
        break;
      }
      default:
        return NextResponse.json(
          { error: "Ação desconhecida" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
    }

    const updated = (await Page.findOne({ token }).lean()) as PageDocument | null;
    const siteBase = getSiteBaseUrl();

    log.info("tribute action", { token, meta: { action, message } });

    return NextResponse.json(
      {
        ok: true,
        message,
        tribute: updated
          ? serializeTributeRow(updated, siteBase)
          : null,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    log.error("tribute action failed", { error: err });
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro na ação",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
