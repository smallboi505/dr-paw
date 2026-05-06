"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/plans";

export async function completeOnboarding(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized - Not logged in" };
    }

    // If user already has a clinic, just redirect them to dashboard
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return { success: true, redirectTo: "/select-clinic" };
    }

    const clinicName = formData.get("clinicName") as string;
    const location = formData.get("location") as string;
    const phone = formData.get("phone") as string;
    const timezone = formData.get("timezone") as string;
    const email = formData.get("email") as string;
    const petIdMode = formData.get("petIdMode") as string;
    const petIdFormat = formData.get("petIdFormat") as string;

    if (!clinicName || !location || !phone || !petIdMode || !petIdFormat) {
      return { error: "Missing required fields" };
    }

    if (!email) {
      return { error: "Email is required" };
    }

    // Set trial end date - 30 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        location,
        phone,
        timezone: timezone || "GMT",
        petIdMode: petIdMode as "MANUAL" | "AUTO",
        petIdFormat: petIdFormat || "PET####",
        plan: "TRIAL",
        trialEndsAt,
      },
    });

    await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        firstName: null,
        lastName: null,
        role: "ADMIN",
        clinicId: clinic.id,
      },
    });

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
    }

    // Redirect to upgrade page so new users choose a plan
    return { success: true, redirectTo: "/upgrade" };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: error?.message || "Failed to complete onboarding" };
  }
}