import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { getNextPetId } from "@/lib/pet-id";

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
        // Determine pet ID
        let petIdNumber = "";

        if (petData.id && petData.id.trim()) {
          petIdNumber = petData.id.trim();
        } else if (petIdMode === "AUTO") {
          const petCount = await prisma.pet.count({ where: { clinicId } });
          petIdNumber = getNextPetId(petCount, petIdFormat);
        } else {
          errors.push(`Pet "${petData.name}": No ID — skipped`);
          continue;
        }

        // Find or create owner - phone first, then name
        let owner = null;

        if (petData.ownerPhone) {
          owner = await prisma.owner.findFirst({
            where: { clinicId, phone: petData.ownerPhone },
          });
        }

        if (!owner && petData.ownerName) {
          owner = await prisma.owner.findFirst({
            where: { clinicId, name: petData.ownerName },
          });
        }

        if (!owner) {
          const ownerCount = await prisma.owner.count({ where: { clinicId } });
          const ownerIdNumber = `OWN${String(ownerCount + 1).padStart(4, "0")}`;
          owner = await prisma.owner.create({
            data: {
              idNumber: ownerIdNumber,
              name: petData.ownerName || "Unknown",
              phone: petData.ownerPhone || null,
              address: petData.ownerAddress || null,
              clinic: { connect: { id: clinicId } },
            },
          });
        }

        // Create pet — no duplicate check, no format check, just import
        await prisma.pet.create({
          data: {
            idNumber: petIdNumber,
            name: petData.name || "Unknown",
            species: petData.species || "Other",
            breed: petData.breed || null,
            sex: petData.sex || null,
            color: petData.color || null,
            status: "ACTIVE",
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