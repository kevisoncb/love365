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
    <div className="rounded-xl bg-white p-2 text-center shadow-md border border-pink-100/50">
      <div className="text-[8px] text-pink-500 tracking-tighter uppercase font-black">{label}</div>
      <div className="text-sm font-black text-pink-600 tabular-nums leading-none mt-0.5">{value}</div>
    </div>
  );
}

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="#db2777"
      />
    </svg>
    <span className="text-2xl font-bold text-pink-600 tracking-tighter italic">Love365</span>
  </div>
);

/**
 * ✅ MUDANÇA NECESSÁRIA (iPhone 413):
 * Redimensiona e comprime a imagem antes de enviar pro backend.
 * - Converte para JPEG (remove EXIF e reduz peso)
 * - Limita largura (1080px) mantendo proporção
 * - Qualidade 0.8
 */
async function compressImageToJpeg(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<File> {
  const maxWidth = opts?.maxWidth ?? 1080;
  const quality = opts?.quality ?? 0.8;

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

    const targetW = Math.min(maxWidth, w);
    const targetH = Math.round((h * targetW) / w);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality);
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

  // Estado para os corações da animação (Evita Erro de Hidratação)
  const [hearts, setHearts] = useState<{ left: string; delay: string }[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    // Gerar corações apenas no cliente
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

  // ✅ ALTERADO (mínimo): agora comprime antes de salvar no state
  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;

    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));

    // Respeita limite do plano
    const remaining = Math.max(0, maxPhotos - photos.length);
    const toProcess = picked.slice(0, remaining);

    const processed: File[] = [];
    for (const f of toProcess) {
      const compressed = await compressImageToJpeg(f, { maxWidth: 1080, quality: 0.8 });
      processed.push(compressed);
    }

    setPhotos([...photos, ...processed].slice(0, maxPhotos));
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

      // NOVO: Se houver URL de pagamento (AbacatePay), redireciona para lá
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Fallback caso não tenha pagamento
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
    <main className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans pt-24 pb-10">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-pink-600 transition-colors">
            Voltar
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col">
            <header className="mb-10 text-center md:text-left">
              <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-2 italic">
                Configure sua página ✨
              </h1>
              <p className="text-zinc-500 font-medium">Preencha os dados e veja a mágica acontecer ao lado.</p>
            </header>

            <form onSubmit={onSubmit}>
              <div className={cardStyle}>
                <label className="text-[11px] font-black uppercase tracking-widest text-pink-600 block mb-6 italic">
                  1. Escolha o Plano
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlan("BASIC")}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      plan === "BASIC" ? "border-pink-500 bg-pink-50/30 shadow-sm" : "border-zinc-100 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-[10px] opacity-60 mb-1">ESSENCIAL</span>
                    <span className="text-xl font-black text-pink-600 uppercase">R$ 29,90</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan("PREMIUM")}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      plan === "PREMIUM" ? "border-pink-500 bg-pink-50/30 shadow-sm" : "border-zinc-100 bg-white"
                    }`}
                  >
                    <span className="block font-bold text-[10px] opacity-60 mb-1 uppercase">Vitalício</span>
                    <span className="text-xl font-black text-pink-600 uppercase">R$ 49,90</span>
                    <div className="absolute -top-3 -right-2 bg-pink-600 text-[8px] text-white font-black px-2 py-1 rounded-full uppercase shadow-md">
                      Melhor
                    </div>
                  </button>
                </div>
              </div>

              <div className={cardStyle}>
                <label className="text-[11px] font-black uppercase tracking-widest text-pink-600 block mb-6 italic">
                  2. Informações Principais
                </label>
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
                    type="date"
                    className={inputStyle}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                  <input
                    className={`${inputStyle} ${plan === "BASIC" ? "opacity-50 bg-zinc-100" : ""}`}
                    value={yt}
                    onChange={(e) => setYt(e.target.value)}
                    placeholder="Link do vídeo no YouTube"
                    disabled={plan === "BASIC"}
                  />
                </div>
              </div>

              <div className={cardStyle}>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-[11px] font-black uppercase tracking-widest text-pink-600 italic">
                    3. Fotos do Casal
                  </label>
                  <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                    {photos.length}/{maxPhotos} FOTOS
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-zinc-100">
                      <img src={src} className="h-full w-full object-cover" alt="preview" />
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
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-pink-50 transition-all">
                      <span className="text-2xl text-zinc-300">+</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickPhotos(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className={cardStyle}>
                <label className="text-[11px] font-black uppercase tracking-widest text-pink-600 block mb-6 italic">
                  4. Dados de Entrega
                </label>
                <div className="space-y-3">
                  <input
                    className={inputStyle}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(onlyDigits(e.target.value))}
                    placeholder="WhatsApp com DDD"
                    required
                  />
                  <input
                    type="email"
                    className={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu melhor e-mail"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 py-6 rounded-[2rem] font-black text-white shadow-xl shadow-pink-100 transition-all uppercase tracking-widest text-sm active:scale-95"
              >
                {submitting ? "Processando..." : "Criar Meu Site Eterno ❤️"}
              </button>
            </form>
          </div>

          <div className="sticky top-28 flex flex-col items-center">
            <div className="relative w-[285px] h-[580px] border-[4px] border-zinc-900 rounded-[2.8rem] bg-zinc-950 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 rounded-b-2xl z-50"></div>

              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                {hearts.map((heart, i) => (
                  <div
                    key={i}
                    className="absolute text-pink-500/40 animate-fall text-lg"
                    style={{ left: heart.left, animationDelay: heart.delay }}
                  >
                    ❤️
                  </div>
                ))}
              </div>

              <div className="relative h-full w-full bg-black flex flex-col">
                {photoPreviews[0] ? (
                  <img
                    src={photoPreviews[0]}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    alt="Preview"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                    <span className="text-3xl opacity-20">📸</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-black mt-2">Foto Principal</p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                <div className="relative z-10 flex flex-col items-center pt-14 px-6 text-center">
                  <h2 className="text-[28px] font-[900] text-white italic tracking-tighter leading-8 uppercase break-words w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                    {names || "NOMES AQUI"}
                  </h2>
                </div>

                <div className="relative z-10 mt-auto pb-12 px-5 w-full">
                  <div className="grid grid-cols-3 gap-2">
                    <PreviewTile label="Anos" value={timeDisplay.years} />
                    <PreviewTile label="Meses" value={timeDisplay.months} />
                    <PreviewTile label="Dias" value={timeDisplay.days} />
                    <PreviewTile label="Hrs" value={pad2(timeDisplay.hours)} />
                    <PreviewTile label="Min" value={pad2(timeDisplay.mins)} />
                    <PreviewTile label="Seg" value={pad2(timeDisplay.secs)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm border border-zinc-100">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse"></span>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Transmissão em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(600px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall 6s linear infinite;
          top: -50px;
        }
      `}</style>

      <footer className="bg-white border-t border-zinc-100 py-16 px-6 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <Logo />
          <div className="text-center text-zinc-400 font-bold">
            <p className="text-[11px] tracking-widest uppercase">
              Copyright © 2025 Love365.com.br - Todos os direitos reservados
            </p>
            <p className="text-[10px] mt-2 font-medium">Feito com carinho para o seu amor ❤️</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
