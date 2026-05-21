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
  deliveryStatusTone,
  statusTone,
} from "@/components/admin/admin-ui";

type TributeRow = {
  token: string;
  names: string;
  plan: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  contact: string | null;
  email: string | null;
  whatsapp: string | null;
  photoCount: number;
  priceCents: number;
  priceDisplay: string;
  abacateBillingId: string | null;
  pageUrl: string;
  emailDeliveryStatus: string | null;
  whatsappDeliveryStatus: string | null;
  emailDeliveredAt: string | null;
  whatsappDeliveredAt: string | null;
  deliveredAt: string | null;
  deliveryError: string | null;
};

function formatDeliveryStatus(s: string | null): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    sent: "Enviado",
    pending: "Pendente",
    failed: "Falhou",
    skipped: "N/A",
  };
  return map[s] || s;
}

type ListResponse = {
  items: TributeRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function TributesOperations() {
  const router = useRouter();
  const [items, setItems] = useState<TributeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<TributeRow | null>(null);
  const [abacatePayload, setAbacatePayload] = useState<unknown>(
    null
  );
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
    });
    if (qDebounced) params.set("q", qDebounced);
    if (status) params.set("status", status);
    if (plan) params.set("plan", plan);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(
        `/api/admin/tributes?${params}`,
        { cache: "no-store" }
      );
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = (await res.json()) as ListResponse;
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch {
      showToast("Erro ao carregar homenagens");
    } finally {
      setLoading(false);
    }
  }, [page, qDebounced, status, plan, dateFrom, dateTo, router]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (
    token: string,
    action: string
  ) => {
    setActionLoading(`${token}-${action}`);
    try {
      const res = await fetch(
        `/api/admin/tributes/${token}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha");
      showToast(data.message || "Concluído");
      await load();
      if (selected?.token === token && data.tribute) {
        setSelected(data.tribute);
      }
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Erro na ação"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = async (row: TributeRow) => {
    setSelected(row);
    setAbacatePayload(null);
    setCheckoutUrl(null);
    try {
      const res = await fetch(`/api/admin/tributes/${row.token}`);
      if (res.ok) {
        const data = await res.json();
        setAbacatePayload(data.abacate?.payload ?? null);
        setCheckoutUrl(data.abacate?.checkoutUrl ?? null);
        if (data.tribute) setSelected(data.tribute);
      }
    } catch {
      /* noop */
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copiado`);
    } catch {
      showToast("Falha ao copiar");
    }
  };

  const deleteTribute = async (token: string) => {
    if (
      !window.confirm(
        `Excluir homenagem ${token}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    setActionLoading(`${token}-delete`);
    try {
      const res = await fetch(`/api/admin/tributes/${token}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha");
      }
      showToast("Homenagem excluída");
      setSelected(null);
      await load();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Erro ao excluir"
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <p className={adminTheme.toast}>{toast}</p>}

      <AdminFilterBar>
        <AdminInput
          placeholder="Buscar nome, token, contato…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <AdminSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos status</option>
          <option value="paid">Pagos</option>
          <option value="pending">Pendentes</option>
        </AdminSelect>
        <AdminSelect
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos planos</option>
          <option value="PREMIUM">Premium</option>
          <option value="BASIC">Essencial</option>
        </AdminSelect>
        <AdminInput
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <AdminInput
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </AdminFilterBar>

      <div className={adminTheme.tableWrap}>
        <table className="w-full min-w-[900px] text-left">
          <thead className={adminTheme.tableHead}>
            <tr>
              <th className="px-4 py-3 text-left">Casal</th>
              <th className="px-4 py-3 text-left">Token</th>
              <th className="px-4 py-3 text-left">Plano</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fotos</th>
              <th className="px-4 py-3 text-left">Valor</th>
              <th className="px-4 py-3 text-left">Criada</th>
              <th className="px-4 py-3 text-left">Contato</th>
              <th className="px-4 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className={adminTheme.empty}>
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className={adminTheme.empty}>
                  Nenhuma homenagem encontrada
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.token} className={adminTheme.tableRow}>
                  <td className={`${adminTheme.tableCell} font-medium text-zinc-100`}>
                    {row.names}
                  </td>
                  <td className={adminTheme.tableCellMono}>
                    {row.token}
                  </td>
                  <td className={adminTheme.tableCell}>{row.plan}</td>
                  <td className={adminTheme.tableCell}>
                    <AdminBadge tone={statusTone(row.status)}>
                      {row.status}
                    </AdminBadge>
                  </td>
                  <td className={adminTheme.tableCell}>{row.photoCount}</td>
                  <td className={adminTheme.tableCell}>{row.priceDisplay}</td>
                  <td className={adminTheme.tableCellMuted}>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString(
                          "pt-BR"
                        )
                      : "—"}
                  </td>
                  <td className={`max-w-[140px] truncate ${adminTheme.tableCellMuted}`}>
                    {row.email || row.whatsapp || row.contact || "—"}
                  </td>
                  <td className={adminTheme.tableCell}>
                    <div className="flex flex-wrap gap-1.5">
                      <AdminButton
                        variant="primary"
                        onClick={() => openDetail(row)}
                      >
                        Ver
                      </AdminButton>
                      <AdminButton
                        onClick={() =>
                          copy(row.pageUrl, "Link")
                        }
                      >
                        Link
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className={adminTheme.pagination}>
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <AdminButton
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </AdminButton>
          <AdminButton
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
          >
            Próxima
          </AdminButton>
        </div>
      </div>

      {selected && (
        <aside className={adminTheme.modalOverlay}>
          <div className={adminTheme.modalPanel}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-medium text-zinc-50">
                  {selected.names}
                </h3>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {selected.token}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                onClick={() => setSelected(null)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Plano</dt>
                <dd className="mt-0.5 text-zinc-200">{selected.plan}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Status</dt>
                <dd className="mt-1">
                  <AdminBadge tone={statusTone(selected.status)}>
                    {selected.status}
                  </AdminBadge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Valor</dt>
                <dd className="mt-0.5 text-zinc-200">{selected.priceDisplay}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Fotos</dt>
                <dd className="mt-0.5 text-zinc-200">{selected.photoCount}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Contato</dt>
                <dd className="mt-0.5 text-zinc-200">
                  {selected.email || selected.whatsapp || "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <AdminButton
                variant="primary"
                onClick={() =>
                  window.open(selected.pageUrl, "_blank")
                }
              >
                Abrir página
              </AdminButton>
              {checkoutUrl && (
                <AdminButton
                  onClick={() =>
                    window.open(checkoutUrl, "_blank")
                  }
                >
                  Checkout
                </AdminButton>
              )}
              <AdminButton
                onClick={() => copy(selected.token, "Token")}
              >
                Copiar token
              </AdminButton>
              <AdminButton
                onClick={() =>
                  runAction(selected.token, "sync_payment")
                }
                disabled={!!actionLoading}
              >
                Sync PIX
              </AdminButton>
              <AdminButton
                onClick={() =>
                  runAction(
                    selected.token,
                    "reprocess_webhook"
                  )
                }
                disabled={!!actionLoading}
              >
                Reprocessar webhook
              </AdminButton>
              <AdminButton
                onClick={() =>
                  runAction(selected.token, "mark_paid")
                }
                disabled={!!actionLoading}
              >
                Marcar pago
              </AdminButton>
              <AdminButton
                onClick={() =>
                  runAction(selected.token, "resend_link")
                }
                disabled={!!actionLoading}
              >
                Reenviar link
              </AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => deleteTribute(selected.token)}
                disabled={!!actionLoading}
              >
                Excluir
              </AdminButton>
            </div>

            {abacatePayload != null && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-zinc-700/50 bg-zinc-950/60 p-3 text-[10px] leading-relaxed text-zinc-400">
                {JSON.stringify(abacatePayload, null, 2)}
              </pre>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
