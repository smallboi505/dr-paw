import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET user's notification preferences
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          smsNotifications: false,
          appointmentReminders: true,
          appointmentConfirmations: true,
          newPetRegistration: true,
          staffUpdates: false,
          systemAlerts: true,
          marketingEmails: false,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get notification preferences" },
      { status: 500 }
    );
  }
}

// UPDATE user's notification preferences
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailNotifications,
      smsNotifications,
      appointmentReminders,
      appointmentConfirmations,
      newPetRegistration,
      staffUpdates,
      systemAlerts,
      marketingEmails,
    } = body;

    // Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailNotifications,
        smsNotifications,
        appointmentReminders,
        appointmentConfirmations,
        newPetRegistration,
        staffUpdates,
        systemAlerts,
        marketingEmails,
      },
      create: {
        userId: user.id,
        emailNotifications,
        smsNotifications,
        appointmentReminders,
        appointmentConfirmations,
        newPetRegistration,
        staffUpdates,
        systemAlerts,
        marketingEmails,
      },
    });

    return NextResponse.json({ 
      success: true, 
      preferences 
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}