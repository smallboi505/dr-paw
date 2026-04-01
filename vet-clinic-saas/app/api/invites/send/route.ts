import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { getInviteEmailHtml, getInviteEmailText } from "@/lib/email-templates";
import { strictRateLimit, getRateLimitIdentifier, getClientIp } from "@/lib/rate-limit";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RATE LIMITING - fail gracefully if Redis is down
    try {
      const identifier = getRateLimitIdentifier(userId, getClientIp(request));
      const { success, limit, remaining, reset } = await strictRateLimit.limit(identifier);
      
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later.", limit, remaining, reset },
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    } catch (rateLimitError) {
      // Redis is down — log and continue, don't block the request
      console.warn("⚠️ Rate limiter unavailable, skipping:", rateLimitError);
    }

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { email, clinicId } });
    if (existingUser) {
      return NextResponse.json({ error: "This user is already part of your clinic" }, { status: 409 });
    }

    const existingInvite = await prisma.invite.findFirst({
      where: { email, clinicId, status: "PENDING" },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "An invite has already been sent to this email" }, { status: 409 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: { email, role, token, clinicId, invitedBy: userId, status: "PENDING", expiresAt },
    });

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, location: true },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Dr. Paw <noreply@drpawgh.com>',
          to: email,
          subject: `You're invited to join ${clinic?.name || 'our clinic'}!`,
          html: getInviteEmailHtml({
            clinicName: clinic?.name || 'our clinic',
            clinicLocation: clinic?.location || undefined,
            inviteeName: email,
            role,
            inviteLink,
          }),
          text: getInviteEmailText({
            clinicName: clinic?.name || 'our clinic',
            clinicLocation: clinic?.location || undefined,
            inviteeName: email,
            role,
            inviteLink,
          }),
        });
        console.log(`✅ Invite email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else {
      console.log(`⚠️ Resend not configured - invite created but email not sent`);
      console.log(`Invite link: ${inviteLink}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Invite link: ${inviteLink}`);
    }

    return NextResponse.json({ 
      success: true, 
      invite,
      inviteLink: process.env.NODE_ENV === 'development' ? inviteLink : undefined,
    });
  } catch (error) {
    console.error("Send invite error:", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}