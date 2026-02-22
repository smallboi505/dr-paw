import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    console.log('Verify API called with token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        clinic: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    console.log('Invite found:', invite ? 'YES' : 'NO');

    if (!invite) {
      console.log('❌ Invalid token');
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invite.expiresAt)) {
      console.log('❌ Invite expired');
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Check if already used
    if (invite.status !== "PENDING") {
      console.log('❌ Invite already used:', invite.status);
      return NextResponse.json(
        { error: `This invite has been ${invite.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    console.log('✅ Invite valid:', invite.email, invite.role);

    // Return invite details (without sensitive info)
    return NextResponse.json({
      valid: true,
      email: invite.email,
      role: invite.role,
      clinic: invite.clinic,
    });
  } catch (error) {
    console.error("Verify invite error:", error);
    return NextResponse.json(
      { error: "Failed to verify invite" },
      { status: 500 }
    );
  }
}