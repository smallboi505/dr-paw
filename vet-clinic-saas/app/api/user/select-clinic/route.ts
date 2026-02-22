import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clinicId } = body;

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    // Verify user actually belongs to this clinic
    const membership = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        clinicId: clinicId,
      },
      include: {
        clinic: { select: { name: true } },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have access to this clinic" },
        { status: 403 }
      );
    }

    // Store active clinic in Clerk session metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        activeClinicId: clinicId,
        onboardingComplete: true,
      },
    });

    console.log(`✅ User ${userId} selected clinic: ${membership.clinic.name}`);

    return NextResponse.json({
      success: true,
      clinicId,
      clinicName: membership.clinic.name,
      role: membership.role,
    });
  } catch (error) {
    console.error("Select clinic error:", error);
    return NextResponse.json(
      { error: "Failed to select clinic" },
      { status: 500 }
    );
  }
}