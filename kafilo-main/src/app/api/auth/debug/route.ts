import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();

  // Di development: full info untuk debugging (hanya SUPER_ADMIN)
  if (process.env.NODE_ENV === "development") {
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      hasSession: true,
      session: {
        id: session.id,
        name: session.name,
        username: session.username,
        role: session.role,
      },
    });
  }

  // Di production: hanya cek apakah session valid
  if (!session) {
    return NextResponse.json({ hasSession: false, session: null });
  }

  // Return session info (tanpa cookies mentah)
  return NextResponse.json({
    hasSession: true,
    session: {
      id: session.id,
      name: session.name,
      username: session.username,
      role: session.role,
    },
  });
}