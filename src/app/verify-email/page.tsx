import { redirect } from "next/navigation";

export default async function LegacyVerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  redirect(token ? `/cek-email?token=${encodeURIComponent(token)}` : "/cek-email");
}
