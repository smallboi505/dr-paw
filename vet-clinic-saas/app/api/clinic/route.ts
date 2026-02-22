import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        clinic: true,
      },
    });

    if (!user?.clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json(user.clinic);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, phone, timezone, petIdMode, petIdFormat } = body;

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Update clinic
    const updatedClinic = await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        name,
        location,
        phone,
        timezone,
        petIdMode: petIdMode as "MANUAL" | "AUTO",
        petIdFormat: petIdFormat || "PET####",
      },
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json(
      { error: "Failed to update clinic" },
      { status: 500 }
    );
  }
}