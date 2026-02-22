import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointments } = body;

    if (!appointments || !Array.isArray(appointments)) {
      return NextResponse.json(
        { error: "Invalid request: appointments array required" },
        { status: 400 }
      );
    }

    let imported = 0;
    const errors: string[] = [];

    for (const appointmentData of appointments) {
      try {
        const { petName, ownerName, date, time, reason, status } = appointmentData;

        // Find pet by name AND owner name (unique combination)
        const pet = await prisma.pet.findFirst({
          where: {
            name: petName,
            clinicId,
            owner: {
              name: ownerName,
            },
          },
          include: {
            owner: true,
          },
        });

        if (!pet) {
          errors.push(`Pet "${petName}" with owner "${ownerName}" not found`);
          continue;
        }

        // Parse date
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
          errors.push(`Invalid date for pet "${petName}"`);
          continue;
        }

        // Get current user as the vet
        const vet = await prisma.user.findFirst({
          where: {
            clinicId,
          },
        });

        if (!vet) {
          errors.push(`No vet found in clinic`);
          continue;
        }

        // Create appointment
        await prisma.appointment.create({
          data: {
            petId: pet.id,
            vetId: vet.id,
            date: appointmentDate,
            time: time,
            reason,
            status: status ? status.toUpperCase() : 'SCHEDULED',
            clinicId,
          },
        });

        imported++;
      } catch (error) {
        console.error("Error importing appointment:", error);
        errors.push(`Failed to import row: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: appointments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import appointments error:", error);
    return NextResponse.json(
      { error: "Failed to import appointments" },
      { status: 500 }
    );
  }
}