// 3. Gerar link no AbacatePay
const price = plan === "PREMIUM" ? 4990 : 2990;
const apiKey = process.env.ABACATEPAY_KEY || process.env.ABACATEPAY_API_KEY;

if (!apiKey) {
  throw new Error("Chave da API do AbacatePay não configurada no servidor.");
}

// =========================
// CRIAR CUSTOMER
// =========================

const customerResponse = await fetch(
  "https://api.abacatepay.com/v1/customer/create",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: names || "Cliente Love365",
      email: email || `${token}@love365.com`,
      taxId: "00000000000",
    }),
  }
);

const customerData = await customerResponse.json();

if (!customerResponse.ok) {
  console.error("❌ ERRO CUSTOMER:", customerData);

  throw new Error(
    customerData?.error ||
    "Erro ao criar customer no AbacatePay"
  );
}

const customerId =
  customerData?.data?.id ||
  customerData?.id;

if (!customerId) {
  console.error("❌ CUSTOMER INVALIDO:", customerData);

  throw new Error("Customer not found");
}

// =========================
// CRIAR COBRANÇA
// =========================

const abacateResponse = await fetch(
  "https://api.abacatepay.com/v1/billing/create",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      frequency: "ONE_TIME",
      methods: ["PIX"],

      customerId,

      products: [
        {
          externalId: token,
          name: `Página Love365 - ${plan}`,
          quantity: 1,
          price: price,
        },
      ],

      returnUrl: `${process.env.NEXT_PUBLIC_URL}/p/${token}`,

      completionUrl: `${process.env.NEXT_PUBLIC_URL}/p/${token}`,
    }),
  }
);

const abacateData = await abacateResponse.json();

// SEGURANÇA: Verifica se a API do AbacatePay realmente retornou a URL
if (!abacateResponse.ok || !abacateData?.data?.url) {
  console.error("❌ ERRO ABACATEPAY:", abacateData);

  throw new Error(
    abacateData?.error ||
    "Falha ao gerar link de pagamento no AbacatePay"
  );
}