import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CashierClient from "./CashierClient";

export const dynamic = 'force-dynamic';

export default async function CashierPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Mengirim nama kasir ke komponen visual (CashierClient)
  return <CashierClient cashierName={session.name || "Kasir"} />;
}