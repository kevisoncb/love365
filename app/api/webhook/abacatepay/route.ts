import { handleAbacatePayWebhook } from "@/lib/webhook-abacatepay";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { response } = await handleAbacatePayWebhook(req);
  return response;
}
