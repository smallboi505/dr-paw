import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const petCountFilter = searchParams.get("petCount") || "";
    const sortBy = searchParams.get("sortBy") || "name_asc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { clinicId };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { idNumber: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch owners with pet count
    let owners = await prisma.owner.findMany({
      where,
      include: {
        _count: {
          select: { pets: true },
        },
      },
      skip,
      take: limit,
      orderBy: getOrderBy(sortBy),
    });

    // Apply pet count filter (has to be done post-query)
    if (petCountFilter) {
      owners = owners.filter((owner) => {
        const petCount = owner._count.pets;
        switch (petCountFilter) {
          case "0":
            return petCount === 0;
          case "1":
            return petCount === 1;
          case "2-5":
            return petCount >= 2 && petCount <= 5;
          case "6+":
            return petCount >= 6;
          default:
            return true;
        }
      });
    }

    const total = await prisma.owner.count({ where });

    return NextResponse.json({
      owners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Owners list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch owners" },
      { status: 500 }
    );
  }
}

function getOrderBy(sortBy: string) {
  switch (sortBy) {
    case "name_asc":
      return { name: "asc" as const };
    case "name_desc":
      return { name: "desc" as const };
    case "pets_desc":
      return { pets: { _count: "desc" as const } };
    case "newest":
      return { createdAt: "desc" as const };
    case "oldest":
      return { createdAt: "asc" as const };
    default:
      return { name: "asc" as const };
  }
}