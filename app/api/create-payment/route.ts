import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const token = String(formData.get("token") || "");
    const plan = String(formData.get("plan") || "");
    const email = String(formData.get("email") || "");

    const apiKey = process.env.ABACATEPAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API Key não configurada",
        },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // =========================
    // CRIAR CUSTOMER
    // =========================

    const customerRes = await fetch(
      "https://api.abacatepay.com/v1/customer/create",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          name: email.split("@")[0],
          taxId: "00000000000",
        }),
      }
    );

    const customerData = await customerRes.json();

    console.log("CUSTOMER RESPONSE:", customerData);

    if (!customerRes.ok) {
      return NextResponse.json(
        {
          error:
            customerData.error ||
            customerData.message ||
            "Erro ao criar cliente",
        },
        { status: 400 }
      );
    }

    const customerId =
      customerData.data?.id ||
      customerData.id;

    if (!customerId) {
      return NextResponse.json(
        {
          error: "Customer not found",
          customerData,
        },
        { status: 400 }
      );
    }

    // =========================
    // CRIAR COBRANÇA
    // =========================

    const amountInReais =
      plan === "PREMIUM"
        ? 49.9
        : 29.9;

    const priceInCents = Math.round(
      amountInReais * 100
    );

    const billingBody = {
      frequency: "ONE_TIME",

      methods: ["PIX"],

      products: [
        {
          externalId:
            token || crypto.randomUUID(),

          name:
            plan === "PREMIUM"
              ? "Love365 - Vitalício"
              : "Love365 - Anual",

          quantity: 1,

          price: priceInCents,
        },
      ],

      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/`,

      completionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/`,

      customerId,
    };

    const billingRes = await fetch(
      "https://api.abacatepay.com/v1/billing/create",
      {
        method: "POST",
        headers,
        body: JSON.stringify(billingBody),
      }
    );

    const billingData = await billingRes.json();

    console.log("BILLING RESPONSE:", billingData);

    if (!billingRes.ok) {
      return NextResponse.json(
        {
          error:
            billingData.error ||
            billingData.message ||
            "Erro ao gerar PIX",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url:
        billingData.data?.url ||
        billingData.url,
    });

  } catch (error) {
    console.error("ERRO CRÍTICO:", error);

    return NextResponse.json(
      {
        error: "Falha interna",
      },
      { status: 500 }
    );
  }
}