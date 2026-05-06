import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { PLAN_PRICES, type Plan, type BillingCycle } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic selected" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billingCycle } = body as { plan: Plan; billingCycle: BillingCycle };

    if (!plan || !billingCycle) {
      return NextResponse.json({ error: "Plan and billing cycle required" }, { status: 400 });
    }

    if (plan === "FREE" || plan === "TRIAL") {
      return NextResponse.json({ error: "Invalid plan for payment" }, { status: 400 });
    }

    // Get clinic and user details
    const [clinic, user] = await Promise.all([
      prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true, plan: true } }),
      prisma.user.findFirst({ where: { clerkId: userId }, select: { email: true, firstName: true, lastName: true } }),
    ]);

    if (!clinic || !user) {
      return NextResponse.json({ error: "Clinic or user not found" }, { status: 404 });
    }

    const prices = PLAN_PRICES[plan as "PRO" | "ENTERPRISE"];
    const amount = billingCycle === "monthly" ? prices.monthly : prices.annual;

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount, // in pesewas
        currency: "GHS",
        reference: `drpaw_${clinicId}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
        metadata: {
          clinicId,
          plan,
          billingCycle,
          clinicName: clinic.name,
          custom_fields: [
            { display_name: "Clinic", variable_name: "clinic_name", value: clinic.name },
            { display_name: "Plan", variable_name: "plan", value: plan },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData);
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Payment initialize error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}