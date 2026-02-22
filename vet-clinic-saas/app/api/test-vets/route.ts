import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing database connection...");
    
    // Get ALL users first
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clinicId: true,
      },
    });

    console.log("📊 All users in database:", allUsers);

    // Get vets only
    const vets = await prisma.user.findMany({
      where: {
        role: "VET",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clinicId: true,
      },
    });

    console.log("🩺 All vets:", vets);

    // Get vets with temp-clinic-id
    const clinicVets = await prisma.user.findMany({
      where: {
        clinicId: "temp-clinic-id",
        role: "VET",
      },
    });

    console.log("🏥 Clinic vets:", clinicVets);

    return NextResponse.json({ 
      allUsers,
      vets,
      clinicVets,
      message: "Check your terminal for detailed logs"
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error },
      { status: 500 }
    );
  }
}