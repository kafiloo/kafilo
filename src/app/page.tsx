// =============================================================
// Root Page — Redirect berdasarkan session
// Jika sudah login → ke dashboard/cashier, jika belum → login
// =============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "SUPER_ADMIN") {
    redirect("/cms/dashboard");
  }

  redirect("/cashier");
}
