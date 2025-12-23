import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

type Plan = "BASIC" | "PREMIUM";

function isPlan(v: any): v is Plan {
  return v === "BASIC" || v === "PREMIUM";
}

function safeToken(len = 10) {
  // token curto e bom para URL
  return crypto.randomBytes(16).toString("base64url").slice(0, len);
}

function isValidYouTubeUrl(urlStr: string) {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return true;
      if (/^\/shorts\/[a-zA-Z0-9_-]{11}/.test(url.pathname)) return true;
      if (/^\/embed\/[a-zA-Z0-9_-]{11}/.test(url.pathname)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const plan = String(form.get("plan") || "").toUpperCase();
    const names = String(form.get("names") || "").trim();
    const startDate = String(form.get("startDate") || "").trim();
    const message = String(form.get("message") || "").trim();

    const whatsapp = String(form.get("whatsapp") || "").trim();
    const email = String(form.get("email") || "").trim();

    let yt = String(form.get("yt") || "").trim();

    if (!isPlan(plan)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }
    if (names.length < 3 || names.length > 40) {
      return NextResponse.json({ error: "Nome do casal inválido." }, { status: 400 });
    }
    if (!startDate) {
      return NextResponse.json({ error: "Data de início é obrigatória." }, { status: 400 });
    }
    if (message.length > 600) {
      return NextResponse.json({ error: "Texto muito longo." }, { status: 400 });
    }

    if (!whatsapp && !email) {
      return NextResponse.json({ error: "Informe WhatsApp ou e-mail." }, { status: 400 });
    }

    // Premium-only: yt opcional
    if (plan === "BASIC") yt = "";
    if (plan === "PREMIUM" && yt) {
      if (yt.length > 220) {
        return NextResponse.json({ error: "Link do YouTube muito longo." }, { status: 400 });
      }
      if (!isValidYouTubeUrl(yt)) {
        return NextResponse.json({ error: "Link do YouTube inválido." }, { status: 400 });
      }
    }

    const maxPhotos = plan === "PREMIUM" ? 5 : 3;

    const files = form.getAll("photos") as File[];
    const photos = files.filter((f) => f && typeof f === "object" && "arrayBuffer" in f);

    if (photos.length === 0) {
      return NextResponse.json({ error: "Envie pelo menos 1 foto." }, { status: 400 });
    }
    if (photos.length > maxPhotos) {
      return NextResponse.json(
        { error: `Máximo de ${maxPhotos} fotos para esse plano.` },
        { status: 400 }
      );
    }

    const token = safeToken(10);

    // uploads local (para testes)
    const uploadsDir = path.join(process.cwd(), "public", "uploads", token);
    await ensureDir(uploadsDir);

    const photoUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const buf = Buffer.from(await file.arrayBuffer());

      // salva como png/jpg mantendo extensão se vier; fallback png
      const originalName = String((file as any).name || "");
      const ext = (originalName.split(".").pop() || "").toLowerCase();
      const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";

      const filename = `${i + 1}.${safeExt}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buf);
      photoUrls.push(`/uploads/${token}/${filename}`);
    }

    // data local (para testes)
    const dataDir = path.join(process.cwd(), "data");
    await ensureDir(dataDir);

    const payload = {
      token,
      plan,
      names,
      startDate,
      message: message || "",
      photos: photoUrls,
      yt: plan === "PREMIUM" && yt ? yt : null,
      createdAt: new Date().toISOString(),
      delivery: {
        whatsapp: whatsapp || null,
        email: email || null,
      },
    };

    const outPath = path.join(dataDir, `page-${token}.json`);
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");

    const publicUrl = `/p/${token}`;

    return NextResponse.json({ token, publicUrl }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro interno ao criar página.", debug: String(err?.message || err) },
      { status: 500 }
    );
  }
}
