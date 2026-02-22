import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { idNumber, type } = await request.json();

    if (!idNumber || !type) {
      return NextResponse.json(
        { error: "ID number and type are required" },
        { status: 400 }
      );
    }

    let exists = false;

    if (type === "pet") {
      const pet = await prisma.pet.findUnique({
        where: { idNumber },
      });
      exists = !!pet;
    } else if (type === "owner") {
      const owner = await prisma.owner.findUnique({
        where: { idNumber },
      });
      exists = !!owner;
    }

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Check ID error:", error);
    return NextResponse.json(
      { error: "Failed to check ID" },
      { status: 500 }
    );
  }
}