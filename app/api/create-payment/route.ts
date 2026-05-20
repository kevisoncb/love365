import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  abacateApiRequest,
  buildCustomerPayload,
  extractAbacateErrorMessage,
  extractBillingUrl,
  extractCustomerId,
  getSiteBaseUrl,
} from "@/lib/abacatepay";
import { NO_STORE_HEADERS } from "@/lib/api-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const token = String(formData.get("token") || "");
    const plan = String(formData.get("plan") || "BASIC");
    const email = String(formData.get("email") || "");

    const siteBase = getSiteBaseUrl();

    const customerBody = buildCustomerPayload({
      name: email.split("@")[0] || "Cliente",
      email: email || `${token || "tmp"}@love365.com`,
      seed: token || email,
    });

    const customerParsed = await abacateApiRequest(
      "/customer/create",
      {
        method: "POST",
        body: JSON.stringify(customerBody),
      },
      "[CREATE-PAYMENT][CUSTOMER]"
    );

    if (!customerParsed.ok) {
      return NextResponse.json(
        {
          error: extractAbacateErrorMessage(
            customerParsed.body
          ),
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const customerId = extractCustomerId(
      customerParsed.body
    );

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const priceInCents =
      plan === "PREMIUM" ? 4990 : 2990;

    const billingBody = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: token || randomUUID(),
          name:
            plan === "PREMIUM"
              ? "Love365 - Premium"
              : "Love365 - Essencial",
          quantity: 1,
          price: priceInCents,
        },
      ],
      returnUrl: siteBase ? `${siteBase}/` : "/",
      completionUrl: siteBase ? `${siteBase}/` : "/",
      customerId,
    };

    const billingParsed = await abacateApiRequest(
      "/billing/create",
      {
        method: "POST",
        body: JSON.stringify(billingBody),
      },
      "[CREATE-PAYMENT][BILLING]"
    );

    if (!billingParsed.ok) {
      return NextResponse.json(
        {
          error: extractAbacateErrorMessage(
            billingParsed.body
          ),
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const url = extractBillingUrl(billingParsed.body);

    return NextResponse.json(
      { url },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[CREATE-PAYMENT] Erro:", error);
    return NextResponse.json(
      { error: "Falha interna" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
