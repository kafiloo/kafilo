import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1" } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings/points]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { loyaltyEnabled, rewardPerAmount, pointsEarned, registrationPoints } = body;

    let settings = await prisma.storeSetting.findFirst();
    
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1" } });
    }

    const updatedSettings = await prisma.storeSetting.update({
      where: { id: settings.id },
      data: {
        loyaltyEnabled: Boolean(loyaltyEnabled),
        rewardPerAmount: Number(rewardPerAmount) || 10000,
        pointsEarned: Number(pointsEarned) || 1,
        registrationPoints: Number(registrationPoints) || 0,
      }
    });

    return NextResponse.json({ message: "Aturan poin berhasil disimpan", settings: updatedSettings });
  } catch (error) {
    console.error("[PUT /api/settings/points]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}