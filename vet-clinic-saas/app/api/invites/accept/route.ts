import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        clinic: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invite.expiresAt)) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invite has been ${invite.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Get user's email from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    // Log for debugging but don't block - admin may have changed email
    if (userEmail !== invite.email) {
      console.log(`Note: Invite email (${invite.email}) differs from user email (${userEmail})`);
    }

    // Check if user already exists in this clinic
    const existingUser = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        clinicId: invite.clinicId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "You are already part of this clinic" },
        { status: 409 }
      );
    }

    // Map invite role to user role (RECEPTIONIST → RECEPTION)
    const userRole = invite.role === "RECEPTIONIST" ? "RECEPTION" : invite.role;

    // Create user in the clinic
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: userEmail,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        role: userRole as "ADMIN" | "VET" | "RECEPTION",
        clinicId: invite.clinicId,
      },
    });

    // Mark invite as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    // Update Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        clinicId: invite.clinicId,
      },
    });

    // NOTIFY ADMINS ABOUT NEW STAFF MEMBER
    const staffName = newUser.firstName 
      ? `${newUser.firstName} ${newUser.lastName || ''}`
      : newUser.email;

    await notifyAdmins(
      invite.clinicId,
      "STAFF",
      "New staff member joined",
      `${staffName} accepted your invitation as ${newUser.role}`,
      `/settings`
    );

    return NextResponse.json({
      success: true,
      clinic: invite.clinic,
      user: newUser,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}