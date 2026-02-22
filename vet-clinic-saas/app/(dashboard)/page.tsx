import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  // SERVER COMPONENT - Checks database for onboarding status
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check database directly - ALWAYS accurate, no session issues
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { 
      id: true,
      clinicId: true,
    },
  });

  // If no user record or no clinic, must complete onboarding
  if (!user || !user.clinicId) {
    redirect("/onboarding");
  }

  // User has completed onboarding - show dashboard
  return <DashboardClient />;
}