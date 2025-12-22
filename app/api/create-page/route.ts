import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

type Plan = "BASIC" | "PREMIUM";

function generateToken(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function safePlan(v: string): Plan {
  return v === "BASIC" ? "BASIC" : "PREMIUM";
}

function extractYouTubeVideoId(url: string): string | null {
  const u = (url || "").trim();
  if (!u) return null;

  let m = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  return null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const planRaw = String(form.get("plan") ?? "");
    const namesRaw = String(form.get("names") ?? "");
    const startDateRaw = String(form.get("startDate") ?? "");
    const messageRaw = String(form.get("message") ?? "");

    const emailRaw = String(form.get("email") ?? "");
    const whatsRaw = String(form.get("whats") ?? "");

    const youtubeUrlRaw = String(form.get("youtubeUrl") ?? "");

    // validações obrigatórias
    if (!planRaw) return NextResponse.json({ error: "Plano é obrigatório." }, { status: 400 });

    const plan = safePlan(planRaw);
    const names = namesRaw.trim().slice(0, 60);
    const startDate = startDateRaw.trim();

    if (!names) return NextResponse.json({ error: "Nome do casal é obrigatório." }, { status: 400 });
    if (!startDate) return NextResponse.json({ error: "Data de início é obrigatória." }, { status: 400 });

    // data não pode ser futura
    const today = new Date();
    const inputDate = new Date(startDate + "T00:00:00");
    if (inputDate.getTime() > today.getTime()) {
      return NextResponse.json({ error: "A data de início não pode ser no futuro." }, { status: 400 });
    }

    // contato (pelo menos 1)
    const email = emailRaw.trim().slice(0, 120);
    const whatsDigits = onlyDigits(whatsRaw).slice(0, 11);
    const hasEmail = !!email;
    const hasWhats = whatsDigits.length >= 10;
    if (!hasEmail && !hasWhats) {
      return NextResponse.json({ error: "Informe e-mail ou WhatsApp para receber o link." }, { status: 400 });
    }

    // mensagem por plano
    const maxMessage = plan === "BASIC" ? 280 : 800;
    const message = messageRaw.trim().slice(0, maxMessage);

    // música: só premium e opcional
    let yt: string | null = null;
    if (plan === "PREMIUM") {
      yt = extractYouTubeVideoId(youtubeUrlRaw);
      if (youtubeUrlRaw.trim() && !yt) {
        return NextResponse.json({ error: "Link do YouTube inválido." }, { status: 400 });
      }
    }

    // fotos: obrigatórias e limitadas
    const photosLimit = plan === "BASIC" ? 3 : 5;
    const photos = form.getAll("photos").filter((p) => p instanceof File) as File[];

    if (photos.length === 0) return NextResponse.json({ error: "Envie pelo menos 1 foto." }, { status: 400 });
    if (photos.length > photosLimit) {
      return NextResponse.json({ error: `Máximo de ${photosLimit} fotos no plano selecionado.` }, { status: 400 });
    }

    // grava local (DEV): public/uploads/{token}/ e data/page-{token}.json
    const token = generateToken();
    const uploadsDir = path.join(process.cwd(), "public", "uploads", token);
    const dataDir = path.join(process.cwd(), "data");
    const jsonPath = path.join(dataDir, `page-${token}.json`);

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });

    const photoUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];

      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Apenas imagens são permitidas." }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Uma das fotos excede 5MB." }, { status: 400 });
      }

      const ext = file.type.includes("png") ? "png" : "jpg";
      const filename = `${i + 1}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filepath, buf);

      photoUrls.push(`/uploads/${token}/${filename}`);
    }

    const page = {
      token,
      plan,
      names,
      startDate,
      message,
      photos: photoUrls,
      yt: plan === "PREMIUM" ? yt : null,
      contact: {
        email: hasEmail ? email : null,
        whats: hasWhats ? whatsDigits : null,
      },
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(jsonPath, JSON.stringify(page, null, 2), "utf-8");

    return NextResponse.json({ token, url: `/p/${token}` }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao criar página." }, { status: 500 });
  }
}
