import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * Get the current user's ACTIVE clinic ID.
 * Reads from Clerk metadata (set when user selects clinic on login).
 * Falls back to first clinic if no active clinic set.
 */
export async function getCurrentClinicId(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return null;
  }

  // Check if there's an active clinic in Clerk metadata
  const activeClinicId = (sessionClaims?.metadata as any)?.activeClinicId 
    || (sessionClaims as any)?.publicMetadata?.activeClinicId;

  if (activeClinicId) {
    // Verify user still belongs to this clinic
    const membership = await prisma.user.findFirst({
      where: { clerkId: userId, clinicId: activeClinicId },
      select: { clinicId: true },
    });
    if (membership) return membership.clinicId;
  }

  // Fallback: get first clinic membership
  const user = await prisma.user.findFirst({
    where: { clerkId: userId },
    select: { clinicId: true },
    orderBy: { createdAt: 'asc' },
  });

  return user?.clinicId || null;
}

/**
 * Get the current user's full details for the active clinic
 */
export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return null;
  }

  const activeClinicId = (sessionClaims?.metadata as any)?.activeClinicId
    || (sessionClaims as any)?.publicMetadata?.activeClinicId;

  // Find user in active clinic, or fall back to first membership
  const user = await prisma.user.findFirst({
    where: {
      clerkId: userId,
      ...(activeClinicId ? { clinicId: activeClinicId } : {}),
    },
    include: {
      clinic: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return user;
}