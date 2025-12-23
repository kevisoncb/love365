"use client";

import React, { useEffect, useMemo, useState } from "react";

type Plan = "BASIC" | "PREMIUM";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
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

      const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts?.[1]) return true;

      const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed?.[1]) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export default function CreatePage() {
  const limits = useMemo(
    () => ({
      namesMax: 40,
      messageMax: 600,
      ytMax: 220,
      emailMax: 120,
      whatsappMaxDigits: 13,
      maxPhotosBasic: 3,
      maxPhotosPremium: 5,
    }),
    []
  );

  const [plan, setPlan] = useState<Plan>("BASIC");
  const [names, setNames] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");

  const [yt, setYt] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // modal "pagamento em análise"
  const [showPending, setShowPending] = useState(false);

  const maxPhotos = plan === "PREMIUM" ? limits.maxPhotosPremium : limits.maxPhotosBasic;

  useEffect(() => {
    // revoke old
    photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  function onPickPhotos(files: FileList | null) {
    if (!files) return;

    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const merged = [...photos, ...picked].slice(0, maxPhotos);
    setPhotos(merged);
  }

  function removePhoto(idx: number) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  function validate(): string | null {
    const n = names.trim();
    if (n.length < 3) return "Informe o nome do casal (mínimo 3 caracteres).";
    if (n.length > limits.namesMax) return `Nome do casal: máximo ${limits.namesMax} caracteres.`;

    if (!startDate) return "Selecione a data de início.";

    if (message.length > limits.messageMax) return `Texto: máximo ${limits.messageMax} caracteres.`;

    if (photos.length === 0) return "Envie pelo menos 1 foto.";
    if (photos.length > maxPhotos) return `Você pode enviar no máximo ${maxPhotos} fotos nesse plano.`;

    const wpp = onlyDigits(whatsapp);
    const em = email.trim();
    if (!wpp && !em) return "Informe WhatsApp ou e-mail para receber o link.";
    if (wpp && (wpp.length < 10 || wpp.length > limits.whatsappMaxDigits))
      return "WhatsApp inválido. Use DDD e número (somente números).";
    if (em && (em.length > limits.emailMax || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)))
      return "E-mail inválido.";

    if (plan === "PREMIUM" && yt.trim()) {
      if (yt.trim().length > limits.ytMax) return `Link do YouTube: máximo ${limits.ytMax} caracteres.`;
      if (!isValidYouTubeUrl(yt.trim())) return "Link do YouTube inválido.";
    }

    if (plan === "BASIC" && yt.trim()) {
      return "No Básico não há música. Apague o link ou selecione Premium.";
    }

    return null;
  }

  function resetForm() {
    setPlan("BASIC");
    setNames("");
    setStartDate("");
    setMessage("");
    setYt("");
    setWhatsapp("");
    setEmail("");
    setPhotos([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", plan);
      fd.append("names", names.trim());
      fd.append("startDate", startDate);
      fd.append("message", message.trim());

      const wppDigits = onlyDigits(whatsapp);
      if (wppDigits) fd.append("whatsapp", wppDigits);
      if (email.trim()) fd.append("email", email.trim());

      if (plan === "PREMIUM" && yt.trim()) fd.append("yt", yt.trim());

      photos.forEach((f) => fd.append("photos", f));

      const res = await fetch("/api/create-page", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Erro ao criar página.");
        return;
      }

      // Não mostrar token/link ao cliente.
      // Para DEV: se você quiser, pode ver no console.
      // console.log("created:", json);

      resetForm();
      setShowPending(true);
    } finally {
      setSubmitting(false);
    }
  }

  const roseInput =
    "w-full rounded-2xl bg-black/30 border border-rose-300/25 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-rose-300/60 focus:ring-2 focus:ring-rose-400/25";

  const roseCard =
    "rounded-3xl border border-rose-300/15 bg-rose-500/5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]";

  return (
    <main className="min-h-screen bg-[#0B0B10] text-white">
      {/* Modal pagamento em análise */}
      {showPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-300/20 bg-[#0B0B10] p-6 shadow-[0_0_60px_rgba(244,63,94,0.18)]">
            <h2 className="text-xl font-semibold tracking-tight">Pagamento em análise</h2>
            <p className="mt-2 text-sm text-white/70">
              Assim que o pagamento for aprovado, você receberá o link por WhatsApp ou e-mail.
            </p>

            <button
              type="button"
              onClick={() => setShowPending(false)}
              className="mt-5 w-full rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold hover:bg-rose-500/15"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Criar Love365</h1>
        <p className="mt-2 text-sm text-white/70">Preencha os dados e finalize o pedido.</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {/* Plano em caixas */}
          <div className={`${roseCard} p-5`}>
            <div className="text-sm text-white/80">Plano</div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPlan("BASIC")}
                className={`text-left rounded-3xl border p-4 transition ${
                  plan === "BASIC"
                    ? "border-rose-300/45 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.18)]"
                    : "border-rose-300/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-base font-semibold">Básico</div>
                <div className="mt-1 text-xs text-white/70">Até {limits.maxPhotosBasic} fotos</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan("PREMIUM")}
                className={`text-left rounded-3xl border p-4 transition ${
                  plan === "PREMIUM"
                    ? "border-rose-300/45 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.18)]"
                    : "border-rose-300/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-base font-semibold">Premium</div>
                <div className="mt-1 text-xs text-white/70">Até {limits.maxPhotosPremium} fotos</div>
              </button>
            </div>

            <div className="mt-3 text-xs text-white/60">
              Selecionado: <span className="text-white/85">{plan}</span> — máximo de{" "}
              <span className="text-white/85">{maxPhotos}</span> fotos.
            </div>
          </div>

          {/* Nome + Data */}
          <div className={`${roseCard} p-5 space-y-4`}>
            <div>
              <label className="text-sm text-white/80">Nome do casal</label>
              <input
                className={`${roseInput} mt-2`}
                value={names}
                onChange={(e) => setNames(e.target.value.slice(0, limits.namesMax))}
                placeholder="Ex: Eve e Lucas"
                maxLength={limits.namesMax}
                required
              />
              <div className="mt-1 text-xs text-white/60">
                {names.length}/{limits.namesMax}
              </div>
            </div>

            <div>
              <label className="text-sm text-white/80">Data de início</label>
              <input
                type="date"
                className={`${roseInput} mt-2`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Fotos com preview */}
          <div className={`${roseCard} p-5`}>
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80">Fotos</label>
              <span className="text-xs text-white/60">
                {photos.length}/{maxPhotos}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-medium hover:bg-rose-500/15">
                Selecionar fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickPhotos(e.target.files)}
                />
              </label>

              <button
                type="button"
                onClick={() => setPhotos([])}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                disabled={photos.length === 0}
              >
                Limpar
              </button>
            </div>

            {photoPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photoPreviews.map((src, idx) => (
                  <div key={src} className="relative overflow-hidden rounded-2xl border border-rose-300/15 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`preview ${idx + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/75"
                      aria-label="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Texto */}
          <div className={`${roseCard} p-5`}>
            <label className="text-sm text-white/80">Texto (opcional)</label>
            <textarea
              className={`${roseInput} mt-2 min-h-[120px]`}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, limits.messageMax))}
              placeholder="Escreva uma mensagem…"
              maxLength={limits.messageMax}
            />
            <div className="mt-1 text-xs text-white/60">
              {message.length}/{limits.messageMax}
            </div>
          </div>

          {/* YouTube (Premium) */}
          {plan === "PREMIUM" && (
            <div className={`${roseCard} p-5`}>
              <label className="text-sm text-white/80">Link da música do YouTube (opcional)</label>
              <input
                className={`${roseInput} mt-2`}
                value={yt}
                onChange={(e) => setYt(e.target.value.slice(0, limits.ytMax))}
                placeholder="Ex: https://www.youtube.com/watch?v=79KWwlhbOD8"
                maxLength={limits.ytMax}
              />
              <div className="mt-1 text-xs text-white/60">
                {yt.length}/{limits.ytMax}
              </div>
            </div>
          )}

          {/* Envio */}
          <div className={`${roseCard} p-5`}>
            <div className="text-sm text-white/80">Receber link via (obrigatório pelo menos 1)</div>

            <div className="mt-4 grid gap-4">
              <div>
                <div className="text-xs text-white/60">WhatsApp (somente números)</div>
                <input
                  className={`${roseInput} mt-2`}
                  value={whatsapp}
                  onChange={(e) =>
                    setWhatsapp(onlyDigits(e.target.value).slice(0, limits.whatsappMaxDigits))
                  }
                  placeholder="Ex: 27999999999"
                  inputMode="numeric"
                />
              </div>

              <div>
                <div className="text-xs text-white/60">E-mail</div>
                <input
                  type="email"
                  className={`${roseInput} mt-2`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, limits.emailMax))}
                  placeholder="exemplo@email.com"
                  maxLength={limits.emailMax}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-3xl border border-rose-300/25 bg-rose-500/10 px-5 py-4 text-sm font-semibold hover:bg-rose-500/15 disabled:opacity-60 shadow-[0_0_35px_rgba(244,63,94,0.18)]"
          >
            {submitting ? "Enviando..." : "Finalizar pedido"}
          </button>
        </form>
      </div>
    </main>
  );
}
