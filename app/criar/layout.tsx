import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/ui/LoadingScreen";

export const metadata: Metadata = {
  title: "Criar sua página",
  description:
    "Monte em minutos a página do casal com fotos, contador ao vivo e música. Pagamento PIX seguro.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <LoadingScreen message="Carregando criador…" />
      }
    >
      {children}
    </Suspense>
  );
}
