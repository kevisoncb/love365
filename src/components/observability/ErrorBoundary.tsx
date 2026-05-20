"use client";

import React from "react";
import { toUserFacingMessage } from "@/lib/client-errors";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: toUserFacingMessage(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const payload = {
      message:
        error instanceof Error ? error.message : "react_error",
      scope: "TRIBUTE",
      route:
        typeof window !== "undefined"
          ? window.location.pathname
          : undefined,
    };

    void fetch("/api/ops/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        meta: { componentStack: info.componentStack?.slice(0, 500) },
      }),
    }).catch(() => undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="love-cinematic-bg flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl text-white">
            Ops, algo inesperado aconteceu
          </p>
          <p className="mt-3 max-w-sm text-sm text-[var(--text-muted)]">
            {this.state.message}
          </p>
          <button
            type="button"
            className="love-btn mt-8 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
