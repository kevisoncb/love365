"use client";

import React, { useEffect, useMemo, useState } from "react";

type Plan = "BASIC" | "PREMIUM";

// --- Helpers de Formatação e Lógica ---
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
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
  return { years, months, days };
}

// --- Componente de Mini Card para o Preview ---
function PreviewTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-white/20 p-2 text-center backdrop-blur-md shadow-sm">
      <div className="text-[8px] text-white/90 tracking-tighter uppercase font-medium">{label}</div>
      <div className="text-sm font-bold text-white tabular-nums">{value}</div>
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
  const [showPending, setShowPending] = useState(false);

  const limits = { maxPhotosBasic: 3, maxPhotosPremium: 5 };
  const maxPhotos = plan === "PREMIUM" ? limits.maxPhotosPremium : limits.maxPhotosBasic;

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const timeDisplay = useMemo(() => {
    const start = startDate ? new Date(startDate + "T00:00:00") : new Date();
    return diffParts(start, new Date());
  }, [startDate]);

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

      const response = await fetch("/api/create-page", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Erro ao criar");

      // Abre o link real gerado em nova aba
      window.open(result.publicUrl, '_blank');
      setShowPending(true); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Botão de Preview Rápido (Opcional para teste sem salvar)
  const openPreview = () => {
    const params = new URLSearchParams({ names, date: startDate, yt, plan, preview: "true" });
    window.open(`/p/preview?${params.toString()}`, '_blank');
  };

  const redInput = "w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-400 shadow-sm";
  const whiteCard = "rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm";

  return (
    <main className="min-h-screen bg-[#FDFCFB] text-gray-900 font-sans">
      {showPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl border border-gray-100">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl font-bold">✓</div>
            <h2 className="text-xl font-bold text-gray-900">Pedido em Análise</h2>
            <p className="mt-2 text-sm text-gray-600">Após a confirmação do Pix, seu link será enviado para {whatsapp || email}.</p>
            <button onClick={() => setShowPending(false)} className="mt-6 w-full rounded-2xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 transition-all">Entendi</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-8">
            <header>
              <h1 className="text-4xl font-black tracking-tight text-red-600">Love365</h1>
              <p className="mt-2 text-gray-500">Transforme sua história em um site eterno.</p>
            </header>

            <form onSubmit={onSubmit} className="space-y-6">
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

              <div className={whiteCard}>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80 block mb-4">2. Informações</label>
                <div className="space-y-4">
                  <input className={redInput} value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nomes (Ex: João e Maria)" maxLength={40} required />
                  <input type="date" className={redInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  <div className="relative">
                    <input 
                      className={`${redInput} ${plan === 'BASIC' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      value={yt} 
                      onChange={(e) => setYt(e.target.value)} 
                      placeholder="Link da Música (YouTube)"
                      disabled={plan === 'BASIC'}
                    />
                    {plan === 'BASIC' && (
                      <span className="absolute right-3 top-3 text-[9px] text-red-500 font-bold uppercase">Apenas Premium</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={whiteCard}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80">3. Galeria de Fotos</label>
                  <span className="text-[10px] text-gray-400 font-bold">{photos.length}/{maxPhotos}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl border border-gray-100 overflow-hidden group">
                      <img src={src} className="h-full w-full object-cover" alt="preview" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity text-white">✕</button>
                    </div>
                  ))}
                  {photos.length < maxPhotos && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-red-50 transition-colors">
                      <span className="text-2xl text-gray-300">+</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                    </label>
                  )}
                </div>
              </div>

              <div className={whiteCard}>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80 block mb-4">4. Destinatário</label>
                <div className="space-y-3">
                  <input className={redInput} value={whatsapp} onChange={(e) => setWhatsapp(onlyDigits(e.target.value))} placeholder="WhatsApp (Com DDD)" />
                  <input type="email" className={redInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail para backup" />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black text-sm tracking-widest text-white shadow-lg shadow-red-200 active:scale-[0.95] transition-all disabled:opacity-50">
                {submitting ? "PREPARANDO..." : "RECEBER MEU SITE AGORA"}
              </button>
            </form>
          </div>

          <div className="sticky top-10 flex flex-col items-center">
            <div className="relative group" onClick={openPreview} title="Clique para abrir preview em tela cheia">
              <div className="absolute -inset-1 bg-red-600 rounded-[3.5rem] blur opacity-10 group-hover:opacity-15 transition duration-1000"></div>
              <div className="relative w-[310px] h-[630px] border-[10px] border-gray-900 rounded-[3.2rem] bg-gray-50 shadow-2xl overflow-hidden cursor-pointer">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-50"></div>
                <div className="relative h-full w-full">
                  {photoPreviews[0] ? (
                    <img src={photoPreviews[0]} className="absolute inset-0 h-full w-full object-cover transition-all duration-700" alt="Preview" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-10">
                       <span className="text-3xl mb-4">❤️</span>
                       <p className="text-[9px] text-gray-400 uppercase tracking-widest text-center">Seu momento especial aparecerá aqui</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
                  <div className="absolute inset-0 flex flex-col items-center justify-between py-16 px-6 z-10 text-center">
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg italic">{names || "Nós Dois"}</h2>
                    <div className="w-full space-y-2">
                       <p className="text-[9px] text-white/80 font-bold uppercase tracking-[0.3em] mb-3">Contando cada segundo</p>
                       <div className="grid grid-cols-3 gap-2">
                          <PreviewTile label="Anos" value={timeDisplay.years} />
                          <PreviewTile label="Meses" value={timeDisplay.months} />
                          <PreviewTile label="Dias" value={timeDisplay.days} />
                          <PreviewTile label="Horas" value="12" />
                          <PreviewTile label="Min" value="30" />
                          <PreviewTile label="Seg" value="45" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              Visualização ao vivo
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}