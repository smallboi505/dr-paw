import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET() {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ALL pets for export (no pagination)
    const pets = await prisma.pet.findMany({
      where: {
        clinicId,
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            address: true,
            idNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format data for CSV
    const exportData = pets.map((pet) => ({
      id: pet.idNumber,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      sex: pet.sex,
      color: pet.color || "",
      status: pet.status,
      ownerName: pet.owner.name,
      ownerPhone: pet.owner.phone,
      ownerAddress: pet.owner.address || "",
      ownerIdNumber: pet.owner.idNumber,
      registeredDate: new Date(pet.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error("Export pets error:", error);
    return NextResponse.json(
      { error: "Failed to export pets" },
      { status: 500 }
    );
  }
}