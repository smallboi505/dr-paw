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

    // Get clinic to access petIdMode and petIdFormat
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { petIdMode: true, petIdFormat: true },
    });

    const petIdMode = clinic?.petIdMode || "MANUAL";
    const petIdFormat = clinic?.petIdFormat || "PET####";

    const body = await request.json();
    const { pets } = body;

    if (!pets || !Array.isArray(pets) || pets.length === 0) {
      return NextResponse.json(
        { error: "No valid pets data provided" },
        { status: 400 }
      );
    }

    let imported = 0;
    const errors: string[] = [];

    // Process each pet
    for (const petData of pets) {
      try {
        // Find or create owner
        let owner = await prisma.owner.findFirst({
          where: {
            clinicId,
            phone: petData.ownerPhone,
          },
        });

        if (!owner) {
          // Generate owner ID number
          const ownerCount = await prisma.owner.count({ where: { clinicId } });
          const ownerIdNumber = `OWN${String(ownerCount + 1).padStart(4, '0')}`;

          owner = await prisma.owner.create({
            data: {
              idNumber: ownerIdNumber,
              name: petData.ownerName,
              phone: petData.ownerPhone,
              address: petData.ownerAddress || null,
              clinicId,
            },
          });
        }

        // Generate pet ID number (use provided ID or auto-generate)
        const petCount = await prisma.pet.count({ where: { clinicId } });
        let petIdNumber = "";
        
        if (petData.id && petData.id.trim()) {
          // ID provided in CSV
          petIdNumber = petData.id.trim();
          
          // Validate format
          if (!validatePetIdFormat(petIdNumber, petIdFormat)) {
            errors.push(`Pet "${petData.name}": ID "${petIdNumber}" doesn't match format ${petIdFormat}`);
            continue;
          }
          
          // Check if already exists
          const existingPet = await prisma.pet.findUnique({
            where: { idNumber: petIdNumber },
          });
          
          if (existingPet) {
            errors.push(`Pet "${petData.name}": ID "${petIdNumber}" already exists`);
            continue;
          }
        } else {
          // No ID provided
          if (petIdMode === "MANUAL") {
            errors.push(`Pet "${petData.name}": ID required in manual mode`);
            continue;
          }
          
          // Auto-generate ID
          petIdNumber = getNextPetId(petCount, petIdFormat);
        }

        // Create pet
        await prisma.pet.create({
          data: {
            idNumber: petIdNumber,
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            sex: petData.sex,
            color: petData.color || null,
            status: 'ACTIVE',
            ownerId: owner.id,
            clinicId,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Error importing pet ${petData.name}:`, error);
        errors.push(`Failed to import ${petData.name}`);
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
    return NextResponse.json(
      { error: "Failed to import pets" },
      { status: 500 }
    );
  }
}