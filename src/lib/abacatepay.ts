const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY!;

const headers = {
  Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
  "Content-Type": "application/json",
};

export async function createPixPayment(data: {
  amount: number;
  description: string;
  customer: {
    name: string;
    cellphone: string;
    email: string;
  };
}) {
  const response = await fetch(
    "https://api.abacatepay.com/v1/pixQrCode/create",
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error(result);
    throw new Error(result.message || "Erro ao criar pagamento");
  }

  return result;
}