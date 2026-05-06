import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/plans";

export async function GET() {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        plan: true,
        trialEndsAt: true,
        subscription: {
          select: {
            billingCycle: true,
            currentPeriodEnd: true,
            status: true,
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const effectivePlan = getEffectivePlan(
      clinic.plan as any,
      clinic.trialEndsAt
    );

    return NextResponse.json({
      plan: effectivePlan,
      rawPlan: clinic.plan,
      trialEndsAt: clinic.trialEndsAt,
      subscription: clinic.subscription,
    });
  } catch (error) {
    console.error("Get clinic plan error:", error);
    return NextResponse.json({ error: "Failed to get plan" }, { status: 500 });
  }
}