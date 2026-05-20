"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PhonePreview } from "@/components/create/PhonePreview";
import { CompactPhonePreview } from "@/components/create/CompactPhonePreview";
import { CreateProgressBar } from "@/components/create/CreateProgressBar";
import { StepPanel } from "@/components/create/StepPanel";
import { PlanSelector } from "@/components/create/PlanSelector";
import { PhotoUploader } from "@/components/create/PhotoUploader";
import { CreateLoadingOverlay } from "@/components/create/CreateLoadingOverlay";
import { compressImageToJpeg } from "@/lib/compress-image";
import { diffParts } from "@/lib/date-utils";
import { computeCreateProgress, canAdvanceStep } from "@/lib/create-progress";

type Plan = "BASIC" | "PREMIUM";
type SubmitPhase = "idle" | "creating" | "redirecting";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

const TOTAL_STEPS = 4;

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [plan, setPlan] = useState<Plan>("BASIC");
  const [names, setNames] = useState("");
  const [startDate, setStartDate] = useState("");
  const [yt, setYt] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
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

  const progress = computeCreateProgress(step, {
    names,
    startDate,
    photosCount: photos.length,
    maxPhotos,
    whatsapp,
    email,
  });

  const goTo = (next: number) => {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files || uploadingPhotos) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = Math.max(0, maxPhotos - photos.length);
    const toProcess = picked.slice(0, remaining);
    if (toProcess.length === 0) return;

    setUploadingPhotos(true);
    try {
      const processed: File[] = [];
      for (const f of toProcess) {
        processed.push(await compressImageToJpeg(f, { maxWidth: 1080, quality: 0.8 }));
      }
      setPhotos((prev) => [...prev, ...processed].slice(0, maxPhotos));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitPhase !== "idle") return;

    setSubmitPhase("creating");

    try {
      const formData = new FormData();
      formData.append("plan", plan);
      formData.append("names", names);
      formData.append("startDate", startDate);
      formData.append("yt", yt);
      formData.append("whatsapp", whatsapp);
      formData.append("email", email);
      photos.forEach((file) => formData.append("photos", file));

      const response = await fetch("/api/create-page", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));

      console.log("[CREATE-PAGE][CLIENT]", {
        status: response.status,
        ok: response.ok,
        hasToken: Boolean(data?.token),
        hasUrl: Boolean(data?.url || data?.paymentUrl),
        error: data?.error,
      });

      if (!response.ok) {
        throw new Error(data?.error || `Erro ao criar página (${response.status})`);
      }

      const paymentUrl = data.paymentUrl || data.url;
      if (paymentUrl) {
        setSubmitPhase("redirecting");
        window.location.href = paymentUrl;
        return;
      }
      if (data.publicUrl) {
        setSubmitPhase("redirecting");
        window.location.href = data.publicUrl;
        return;
      }
      console.error("[CREATE-PAGE][CLIENT] Resposta sem URL de pagamento:", data);
      throw new Error("Link de pagamento não retornado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Ops! " + message);
      console.error("Erro no envio:", err);
      setSubmitPhase("idle");
    }
  };

  const canNext = canAdvanceStep(step, { names, startDate, whatsapp, email });

  return (
    <div className="love-cinematic-bg love-grain relative min-h-screen">
      {submitPhase !== "idle" && <CreateLoadingOverlay phase={submitPhase} />}

      <SiteNav backHref="/" backLabel="Voltar" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-24 sm:pt-28">
        <CompactPhonePreview
          names={names}
          photoUrl={photoPreviews[0]}
          years={timeDisplay.years}
          days={timeDisplay.days}
          showHearts={plan === "PREMIUM"}
        />

        <div className="mt-6 grid grid-cols-1 gap-10 lg:mt-0 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="min-w-0">
            <header className="mb-6 text-center lg:mb-8 lg:text-left">
              <h1 className="font-display text-3xl font-medium text-white sm:text-4xl lg:text-5xl">
                Crie sua página
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Quatro passos · preview ao vivo no desktop
              </p>
            </header>

            <div className="sticky top-[4.5rem] z-40 -mx-4 mb-2 border-b border-[var(--border)] bg-[rgba(10,10,15,0.85)] px-4 py-4 backdrop-blur-xl lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <CreateProgressBar currentStep={step} percent={progress} />
            </div>

            <form onSubmit={onSubmit}>
              {step === 1 && (
                <StepPanel stepKey="step-1" direction={direction}>
                  <GlassCard interactive>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Escolha o plano
                    </p>
                    <PlanSelector value={plan} onChange={setPlan} />
                  </GlassCard>
                </StepPanel>
              )}

              {step === 2 && (
                <StepPanel stepKey="step-2" direction={direction}>
                  <GlassCard interactive>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      História de vocês
                    </p>
                    <div className="space-y-3">
                      <input
                        className="love-input"
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                        placeholder="Nomes (ex: Ana e Leo)"
                        maxLength={40}
                        required
                      />
                      <input
                        type="date"
                        className="love-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                      <input
                        className="love-input"
                        value={yt}
                        onChange={(e) => setYt(e.target.value)}
                        placeholder="Link do YouTube (Premium)"
                        disabled={plan === "BASIC"}
                      />
                      {plan === "BASIC" && (
                        <p className="text-xs text-[var(--text-muted)]">
                          Música de fundo no plano Premium.
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </StepPanel>
              )}

              {step === 3 && (
                <StepPanel stepKey="step-3" direction={direction}>
                  <GlassCard interactive>
                    <PhotoUploader
                      previews={photoPreviews}
                      maxPhotos={maxPhotos}
                      uploading={uploadingPhotos}
                      onPick={onPickPhotos}
                      onRemove={removePhoto}
                    />
                  </GlassCard>
                </StepPanel>
              )}

              {step === 4 && (
                <StepPanel stepKey="step-4" direction={direction}>
                  <GlassCard interactive>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Onde enviamos o link
                    </p>
                    <div className="space-y-3">
                      <input
                        className="love-input"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(onlyDigits(e.target.value))}
                        placeholder="WhatsApp com DDD"
                        required
                      />
                      <input
                        type="email"
                        className="love-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu melhor e-mail"
                        required
                      />
                    </div>
                    <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                      Após confirmar, você será redirecionado ao pagamento seguro. O link da página é liberado na hora.
                    </p>
                  </GlassCard>
                </StepPanel>
              )}

              <nav className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  className={`w-full sm:w-auto ${step === 1 ? "invisible pointer-events-none" : ""}`}
                  onClick={() => goTo(Math.max(1, step - 1))}
                >
                  Voltar
                </PremiumButton>

                {step < TOTAL_STEPS ? (
                  <PremiumButton
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={!canNext}
                    onClick={() => goTo(step + 1)}
                  >
                    Continuar
                  </PremiumButton>
                ) : (
                  <PremiumButton
                    type="submit"
                    className="w-full sm:w-auto"
                    loading={submitPhase !== "idle"}
                    disabled={!canNext || submitPhase !== "idle"}
                  >
                    Criar nosso site eterno
                  </PremiumButton>
                )}
              </nav>
            </form>
          </div>

          <PhonePreview
            names={names}
            photoUrl={photoPreviews[0]}
            time={timeDisplay}
            showHearts={plan === "PREMIUM"}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
