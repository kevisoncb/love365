import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs"; // precisa para usar fs

type Plan = "BASIC" | "PREMIUM";

function generateToken(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function safePlan(v: string): Plan {
  return v === "BASIC" ? "BASIC" : "PREMIUM";
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
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

    // Obrigatórios
    const planRaw = String(form.get("plan") ?? "");
    const namesRaw = String(form.get("names") ?? "");
    const startDateRaw = String(form.get("startDate") ?? "");

    // Opcionais
    const messageRaw = String(form.get("message") ?? "");
    const emailRaw = String(form.get("email") ?? "");
    const whatsRaw = String(form.get("whats") ?? "");
    const youtubeUrlRaw = String(form.get("youtubeUrl") ?? ""); // só premium (valida abaixo)

    if (!planRaw) return NextResponse.json({ error: "Plano é obrigatório." }, { status: 400 });

    const plan = safePlan(planRaw);

    const names = namesRaw.trim().slice(0, 60);
    const startDate = startDateRaw.trim(); // YYYY-MM-DD
    const messageMax = plan === "BASIC" ? 280 : 800;
    const message = messageRaw.trim().slice(0, messageMax);

    if (!names) return NextResponse.json({ error: "Nome do casal é obrigatório." }, { status: 400 });
    if (!startDate) return NextResponse.json({ error: "Data de início é obrigatória." }, { status: 400 });

    // contato: pelo menos 1
    const email = emailRaw.trim().slice(0, 120);
    const whatsDigits = onlyDigits(whatsRaw).slice(0, 11);
    const hasEmail = !!email;
    const hasWhats = whatsDigits.length >= 10;
    if (!hasEmail && !hasWhats) {
      return NextResponse.json({ error: "Informe e-mail ou WhatsApp para receber o link." }, { status: 400 });
    }

    // música: só Premium e opcional
    let yt: string | null = null;
    if (plan === "PREMIUM") {
      yt = extractYouTubeVideoId(youtubeUrlRaw);
      if (youtubeUrlRaw.trim() && !yt) {
        return NextResponse.json({ error: "Link do YouTube inválido." }, { status: 400 });
      }
    }

    // Fotos: obrigatórias (1+)
    const photosLimit = plan === "BASIC" ? 3 : 5;
    const photoFiles: File[] = [];

    // recebe campos: photos (multiple)
    const photos = form.getAll("photos");
    for (const p of photos) {
      if (p instanceof File && p.size > 0) photoFiles.push(p);
    }

    if (photoFiles.length === 0) {
      return NextResponse.json({ error: "Envie pelo menos 1 foto." }, { status: 400 });
    }
    if (photoFiles.length > photosLimit) {
      return NextResponse.json({ error: `Máximo de ${photosLimit} fotos para o plano selecionado.` }, { status: 400 });
    }

    // Token e destinos
    const token = generateToken();
    const uploadsDir = path.join(process.cwd(), "public", "uploads", token);
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });

    // Salvar fotos localmente e montar URLs públicas
    const photoUrls: string[] = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];

      // Segurança básica
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

      // URL que o Next vai servir via /public
      photoUrls.push(`/uploads/${token}/${filename}`);
    }

    // Salvar metadados localmente em JSON (teste)
    // Em produção, isso vai para banco (Prisma) + URLs do R2
    const page = {
      token,
      plan,
      names,
      startDate,
      message,
      photos: photoUrls,
      yt, // null no BASIC
      contact: {
        email: hasEmail ? email : null,
        whats: hasWhats ? whatsDigits : null,
      },
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(path.join(dataDir, `page-${token}.json`), JSON.stringify(page, null, 2), "utf-8");

    /**
     * CLOUDFARE R2 (produção) — ponto de troca
     * Aqui você substituiria o trecho de "fs.writeFile" por upload para R2:
     * - usar AWS SDK v3 S3Client com endpoint do R2
     * - key: `${token}/${filename}`
     * - salvar URLs do R2 (ou de um domínio/CDN) em `photoUrls`
     *
     * Assim o resto do sistema fica igual.
     */

    return NextResponse.json({ token, url: `/p/${token}` }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao criar página." }, { status: 500 });
  }
}
