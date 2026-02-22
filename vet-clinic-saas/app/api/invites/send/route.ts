import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { getInviteEmailHtml, getInviteEmailText } from "@/lib/email-templates";
import { strictRateLimit, getRateLimitIdentifier, getClientIp } from "@/lib/rate-limit";

// Initialize Resend only if API key is present
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RATE LIMITING - Strict (10 requests per minute)
    const identifier = getRateLimitIdentifier(userId, getClientIp(request));
    const { success, limit, remaining, reset } = await strictRateLimit.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          limit,
          remaining,
          reset,
        },
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

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists in clinic
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        clinicId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This user is already part of your clinic" },
        { status: 409 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        clinicId,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 409 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Create invite (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        token,
        clinicId,
        invitedBy: userId,
        status: "PENDING",
        expiresAt,
      },
    });

    // Get clinic name for email
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, location: true },
    });

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    // Send email via Resend (only if configured)
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Dr. Paw <onboarding@drpaw.app>', // Replace with your verified domain
          to: email,
          subject: `You're invited to join ${clinic?.name || 'our clinic'}!`,
          html: getInviteEmailHtml({
            clinicName: clinic?.name || 'our clinic',
            clinicLocation: clinic?.location || undefined,
            inviteeName: email,
            role: role,
            inviteLink: inviteLink,
          }),
          text: getInviteEmailText({
            clinicName: clinic?.name || 'our clinic',
            clinicLocation: clinic?.location || undefined,
            inviteeName: email,
            role: role,
            inviteLink: inviteLink,
          }),
        });

        console.log(`✅ Invite email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails - invite is still created
        // Admin can resend manually
      }
    } else {
      console.log(`⚠️ Resend not configured - invite created but email not sent`);
      console.log(`Invite link: ${inviteLink}`);
    }

    // Log invite link for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Invite link: ${inviteLink}`);
    }

    return NextResponse.json({ 
      success: true, 
      invite,
      // For development, return the invite link
      inviteLink: process.env.NODE_ENV === 'development' ? inviteLink : undefined,
    });
  } catch (error) {
    console.error("Send invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}