// =============================================================
// Admin Layout — (admin)/layout.tsx
// Wrapper untuk semua halaman CMS (SUPER_ADMIN & MANAGER)
// =============================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user: session, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!session || !["SUPER_ADMIN", "MANAGER"].includes(session.role))) router.replace("/masuk");
  }, [loading, router, session]);
  
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
