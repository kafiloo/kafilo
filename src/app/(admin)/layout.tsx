// =============================================================
// Admin Layout — (admin)/layout.tsx
// Wrapper untuk semua halaman CMS (SUPER_ADMIN & MANAGER)
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { SessionUser } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 🔥 FIX: Panggil API untuk baca session (karena cookie httpOnly)
        const res = await fetch("/api/auth/debug");
        const data = await res.json();
        
        if (data.session && data.hasSession) {
          const role = data.session.role as string;
          const allowedRoles: string[] = ["SUPER_ADMIN", "MANAGER"];
          if (allowedRoles.includes(role)) {
            setSession(data.session);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("[AdminLayout] Auth check failed:", err);
      }

      router.push("/login");
    }
    checkAuth();
  }, [router]);
  
  if (loading || !session) {
    return <div className="min-h-screen bg-gray-100" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar navigasi admin */}
      <Sidebar user={session} />

      {/* Konten utama */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
