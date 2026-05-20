import { handleAbacatePayWebhook } from "@/lib/webhook-abacatepay";
import { API_DYNAMIC, API_RUNTIME } from "@/lib/api-config";

export const runtime = API_RUNTIME;
export const dynamic = API_DYNAMIC;

/** Alias legado — mesma lógica de /api/webhook/abacatepay */
export async function POST(req: Request) {
  const { response } = await handleAbacatePayWebhook(req);
  return response;
}
