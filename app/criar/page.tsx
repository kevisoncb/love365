"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "BASIC" | "PREMIUM";

const PLAN: Record<Plan, { maxPhotos: number; maxMessage: number }> = {
  BASIC: { maxPhotos: 3, maxMessage: 280 },
  PREMIUM: { maxPhotos: 5, maxMessage: 800 },
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function formatBRPhone(input: string) {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export default function Criar() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [plan, setPlan] = useState<Plan | "">("");
  const [names, setNames] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [whats, setWhats] = useState("");

  const [youtubeUrl, setYoutubeUrl] = useState(""); // Premium (opcional)

  const [photos, setPhotos] = useState<File[]>([]);
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const planSelected = plan === "BASIC" || plan === "PREMIUM";
  const maxPhotos = planSelected ? PLAN[plan].maxPhotos : 0;
  const maxMessage = planSelected ? PLAN[plan].maxMessage : 0;

  function onPickPhotos(list: FileList | null) {
    if (!list) return;
    if (!planSelected) return setError("Selecione um plano antes de enviar fotos.");

    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const merged = [...photos, ...incoming];

    if (merged.length > maxPhotos) {
      setPhotos(merged.slice(0, maxPhotos));
      setError(`Máximo de ${maxPhotos} fotos no plano selecionado.`);
      return;
    }

    const tooBig = merged.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setError("Uma das fotos excede 5MB.");
      return;
    }

    setError(null);
    setPhotos(merged);

    // Permite escolher o mesmo arquivo de novo (caso remova e queira re-adicionar)
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(i: number) {
    const copy = photos.slice();
    copy.splice(i, 1);
    setPhotos(copy);
  }

  function clearPhotos() {
    setPhotos([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!planSelected) return setError("Selecione um plano.");
    const safeNames = names.trim().slice(0, 60);
    if (!safeNames) return setError("Informe o nome do casal.");
    if (!startDate) return setError("Informe a data de início.");

    // data não futura
    const today = new Date();
    const inputDate = new Date(startDate + "T00:00:00");
    if (inputDate.getTime() > today.getTime()) return setError("A data de início não pode ser no futuro.");

    // fotos
    if (photos.length === 0) return setError("Envie pelo menos 1 foto.");
    if (photos.length > maxPhotos) return setError(`Máximo de ${maxPhotos} fotos.`);

    // contato
    const safeEmail = email.trim().slice(0, 120);
    const whatsDigits = onlyDigits(whats).slice(0, 11);
    const hasEmail = !!safeEmail;
    const hasWhats = whatsDigits.length >= 10;
    if (!hasEmail && !hasWhats) return setError("Informe e-mail ou WhatsApp para receber o link.");

    const fd = new FormData();
    fd.append("plan", plan);
    fd.append("names", safeNames);
    fd.append("startDate", startDate);
    fd.append("message", message.trim().slice(0, maxMessage));
    fd.append("email", safeEmail);
    fd.append("whats", whatsDigits);

    // Premium: música opcional
    if (plan === "PREMIUM") fd.append("youtubeUrl", youtubeUrl.trim().slice(0, 300));

    photos.forEach((f) => fd.append("photos", f));

    setSending(true);
    try {
      const res = await fetch("/api/create-page", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao criar.");

      router.push(json.url); // /p/{token}
    } catch (err: any) {
      setError(err?.message || "Erro ao criar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Criar Love365</h1>
        <p className="mt-2 text-sm text-gray-600">
          Obrigatório: plano, nome, data, fotos e receber link (e-mail ou WhatsApp).
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Plano */}
          <section className="rounded-2xl border p-4">
            <div className="text-sm font-medium">
              Plano <span className="text-red-600">*</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlan("BASIC");
                  if (photos.length > PLAN.BASIC.maxPhotos) setPhotos(photos.slice(0, PLAN.BASIC.maxPhotos));
                  if (message.length > PLAN.BASIC.maxMessage) setMessage(message.slice(0, PLAN.BASIC.maxMessage));
                  setYoutubeUrl("");
                  setError(null);
                }}
                className={`rounded-xl border p-3 text-left ${plan === "BASIC" ? "border-black" : "border-gray-200"}`}
              >
                <div className="text-sm font-semibold">Básico</div>
                <div className="text-xs text-gray-600">Até 3 fotos • Sem música</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlan("PREMIUM");
                  if (photos.length > PLAN.PREMIUM.maxPhotos) setPhotos(photos.slice(0, PLAN.PREMIUM.maxPhotos));
                  if (message.length > PLAN.PREMIUM.maxMessage) setMessage(message.slice(0, PLAN.PREMIUM.maxMessage));
                  setError(null);
                }}
                className={`rounded-xl border p-3 text-left ${plan === "PREMIUM" ? "border-black" : "border-gray-200"}`}
              >
                <div className="text-sm font-semibold">Premium</div>
                <div className="text-xs text-gray-600">Até 5 fotos • Música opcional</div>
              </button>
            </div>
          </section>

          {/* Dados */}
          <section className={`rounded-2xl border p-4 space-y-4 ${!planSelected ? "opacity-50" : ""}`}>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Nome do casal <span className="text-red-600">*</span>
              </label>
              <input
                disabled={!planSelected}
                value={names}
                onChange={(e) => setNames(e.target.value.slice(0, 60))}
                maxLength={60}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50"
                placeholder="Ex: Kev & Isa"
              />
              <div className="mt-1 text-xs text-gray-500">{names.length}/60</div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">
                Data de início <span className="text-red-600">*</span>
              </label>
              <input
                disabled={!planSelected}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Texto (opcional)</label>
              <textarea
                disabled={!planSelected}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxMessage))}
                maxLength={maxMessage}
                rows={4}
                className="mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50"
                placeholder="Escreva algo…"
              />
              {planSelected && <div className="mt-1 text-xs text-gray-500">{message.length}/{maxMessage}</div>}
            </div>
          </section>

          {/* Fotos */}
          <section className={`rounded-2xl border p-4 ${!planSelected ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Fotos <span className="text-red-600">*</span>
              </div>
              <div className="text-xs text-gray-600">{photos.length}/{maxPhotos}</div>
            </div>

            {/* Input escondido + botão (DETALHE pedido) */}
            <input
              ref={fileRef}
              disabled={!planSelected}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickPhotos(e.target.files)}
              className="hidden"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={!planSelected}
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Adicionar fotos
              </button>

              <button
                type="button"
                disabled={!planSelected || photos.length === 0}
                onClick={clearPhotos}
                className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Limpar
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="h-24 w-full rounded-xl object-cover border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Dica: selecione várias fotos de uma vez. Limite por plano.
            </p>
          </section>

          {/* Música Premium */}
          {plan === "PREMIUM" && (
            <section className="rounded-2xl border p-4">
              <div className="text-sm font-medium">Música (YouTube) — Premium (opcional)</div>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value.slice(0, 300))}
                maxLength={300}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
                placeholder="Cole o link do YouTube (opcional)"
                inputMode="url"
              />
            </section>
          )}

          {/* Receber link */}
          <section className={`rounded-2xl border p-4 space-y-3 ${!planSelected ? "opacity-50" : ""}`}>
            <div className="text-sm font-medium">
              Receber o link <span className="text-red-600">*</span>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">E-mail</label>
              <input
                disabled={!planSelected}
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                maxLength={120}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50"
                placeholder="seuemail@exemplo.com"
                inputMode="email"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">WhatsApp</label>
              <input
                disabled={!planSelected}
                value={whats}
                onChange={(e) => setWhats(formatBRPhone(e.target.value))}
                maxLength={20}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50"
                placeholder="(27) 99999-9999"
                inputMode="tel"
              />
            </div>

            <p className="text-xs text-gray-500">Informe pelo menos um: e-mail ou WhatsApp.</p>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={!planSelected || sending}
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Criando..." : "Criar minha página"}
          </button>
        </form>
      </div>
    </main>
  );
}
