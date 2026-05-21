"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminTheme } from "@/components/admin/admin-theme";

export function AdminOpsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return (
      <div className={adminTheme.root}>
        <div className="flex min-h-screen items-center justify-center px-4">
          {children}
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
