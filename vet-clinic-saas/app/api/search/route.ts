import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generousRateLimit, getRateLimitIdentifier, getClientIp } from "@/lib/rate-limit";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // RATE LIMITING - Generous (300 requests per minute) for search
    const identifier = getRateLimitIdentifier(userId || undefined, getClientIp(request));
    const { success } = await generousRateLimit.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ pets: [], owners: [] });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const speciesFilter = searchParams.get("species");
    const dateRange = searchParams.get("dateRange");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ pets: [], owners: [] });
    }

    const searchTerm = query.trim();

    // Build pet where clause
    const petWhere: any = {
      clinicId,
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { idNumber: { contains: searchTerm, mode: "insensitive" } },
        { breed: { contains: searchTerm, mode: "insensitive" } },
      ],
    };

    // Add species filter
    if (speciesFilter) {
      const speciesArray = speciesFilter.split(",");
      petWhere.species = { in: speciesArray };
    }

    // Add date range filter
    if (dateRange) {
      const now = new Date();
      let dateFrom: Date;

      if (dateRange === "week") {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === "month") {
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        dateFrom = new Date(0); // Default to all time
      }

      petWhere.createdAt = { gte: dateFrom };
    }

    // Search Pets
    const pets = await prisma.pet.findMany({
      where: petWhere,
      include: {
        owner: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // Build owner where clause
    const ownerWhere: any = {
      clinicId,
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { idNumber: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ],
    };

    // Add date range for owners
    if (dateRange) {
      const now = new Date();
      let dateFrom: Date;

      if (dateRange === "week") {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === "month") {
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        dateFrom = new Date(0);
      }

      ownerWhere.createdAt = { gte: dateFrom };
    }

    // Search Owners
    const owners = await prisma.owner.findMany({
      where: ownerWhere,
      include: {
        pets: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      pets: pets.map((pet) => ({
        id: pet.id,
        idNumber: pet.idNumber,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        owner: {
          name: pet.owner.name,
          phone: pet.owner.phone,
        },
      })),
      owners: owners.map((owner) => ({
        id: owner.id,
        idNumber: owner.idNumber,
        name: owner.name,
        phone: owner.phone,
        address: owner.address,
        petCount: owner.pets.length,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}