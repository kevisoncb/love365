import { Page } from "@/lib/db";
import { isPaidPageStatus } from "@/lib/page-status";
import type { PageDocument } from "@/types/page";

export type TributeListFilters = {
  q?: string;
  status?: string;
  plan?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function buildTributeFilter(
  filters: TributeListFilters
): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {};

  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(q, "i");
    mongoFilter.$or = [
      { token: regex },
      { names: regex },
      { contact: regex },
    ];
  }

  if (filters.status === "paid") {
    mongoFilter.status = { $in: ["PAID", "APPROVED"] };
  } else if (filters.status === "pending") {
    mongoFilter.status = { $nin: ["PAID", "APPROVED"] };
  } else if (filters.status) {
    mongoFilter.status = filters.status.toUpperCase();
  }

  if (filters.plan === "BASIC" || filters.plan === "PREMIUM") {
    mongoFilter.plan = filters.plan;
  }

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) {
      createdAt.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    mongoFilter.createdAt = createdAt;
  }

  return mongoFilter;
}

export async function countTributes(
  filters: TributeListFilters
): Promise<number> {
  return Page.countDocuments(buildTributeFilter(filters));
}

export async function listTributes(
  filters: TributeListFilters,
  skip: number,
  limit: number
): Promise<PageDocument[]> {
  return Page.find(buildTributeFilter(filters))
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() as Promise<PageDocument[]>;
}

export function normalizeStatusFilter(
  raw?: string | null
): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s === "paid" || s === "pago") return "paid";
  if (s === "pending" || s === "pendente") return "pending";
  return raw;
}

export { isPaidPageStatus };
