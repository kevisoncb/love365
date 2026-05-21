import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { NO_STORE_HEADERS } from "@/lib/api-config";

export function adminUnauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Não autorizado" },
    { status: 401, headers: NO_STORE_HEADERS }
  );
}

/** Retorna Response de erro ou null se autorizado */
export async function requireAdmin(
  req: Request
): Promise<NextResponse | null> {
  if (!(await isAdminAuthorized(req))) {
    return adminUnauthorized();
  }
  return null;
}

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const limit = Math.min(
    100,
    Math.max(
      10,
      Number.parseInt(searchParams.get("limit") || "25", 10) || 25
    )
  );
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
