import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/plans";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=missing_reference`);
    }

    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=payment_failed`);
    }

    const { clinicId, plan, billingCycle } = paystackData.data.metadata;
    const amount = paystackData.data.amount;

    // Calculate period
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Update clinic plan and upsert subscription
    await Promise.all([
      prisma.clinic.update({
        where: { id: clinicId },
        data: {
          plan,
          trialEndsAt: null, // clear trial
        },
      }),
      prisma.subscription.upsert({
        where: { clinicId },
        create: {
          clinicId,
          plan,
          status: "active",
          paystackReference: reference,
          amount,
          currency: "GHS",
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan,
          status: "active",
          paystackReference: reference,
          amount,
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
        },
      }),
    ]);

    console.log(`✅ Payment verified for clinic ${clinicId} - upgraded to ${plan}`);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`);
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=server_error`);
  }
}