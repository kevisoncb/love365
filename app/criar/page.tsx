"use client";

import React, { useEffect, useMemo, useState } from "react";

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
    <div className="rounded-xl border border-white/20 bg-white/10 p-1.5 text-center backdrop-blur-md shadow-sm">
      <div className="text-[7px] text-white/70 tracking-tighter uppercase font-medium">{label}</div>
      <div className="text-xs font-bold text-white tabular-nums">{value}</div>
    </div>
  );
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

  // Atualiza o "agora" para o cronômetro do preview funcionar em tempo real
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const limits = { maxPhotosBasic: 3, maxPhotosPremium: 5 };
  const maxPhotos = plan === "PREMIUM" ? limits.maxPhotosPremium : limits.maxPhotosBasic;

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const timeDisplay = useMemo(() => {
    const start = startDate ? new Date(startDate + "T00:00:00") : new Date();
    return diffParts(start, now);
  }, [startDate, now]);

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos([...photos, ...picked].slice(0, maxPhotos));
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) return alert("Adicione ao menos uma foto!");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("plan", plan);
      formData.append("names", names);
      formData.append("startDate", startDate);
      formData.append("yt", yt);
      formData.append("whatsapp", whatsapp);
      formData.append("email", email);
      photos.forEach((file) => formData.append("photos", file));

      const resCreate = await fetch("/api/create-page", {
        method: "POST",
        body: formData,
      });
      const dataCreate = await resCreate.json();
      if (!resCreate.ok) throw new Error(dataCreate.error || "Erro ao criar página");

      const resPay = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: dataCreate.token,
          plan: plan,
          email: email,
        }),
      });
      const dataPay = await resPay.json();
      if (!resPay.ok) throw new Error(dataPay.error || "Erro no pagamento");

      if (dataPay.url) {
        window.location.href = dataPay.url;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const redInput = "w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-400 shadow-sm";
  const whiteCard = "rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm";

  return (
    <main className="min-h-screen bg-[#FDFCFB] text-gray-900 font-sans">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-8">
            <header>
              <h1 className="text-4xl font-black tracking-tight text-red-600">Love365</h1>
              <p className="mt-2 text-gray-500">Transforme sua história em um site eterno.</p>
            </header>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Plano */}
              <div className={whiteCard}>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80">1. Escolha o Plano</label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPlan("BASIC")} className={`relative flex flex-col p-4 rounded-2xl border transition-all ${plan === "BASIC" ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-gray-200 bg-white"}`}>
                    <span className={`font-bold ${plan === "BASIC" ? "text-red-700" : "text-gray-700"}`}>Anual</span>
                    <span className="text-xs text-red-500 font-bold">R$ 29,90</span>
                  </button>
                  <button type="button" onClick={() => setPlan("PREMIUM")} className={`relative flex flex-col p-4 rounded-2xl border transition-all ${plan === "PREMIUM" ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-gray-200 bg-white"}`}>
                    <span className={`font-bold ${plan === "PREMIUM" ? "text-red-700" : "text-gray-700"}`}>Vitalício</span>
                    <span className="text-xs text-red-500 font-bold">R$ 49,90</span>
                    <div className="absolute -top-2 -right-2 bg-red-600 text-[8px] text-white font-bold px-2 py-1 rounded-full uppercase shadow-sm">Melhor valor</div>
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className={whiteCard}>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80 block mb-4">2. Informações</label>
                <div className="space-y-4">
                  <input className={redInput} value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nomes (Ex: João e Maria)" maxLength={40} required />
                  <input type="date" className={redInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  <div className="relative">
                    <input className={`${redInput} ${plan === 'BASIC' ? 'opacity-50' : ''}`} value={yt} onChange={(e) => setYt(e.target.value)} placeholder="Link do YouTube" disabled={plan === 'BASIC'} />
                    {plan === 'BASIC' && <span className="absolute right-3 top-3 text-[9px] text-red-500 font-bold">APENAS PREMIUM</span>}
                  </div>
                </div>
              </div>

              {/* Fotos */}
              <div className={whiteCard}>
                <div className="flex justify-between mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80">3. Fotos</label>
                  <span className="text-[10px] text-gray-400 font-bold">{photos.length}/{maxPhotos}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={src} className="h-full w-full object-cover" alt="preview" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 text-white">✕</button>
                    </div>
                  ))}
                  {photos.length < maxPhotos && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-red-50">
                      <span className="text-2xl text-gray-300">+</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                    </label>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div className={whiteCard}>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80 block mb-4">4. Contato</label>
                <div className="space-y-3">
                  <input className={redInput} value={whatsapp} onChange={(e) => setWhatsapp(onlyDigits(e.target.value))} placeholder="WhatsApp com DDD" required />
                  <input type="email" className={redInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black text-white shadow-lg disabled:opacity-50 transition-all">
                {submitting ? "PROCESSANDO..." : "RECEBER MEU SITE AGORA"}
              </button>
            </form>
          </div>

          {/* PREVIEW DO CELULAR ATUALIZADO */}
          <div className="sticky top-10 flex flex-col items-center">
            <div className="relative w-[310px] h-[630px] border-[10px] border-gray-900 rounded-[3.2rem] bg-gray-50 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-50"></div>
              <div className="relative h-full w-full">
                {photoPreviews[0] ? (
                  <img src={photoPreviews[0]} className="absolute inset-0 h-full w-full object-cover" alt="Preview" />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-4">❤️</span>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Sua foto aparecerá aqui</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
                <div className="absolute inset-0 flex flex-col items-center justify-between py-16 px-6 z-10 text-center">
                  <h2 className="text-3xl font-bold text-white italic">{names || "Nós Dois"}</h2>
                  <div className="w-full">
                    {/* Grid de 6 colunas para o preview */}
                    <div className="grid grid-cols-3 gap-2">
                      <PreviewTile label="Anos" value={timeDisplay.years} />
                      <PreviewTile label="Meses" value={timeDisplay.months} />
                      <PreviewTile label="Dias" value={timeDisplay.days} />
                      <PreviewTile label="Horas" value={pad2(timeDisplay.hours)} />
                      <PreviewTile label="Min" value={pad2(timeDisplay.mins)} />
                      <PreviewTile label="Seg" value={pad2(timeDisplay.secs)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}