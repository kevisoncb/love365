import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickFirstString(...values: any[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function upper(s: string | null) {
  return (s || "").trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Alguns provedores mandam JSON, outros mandam string JSON
    const rawText = await req.text();
    let body: any;
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    // Logs úteis no Vercel
    console.log("[ABACATEPAY WEBHOOK] RAW:", rawText?.slice(0, 2000));

    const data = body?.data ?? body;

    // STATUS: tente vários lugares comuns
    const statusRaw = pickFirstString(
      data?.status,
      data?.billing?.status,
      data?.charge?.status,
      data?.payment?.status,
      body?.status
    );
    const status = upper(statusRaw);

    // TOKEN (externalId): tente vários lugares comuns
    const token = pickFirstString(
      data?.externalId,
      data?.billing?.externalId,
      data?.charge?.externalId,
      data?.payment?.externalId,
      data?.products?.[0]?.externalId,
      data?.billing?.products?.[0]?.externalId,
      data?.charge?.products?.[0]?.externalId,
      data?.metadata?.externalId,
      body?.externalId,
      body?.metadata?.externalId
    );

    console.log("[ABACATEPAY WEBHOOK] token:", token, "statusRaw:", statusRaw, "status:", status);

    if (!token) {
      console.warn("[ABACATEPAY WEBHOOK] Token não encontrado no payload.");
      return NextResponse.json({ received: true, warning: "token_missing" }, { status: 200 });
    }

    // Quais status significam “pago”?
    const isApproved =
      status === "PAID" ||
      status === "CONFIRMED" ||
      status === "APPROVED" ||
      status === "SUCCEEDED" ||
      status === "SUCCESS";

    if (!isApproved) {
      // Mantém como pendente, mas loga
      console.log("[ABACATEPAY WEBHOOK] Status ainda não aprovado:", status);
      return NextResponse.json({ received: true, status }, { status: 200 });
    }

    const result = await Page.findOneAndUpdate(
      { token },
      { $set: { status: "APPROVED" } },
      { new: true }
    );

    if (!result) {
      console.warn("[ABACATEPAY WEBHOOK] Não achei Page no Mongo para token:", token);
      return NextResponse.json({ received: true, warning: "page_not_found", token }, { status: 200 });
    }

    console.log("[ABACATEPAY WEBHOOK] Page atualizada para APPROVED:", token);

    // Envio de e-mail (se for e-mail)
    const contact = (result as any)?.contact;
    if (typeof contact === "string" && contact.includes("@")) {
      try {
        await sendSuccessEmail(contact, (result as any)?.names || "Love365", token);
        console.log("[ABACATEPAY WEBHOOK] Email enviado:", contact);
      } catch (e) {
        console.error("[ABACATEPAY WEBHOOK] Falha ao enviar email:", e);
      }
    }

    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  } catch (error) {
    console.error("[ABACATEPAY WEBHOOK] Erro crítico:", error);
    // Retorna 200 para não ficar retentando infinito
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}
