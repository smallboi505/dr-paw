"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function completeOnboarding(formData: FormData) {
  try {
    // Get the current user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized - Not logged in" };
    }

    // Check if user already has a clinic
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return { error: "User already has a clinic" };
    }

    // Get form data
    const clinicName = formData.get("clinicName") as string;
    const location = formData.get("location") as string;
    const phone = formData.get("phone") as string;
    const timezone = formData.get("timezone") as string;
    const email = formData.get("email") as string;
    const petIdMode = formData.get("petIdMode") as string;
    const petIdFormat = formData.get("petIdFormat") as string;

    // Validate required fields
    if (!clinicName || !location || !phone || !petIdMode || !petIdFormat) {
      return { error: "Missing required fields" };
    }

    if (!email) {
      return { error: "Email is required" };
    }

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        location,
        phone,
        timezone: timezone || "GMT",
        petIdMode: petIdMode as "MANUAL" | "AUTO",
        petIdFormat: petIdFormat || "PET####",
      },
    });

    // Create user linked to clinic (no first/last name - just email and role)
    const user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        firstName: null, // Not storing first/last name
        lastName: null,  // Admin can update in profile later if needed
        role: "ADMIN",
        clinicId: clinic.id,
      },
    });

    // Update Clerk user metadata to mark onboarding as complete
    try {
      console.log("🔄 Attempting to update Clerk metadata for user:", userId);
      console.log("📦 Clinic ID to store:", clinic.id);
      
      const client = await clerkClient();
      const updateResult = await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: true,
          clinicId: clinic.id,
        },
      });
      
      console.log("✅ Clerk metadata update result:", JSON.stringify(updateResult.publicMetadata, null, 2));
      console.log("✅ Clerk metadata updated successfully");
    } catch (clerkError) {
      console.error("❌ Clerk metadata update error:", clerkError);
      console.error("❌ Error details:", JSON.stringify(clerkError, null, 2));
      // Don't fail the whole onboarding if metadata update fails
    }

    // Success - return success flag with redirect URL
    return { success: true, redirectTo: "/" };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: error?.message || "Failed to complete onboarding" };
  }
}