import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";

    if (query.length < 2) {
      return NextResponse.json({ pets: [] });
    }

    // Search pets by name or owner name
    const pets = await prisma.pet.findMany({
      where: {
        clinicId,
        status: "ACTIVE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { owner: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error("Search pets error:", error);
    return NextResponse.json(
      { error: "Failed to search pets" },
      { status: 500 }
    );
  }
}