import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  parseAdminCookie,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = parseAdminCookie(
    request.headers.get("cookie")
  );

  if (!(await verifyAdminSessionToken(session))) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
