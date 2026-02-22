import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const species = searchParams.get("species") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // TODO: Add clinicId filter when auth is implemented
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      clinicId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { idNumber: { contains: search } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (species) {
      where.species = species;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.pet.count({ where });

    // Get pets
    const pets = await prisma.pet.findMany({
      where,
      include: {
        owner: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      pets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List pets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pets" },
      { status: 500 }
    );
  }
}