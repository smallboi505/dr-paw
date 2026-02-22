import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify invite belongs to clinic
    const invite = await prisma.invite.findFirst({
      where: {
        id,
        clinicId,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Get clinic name for email
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    // TODO: Resend email here
    // For now, just log
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${invite.token}`;
    console.log(`Resending invite to ${invite.email}`);
    console.log(`Invite link: ${inviteLink}`);
    console.log(`Clinic: ${clinic?.name}, Role: ${invite.role}`);

    return NextResponse.json({ 
      success: true,
      inviteLink // For development
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Failed to resend invite" },
      { status: 500 }
    );
  }
}