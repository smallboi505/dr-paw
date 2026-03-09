import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { getNextPetId, validatePetIdFormat } from "@/lib/pet-id";

export async function POST(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { petIdMode: true, petIdFormat: true },
    });

    const petIdMode = clinic?.petIdMode || "MANUAL";
    const petIdFormat = clinic?.petIdFormat || "PET####";

    const body = await request.json();
    const { pets } = body;

    if (!pets || !Array.isArray(pets) || pets.length === 0) {
      return NextResponse.json({ error: "No valid pets data provided" }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    for (const petData of pets) {
      try {
        // Find or create owner - match by phone if available, otherwise by name
        let owner = null;

        if (petData.ownerPhone) {
          owner = await prisma.owner.findFirst({
            where: { clinicId, phone: petData.ownerPhone },
          });
        }

        // If no phone match, try by name
        if (!owner && petData.ownerName) {
          owner = await prisma.owner.findFirst({
            where: { clinicId, name: petData.ownerName },
          });
        }

        // Create owner if still not found
        if (!owner) {
          const ownerCount = await prisma.owner.count({ where: { clinicId } });
          const ownerIdNumber = `OWN${String(ownerCount + 1).padStart(4, '0')}`;

          owner = await prisma.owner.create({
            data: {
              idNumber: ownerIdNumber,
              name: petData.ownerName,
              phone: petData.ownerPhone || null,
              address: petData.ownerAddress || null,
              clinicId,
            },
          });
        }

        // Determine pet ID
        let petIdNumber = "";

        if (petData.id && petData.id.trim()) {
          petIdNumber = petData.id.trim();

          // Only validate format in MANUAL mode
          if (petIdMode === "MANUAL" && !validatePetIdFormat(petIdNumber, petIdFormat)) {
            errors.push(`Pet "${petData.name}": ID "${petIdNumber}" doesn't match format ${petIdFormat}`);
            continue;
          }

          // Check for duplicate - skip instead of error to allow re-imports
          const existingPet = await prisma.pet.findFirst({
            where: { idNumber: petIdNumber, clinicId },
          });

          if (existingPet) {
            errors.push(`Pet "${petData.name}": ID "${petIdNumber}" already exists — skipped`);
            continue;
          }
        } else {
          // No ID provided
          if (petIdMode === "MANUAL") {
            errors.push(`Pet "${petData.name}": ID required in manual mode`);
            continue;
          }

          // Auto-generate
          const petCount = await prisma.pet.count({ where: { clinicId } });
          petIdNumber = getNextPetId(petCount, petIdFormat);
        }

        // Create pet
        await prisma.pet.create({
          data: {
            idNumber: petIdNumber,
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            sex: petData.sex || null,
            color: petData.color || null,
            status: 'ACTIVE',
            ownerId: owner.id,
            clinicId,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Error importing pet ${petData.name}:`, error);
        errors.push(`Failed to import "${petData.name}"`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: pets.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import pets error:", error);
    return NextResponse.json({ error: "Failed to import pets" }, { status: 500 });
  }
}