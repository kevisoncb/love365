"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminBadge,
  AdminButton,
  AdminFilterBar,
  AdminInput,
  AdminSelect,
  adminTheme,
} from "@/components/admin/admin-ui";

type LogRow = {
  id: string;
  scope: string;
  severity: string;
  message: string;
  route: string | null;
  token: string | null;
  createdAt: string | null;
};

export function LogsOperations() {
  const router = useRouter();
  const [items, setItems] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("");
  const [severity, setSeverity] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "40",
    });
    if (q) params.set("q", q);
    if (scope) params.set("scope", scope);
    if (severity) params.set("severity", severity);

    try {
      const res = await fetch(
        `/api/admin/logs?${params}`,
        { cache: "no-store" }
      );
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Falha");
      const data = await res.json();
      setItems(data.items);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, q, scope, severity, router]);

  useEffect(() => {
    load();
  }, [load]);

  const severityTone = (
    s: string
  ): "error" | "warn" | "neutral" | "accent" => {
    if (s === "error") return "error";
    if (s === "warn") return "warn";
    if (s === "info") return "accent";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      <AdminFilterBar columns={3}>
        <AdminInput
          placeholder="Buscar mensagem, rota, scope…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <AdminSelect
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos scopes</option>
          <option value="ERROR">ERROR</option>
          <option value="WEBHOOK">WEBHOOK</option>
          <option value="PAYMENT">PAYMENT</option>
          <option value="UPLOAD">UPLOAD</option>
          <option value="SYNC">SYNC</option>
          <option value="CREATE_PAGE">CREATE_PAGE</option>
          <option value="TRIBUTE">TRIBUTE</option>
        </AdminSelect>
        <AdminSelect
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas severidades</option>
          <option value="error">Erro</option>
          <option value="warn">Aviso</option>
          <option value="info">Info</option>
        </AdminSelect>
      </AdminFilterBar>

      <div className="space-y-2">
        {loading ? (
          <p className={adminTheme.empty}>Carregando logs…</p>
        ) : items.length === 0 ? (
          <p className={adminTheme.empty}>Nenhum log</p>
        ) : (
          items.map((row) => (
            <article
              key={row.id}
              className={`${adminTheme.surface} ${adminTheme.surfaceHover} p-4`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge tone={severityTone(row.severity)}>
                  {row.severity}
                </AdminBadge>
                <span className="font-mono text-xs text-zinc-400">
                  [{row.scope}]
                </span>
                <span className="text-xs text-zinc-500">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString(
                        "pt-BR"
                      )
                    : "—"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                {row.message}
              </p>
              <p className="mt-1.5 text-xs text-zinc-500">
                {row.route || "—"}
                {row.token ? ` · ${row.token}` : ""}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="flex justify-between gap-4">
        <AdminButton
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </AdminButton>
        <span className={`${adminTheme.pagination} self-center`}>
          {page} / {totalPages}
        </span>
        <AdminButton
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </AdminButton>
      </div>
    </div>
  );
}
