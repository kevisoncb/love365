import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, plan, email } = await req.json();
    const apiKey = process.env.ABACATEPAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    // 1. Criar ou verificar o cliente (Customer)
    // O AbacatePay exige que o customer exista para vincular à cobrança
    const customerRes = await fetch("https://api.abacatepay.com/v1/customer/create", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: email,
        taxId: "00000000000", // CPF genérico se não coletar, ou remova se a API permitir
        name: email.split('@')[0], // Nome provisório baseado no e-mail
      }),
    });

    const customerData = await customerRes.json();
    
    // Se o cliente já existir, a API pode retornar erro de "já cadastrado", 
    // mas precisamos do ID dele. Se for um novo, pegamos o ID gerado.
    const customerId = customerData.data?.id || customerData.id;

    // 2. Criar a cobrança (Billing)
    const amountInReais = plan === "PREMIUM" ? 49.90 : 29.90;
    const priceInCents = Math.round(amountInReais * 100);

    const billingBody = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: token,
          name: plan === "PREMIUM" ? "Love365 - Vitalício" : "Love365 - Anual",
          quantity: 1,
          price: priceInCents,
        },
      ],
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${token}`,
      completionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${token}`,
      customerId: customerId, // Agora passamos o ID retornado/criado
    };

    const billingRes = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers,
      body: JSON.stringify(billingBody),
    });

    const billingData = await billingRes.json();

    if (!billingRes.ok) {
      console.error("Erro na cobrança:", billingData);
      return NextResponse.json({ error: billingData.error || "Erro ao gerar PIX" }, { status: 400 });
    }

    return NextResponse.json({ url: billingData.data?.url || billingData.url });

  } catch (error) {
    console.error("Erro crítico:", error);
    return NextResponse.json({ error: "Falha interna" }, { status: 500 });
  }
}