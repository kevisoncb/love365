"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminButton,
  AdminInput,
  adminTheme,
} from "@/components/admin/admin-ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Falha no login"
        );
      }
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao entrar"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full max-w-sm ${adminTheme.card} p-8`}
    >
      <h1 className="font-display text-2xl font-medium text-zinc-50">
        Love365 Ops
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Painel interno de operação
      </p>
      <div className="mt-6">
        <label htmlFor="admin-password" className="sr-only">
          Senha admin
        </label>
        <AdminInput
          id="admin-password"
          type="password"
          placeholder="Senha admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="mt-3 text-sm text-rose-400">{error}</p>
      )}
      <AdminButton
        type="submit"
        variant="primary"
        disabled={loading}
        className="mt-6 w-full !py-2.5 !text-sm"
      >
        {loading ? "Entrando…" : "Entrar"}
      </AdminButton>
    </form>
  );
}
