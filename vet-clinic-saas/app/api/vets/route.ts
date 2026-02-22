import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Fetching vets for clinic:", clinicId);

    // Get all vets for the clinic
    const vets = await prisma.user.findMany({
      where: {
        clinicId,
        role: "VET",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    console.log("✅ Found vets:", vets.length, vets);

    return NextResponse.json({ vets });
  } catch (error) {
    console.error("❌ List vets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vets" },
      { status: 500 }
    );
  }
}