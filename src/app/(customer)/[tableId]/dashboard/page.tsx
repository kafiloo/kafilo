import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MerchantDashboard({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId: slug } = await params;
  const session = await getSession();
  if (!session) redirect("/masuk");
  if (session.role !== "OWNER" || !session.tenantId) notFound();

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { id: true, name: true, slug: true } });
  if (!tenant || tenant.slug !== slug) notFound();

  const [products, orders, customers] = await Promise.all([
    prisma.product.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({ where: { tenantId: tenant.id } }),
    prisma.customer.count({ where: { tenantId: tenant.id } }),
  ]);
  return <main className="min-h-screen bg-slate-50 px-6 py-10">
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-bold uppercase tracking-widest text-amber-800">Dashboard toko</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">{tenant.name}</h1>
      <p className="mt-2 text-slate-600">Ringkasan operasional toko Anda.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[{ label: "Produk", value: products }, { label: "Pesanan", value: orders }, { label: "Pelanggan", value: customers }].map((item) => <section key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p></section>)}
      </div>
      <p className="mt-8 text-sm text-slate-500">Alamat toko: <span className="font-semibold">app.kafiloo.com/{tenant.slug}</span></p>
    </div>
  </main>;
}
