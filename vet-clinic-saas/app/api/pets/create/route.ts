import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { getNextPetId, validatePetIdFormat } from "@/lib/pet-id";
import { notifyAdmins } from "@/lib/notifications";
import { standardRateLimit, getRateLimitIdentifier, getClientIp } from "@/lib/rate-limit";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // RATE LIMITING - Standard (60 requests per minute)
    const identifier = getRateLimitIdentifier(userId || undefined, getClientIp(request));
    const { success, limit, remaining } = await standardRateLimit.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { petData, ownerData, ownerId, petIdNumber } = body;

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Get clinic settings
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { petIdMode: true, petIdFormat: true },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const petIdMode = clinic.petIdMode || "MANUAL";
    const petIdFormat = clinic.petIdFormat || "PET####";

    // Validate required fields
    if (!petData.name || !petData.species || !petData.sex) {
      return NextResponse.json(
        { error: "Missing required pet fields" },
        { status: 400 }
      );
    }

    let finalOwnerId = ownerId;
    let baseIdNumber = "";

    // If creating new owner
    if (!ownerId && ownerData) {
      if (!ownerData.name || !ownerData.phone) {
        return NextResponse.json(
          { error: "Missing required owner fields" },
          { status: 400 }
        );
      }

      // Generate or validate owner ID
      if (petIdMode === "AUTO") {
        // Auto-generate owner ID
        const ownerCount = await prisma.owner.count({ where: { clinicId } });
        baseIdNumber = getNextPetId(ownerCount, petIdFormat);
      } else {
        // Manual mode - use provided ID
        if (!ownerData.idNumber) {
          return NextResponse.json(
            { error: "Owner ID required in manual mode" },
            { status: 400 }
          );
        }

        // Validate format
        if (!validatePetIdFormat(ownerData.idNumber, petIdFormat)) {
          return NextResponse.json(
            { error: `Owner ID must match format: ${petIdFormat}` },
            { status: 400 }
          );
        }

        baseIdNumber = ownerData.idNumber;

        // Check if owner ID already exists
        const existingOwner = await prisma.owner.findUnique({
          where: { idNumber: baseIdNumber },
        });

        if (existingOwner) {
          return NextResponse.json(
            { error: "Owner ID already exists" },
            { status: 409 }
          );
        }
      }

      // Create new owner
      const newOwner = await prisma.owner.create({
        data: {
          idNumber: baseIdNumber,
          name: ownerData.name,
          phone: ownerData.phone,
          address: ownerData.address || null,
          clinicId,
        },
      });

      finalOwnerId = newOwner.id;
    } else if (ownerId) {
      // Get existing owner's ID number
      const owner = await prisma.owner.findUnique({
        where: { id: ownerId },
      });

      if (!owner) {
        return NextResponse.json(
          { error: "Owner not found" },
          { status: 404 }
        );
      }

      baseIdNumber = owner.idNumber;
    }

    if (!finalOwnerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Generate smart pet ID
    // Check how many pets this owner already has
    const existingPetsCount = await prisma.pet.count({
      where: { ownerId: finalOwnerId },
    });

    let finalPetIdNumber = "";

    if (petIdMode === "AUTO") {
      // Auto mode - generate sequential ID across clinic
      const clinicPetCount = await prisma.pet.count({ where: { clinicId } });
      finalPetIdNumber = getNextPetId(clinicPetCount, petIdFormat);
      
    } else {
      // Manual mode - use owner's base ID with suffix
      if (existingPetsCount === 0) {
        // First pet - use base ID only
        finalPetIdNumber = baseIdNumber;
      } else {
        // Second pet onwards - add suffix
        finalPetIdNumber = `${baseIdNumber}-${existingPetsCount + 1}`;
      }

      // Validate the generated ID matches format (for first pet)
      if (existingPetsCount === 0 && !validatePetIdFormat(finalPetIdNumber, petIdFormat)) {
        return NextResponse.json(
          { error: `Pet ID ${finalPetIdNumber} doesn't match format: ${petIdFormat}` },
          { status: 400 }
        );
      }
    }

    // Check if this exact pet ID already exists
    const existingPet = await prisma.pet.findUnique({
      where: { idNumber: finalPetIdNumber },
    });

    if (existingPet) {
      return NextResponse.json(
        { error: `Pet ID ${finalPetIdNumber} already exists` },
        { status: 409 }
      );
    }

    // Create pet
    const pet = await prisma.pet.create({
      data: {
        idNumber: finalPetIdNumber,
        name: petData.name,
        species: petData.species,
        breed: petData.breed || null,
        sex: petData.sex,
        color: petData.color || null,
        status: 'ACTIVE',
        ownerId: finalOwnerId,
        clinicId,
      },
      include: {
        owner: true,
      },
    });

    // NOTIFY ADMINS ABOUT NEW PET
    await notifyAdmins(
      clinicId,
      "PET",
      "New pet registered",
      `${pet.name} (${pet.species}) - Owner: ${pet.owner.name}`,
      `/pets/${pet.id}`
    );

    return NextResponse.json({ success: true, pet }, { status: 201 });
  } catch (error) {
    console.error("Create pet error:", error);
    return NextResponse.json(
      { error: "Failed to create pet" },
      { status: 500 }
    );
  }
}