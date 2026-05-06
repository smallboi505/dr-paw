import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`📨 Paystack webhook: ${event.event}`);

    switch (event.event) {
      case "charge.success": {
        // Recurring charge succeeded - extend subscription
        const { metadata, amount, reference } = event.data;
        const { clinicId, plan, billingCycle } = metadata;

        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === "monthly") {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        await prisma.subscription.update({
          where: { clinicId },
          data: {
            status: "active",
            paystackReference: reference,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
        break;
      }

      case "subscription.disable": {
        // Subscription cancelled
        const { clinicId } = event.data.metadata || {};
        if (clinicId) {
          await Promise.all([
            prisma.clinic.update({
              where: { id: clinicId },
              data: { plan: "FREE" },
            }),
            prisma.subscription.update({
              where: { clinicId },
              data: { status: "cancelled", cancelledAt: new Date() },
            }),
          ]);
        }
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed - notify but don't immediately downgrade
        console.warn(`⚠️ Payment failed for subscription`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}