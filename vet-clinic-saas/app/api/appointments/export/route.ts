import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET() {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ALL appointments for export (no pagination)
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
      },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        vet: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { time: "desc" },
      ],
    });

    // Format data for CSV
    const exportData = appointments.map((appointment) => ({
      date: new Date(appointment.date).toLocaleDateString(),
      time: appointment.time,
      petName: appointment.pet.name,
      petSpecies: appointment.pet.species,
      ownerName: appointment.pet.owner.name,
      ownerPhone: appointment.pet.owner.phone,
      vetName: `${appointment.vet.firstName || ""} ${appointment.vet.lastName || ""}`.trim(),
      reason: appointment.reason,
      status: appointment.status,
      createdDate: new Date(appointment.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error("Export appointments error:", error);
    return NextResponse.json(
      { error: "Failed to export appointments" },
      { status: 500 }
    );
  }
}