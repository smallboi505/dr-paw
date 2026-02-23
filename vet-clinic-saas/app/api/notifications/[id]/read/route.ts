import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}