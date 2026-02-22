import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all clinic memberships for this user
    const memberships = await prisma.user.findMany({
      where: { clerkId: userId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const clinics = memberships.map((m) => ({
      clinicId: m.clinic.id,
      clinicName: m.clinic.name,
      location: m.clinic.location,
      role: m.role,
      joinedAt: m.createdAt,
    }));

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error("Get user clinics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinics" },
      { status: 500 }
    );
  }
}