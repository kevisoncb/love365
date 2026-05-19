type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = "Carregando sua história…" }: LoadingScreenProps) {
  return (
    <main className="love-cinematic-bg flex min-h-[100svh] flex-col items-center justify-center gap-4">
      <span className="love-spinner h-8 w-8 border-[2.5px]" aria-hidden />
      <p className="text-sm font-medium text-[var(--text-muted)]">{message}</p>
    </main>
  );
}
