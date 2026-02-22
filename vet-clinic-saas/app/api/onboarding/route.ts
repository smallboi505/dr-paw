import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    // Check if user already has a clinic
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already has a clinic" },
        { status: 400 }
      );
    }

    // Get form data
    const body = await request.json();
    const { clinicName, location, phone, timezone, firstName, lastName, email } = body;

    // Validate required fields
    if (!clinicName || !location || !phone) {
      return NextResponse.json(
        { error: "Missing required fields: clinicName, location, phone" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required user fields: firstName, lastName, email" },
        { status: 400 }
      );
    }

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        location,
        phone,
        timezone: timezone || "GMT",
      },
    });

    // Create user linked to clinic
    const user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        firstName,
        lastName,
        role: "ADMIN", // First user is always admin
        clinicId: clinic.id,
      },
    });

    // Update Clerk user metadata to mark onboarding as complete
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: true,
          clinicId: clinic.id,
        },
      });
    } catch (clerkError) {
      console.error("Clerk metadata update error:", clerkError);
      // Continue anyway - clinic is created
    }

    return NextResponse.json({
      success: true,
      clinic,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}