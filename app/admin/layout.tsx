import type { Metadata } from "next";

import "./admin.css";

import { AdminOpsLayout } from "@/components/admin/AdminOpsLayout";

export const metadata: Metadata = {
  title: "Operações | Love365",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminOpsLayout>{children}</AdminOpsLayout>;
}
