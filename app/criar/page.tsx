"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Plan = "BASIC" | "PREMIUM";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function diffParts(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  const secs = Math.floor((diffMs / 1000) % 60);

  return { years, months, days, hours, mins, secs };
}

function PreviewTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white/70 border border-zinc-200 px-4 py-3 text-center">
      <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{value}</div>
    </div>
  );
}

const Logo = () => <div className="font-semibold tracking-tight text-zinc-900">Love365</div>;

/**
 * Redimensiona + comprime uma imagem (File) usando Canvas.
 * - Converte para JPEG
 * - Limita a largura (default 1080px) mantendo proporção
 * - Qualidade default 0.8
 *
 * Isso reduz drasticamente payload (corrige 413 no iPhone).
 */
async function compressImageToJpeg(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<File> {
  const maxWidth = opts?.maxWidth ?? 1080;
  const quality = opts?.quality ?? 0.8;

  // Se não for imagem, devolve como veio
  if (!file.type.startsWith("image/")) return file;

  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    // Se já é pequena, ainda assim converte para jpeg para remover EXIF e padronizar
    const targetW = Math.min(maxWidth, w);
    const targetH = Math.round((h * targetW) / w);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || file),
        "image/jpeg",
        quality
      );
    });

    const safeName = file.name.replace(/\.[^/.]+$/, "");
    return new File([outBlob], `${safeName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export default function CreatePage() {
  const [plan, setPlan] = useState<Plan>("BASIC");
  const [names, setNames] = useState("");
  const [startDate, setStartDate] = useState("");
  const [yt, setYt] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  // Corações (cliente only)
  const [hearts, setHearts] = useState<{ left: string; delay: string }[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const generatedHearts = [...Array(8)].map(() => ({
      left: `${Math.random() * 90}%`,
      delay: `${Math.random() * 5}s`,
    }));
    setHearts(generatedHearts);
    return () => clearInterval(t);
  }, []);

  const maxPhotos = plan === "PREMIUM" ? 5 : 3;

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const timeDisplay = useMemo(() => {
    const start = startDate ? new Date(startDate + "T00:00:00") : new Date();
    return diffParts(start, now);
  }, [startDate, now]);

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;

    // Filtra apenas imagens
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));

    // Limite de quantidade
    const remaining = Math.max(0, maxPhotos - photos.length);
    const toProcess = picked.slice(0, remaining);

    // Comprime / redimensiona (principal para iPhone)
    const processed: File[] = [];
    for (const f of toProcess) {
      // Stories: 1080px é um padrão ótimo (reduz payload e mantém qualidade)
      const compressed = await compressImageToJpeg(f, { maxWidth: 1080, quality: 0.8 });
      processed.push(compressed);
    }

    setPhotos((prev) => [...prev, ...processed].slice(0, maxPhotos));
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("plan", plan);
      formData.append("names", names);
      formData.append("startDate", startDate);
      formData.append("yt", yt);
      formData.append("whatsapp", whatsapp);
      formData.append("email", email);

      photos.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch("/api/create-page", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar página");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        window.location.href = data.publicUrl;
      }
    } catch (err: any) {
      alert("Ops! " + err.message);
      console.error("Erro no envio:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle =
    "bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-zinc-100 mb-6";
  const inputStyle =
    "w-full rounded-2xl bg-zinc-50 border border-zinc-200 px-5 py-4 text-sm text-zinc-800 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-zinc-400";

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            Voltar
          </Link>
          <Logo />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* FORM */}
          <form onSubmit={onSubmit}>
            <div className={cardStyle}>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Configure sua página ✨
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Preencha os dados e veja a prévia ao lado.
              </p>
            </div>

            <div className={cardStyle}>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">1. Escolha o Plano</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlan("BASIC")}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    plan === "BASIC"
                      ? "border-pink-500 bg-pink-50/30 shadow-sm"
                      : "border-zinc-100 bg-white"
                  }`}
                >
                  <div className="text-xs tracking-[0.25em] uppercase text-zinc-500">Essencial</div>
                  <div className="mt-2 text-2xl font-semibold text-zinc-900">R$ 29,90</div>
                  <div className="mt-2 text-sm text-zinc-600">Até 3 fotos, sem música.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan("PREMIUM")}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    plan === "PREMIUM"
                      ? "border-pink-500 bg-pink-50/30 shadow-sm"
                      : "border-zinc-100 bg-white"
                  }`}
                >
                  <div className="absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full bg-pink-500 text-white">
                    Melhor
                  </div>
                  <div className="text-xs tracking-[0.25em] uppercase text-zinc-500">Vitalício</div>
                  <div className="mt-2 text-2xl font-semibold text-zinc-900">R$ 49,90</div>
                  <div className="mt-2 text-sm text-zinc-600">Até 5 fotos + música do YouTube.</div>
                </button>
              </div>
            </div>

            <div className={cardStyle}>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">2. Informações Principais</h2>

              <div className="space-y-4">
                <input
                  className={inputStyle}
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  placeholder="Nomes (Ex: Ana e Leo)"
                  maxLength={40}
                  required
                />

                <input
                  className={inputStyle}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />

                <input
                  className={inputStyle}
                  value={yt}
                  onChange={(e) => setYt(e.target.value)}
                  placeholder="Link do vídeo no YouTube (Premium)"
                  disabled={plan === "BASIC"}
                />
              </div>
            </div>

            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">3. Fotos do Casal</h2>
                <div className="text-xs text-zinc-600">
                  {photos.length}/{maxPhotos} fotos
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {photoPreviews.map((src, i) => (
                  <div key={src} className="relative group rounded-2xl overflow-hidden border border-zinc-200">
                    <img src={src} className="h-28 w-full object-cover" alt={`Foto ${i + 1}`} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 text-zinc-800 font-bold transition-all flex items-center justify-center backdrop-blur-[1px]"
                    >
                      Remover
                    </button>
                  </div>
                ))}

                {photos.length < maxPhotos && (
                  <label className="h-28 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-sm text-zinc-500 cursor-pointer hover:border-pink-400 hover:text-pink-600 transition-all">
                    +
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickPhotos(e.target.files)}
                    />
                  </label>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Dica: as fotos serão automaticamente ajustadas para qualidade ideal (stories) para funcionar em iPhone.
              </p>
            </div>

            <div className={cardStyle}>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">4. Dados de Entrega</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className={inputStyle}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(onlyDigits(e.target.value))}
                  placeholder="WhatsApp com DDD"
                  required
                />
                <input
                  className={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-2xl bg-pink-600 text-white py-4 font-semibold hover:bg-pink-700 disabled:opacity-60 transition-all"
              >
                {submitting ? "Processando..." : "Criar Meu Site Eterno ❤️"}
              </button>
            </div>
          </form>

          {/* PREVIEW */}
          <div className="sticky top-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.12)]">
              <div className="relative aspect-[9/16] bg-zinc-100">
                {photoPreviews[0] ? (
                  <img
                    src={photoPreviews[0]}
                    alt="Prévia"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                    Foto Principal
                  </div>
                )}

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/70" />

                {/* hearts */}
                <div className="absolute inset-0 pointer-events-none">
                  {hearts.map((heart, i) => (
                    <span
                      key={i}
                      className="absolute animate-[fall_6s_linear_infinite] text-pink-400"
                      style={{ left: heart.left, animationDelay: heart.delay, top: "-10%" }}
                    >
                      ❤️
                    </span>
                  ))}
                </div>

                {/* name */}
                <div className="absolute top-10 inset-x-0 text-center px-4">
                  <h2 className="text-3xl font-semibold text-white drop-shadow">
                    {names || "NOMES AQUI"}
                  </h2>
                  <div className="mt-2 text-xs text-white/70">Transmissão em tempo real</div>
                </div>

                {/* timer */}
                <div className="absolute bottom-6 inset-x-0 px-4">
                  <div className="grid grid-cols-3 gap-2">
                    <PreviewTile label="ANOS" value={timeDisplay.years} />
                    <PreviewTile label="MESES" value={timeDisplay.months} />
                    <PreviewTile label="DIAS" value={timeDisplay.days} />
                    <PreviewTile label="HORAS" value={pad2(timeDisplay.hours)} />
                    <PreviewTile label="MIN" value={pad2(timeDisplay.mins)} />
                    <PreviewTile label="SEG" value={pad2(timeDisplay.secs)} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 text-xs text-zinc-500">
                Copyright © 2025 Love365.com.br - Todos os direitos reservados
                <div className="mt-1">Feito com carinho para o seu amor ❤️</div>
              </div>
            </div>

            <style jsx global>{`
              @keyframes fall {
                0% {
                  transform: translateY(-10vh);
                  opacity: 0;
                }
                12% {
                  opacity: 1;
                }
                100% {
                  transform: translateY(110vh);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </main>
  );
}
