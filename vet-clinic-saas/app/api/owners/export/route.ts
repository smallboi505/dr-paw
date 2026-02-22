import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET() {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ALL owners for export (no pagination)
    const owners = await prisma.owner.findMany({
      where: {
        clinicId,
      },
      include: {
        _count: {
          select: { pets: true },
        },
        pets: {
          select: {
            name: true,
            species: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format data for CSV
    const exportData = owners.map((owner) => ({
      id: owner.idNumber,
      name: owner.name,
      phone: owner.phone,
      address: owner.address || "",
      totalPets: owner._count.pets,
      petNames: owner.pets.map((p) => p.name).join("; "),
      registeredDate: new Date(owner.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error("Export owners error:", error);
    return NextResponse.json(
      { error: "Failed to export owners" },
      { status: 500 }
    );
  }
}