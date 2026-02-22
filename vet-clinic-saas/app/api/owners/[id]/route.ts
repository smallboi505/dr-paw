import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, phone, address } = body;

    // Verify owner belongs to clinic
    const existingOwner = await prisma.owner.findFirst({
      where: { id, clinicId },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { error: "Owner not found or access denied" },
        { status: 404 }
      );
    }

    // Update owner
    const updatedOwner = await prisma.owner.update({
      where: { id },
      data: {
        name,
        phone,
        address: address || null,
      },
      include: {
        _count: {
          select: { pets: true },
        },
      },
    });

    return NextResponse.json({ owner: updatedOwner });
  } catch (error) {
    console.error("Update owner error:", error);
    return NextResponse.json(
      { error: "Failed to update owner" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify owner belongs to clinic
    const existingOwner = await prisma.owner.findFirst({
      where: { id, clinicId },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { error: "Owner not found or access denied" },
        { status: 404 }
      );
    }

    // Delete owner (cascades to pets, and pets cascade to visits/notes/appointments)
    await prisma.owner.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Owner and all associated pets deleted successfully" 
    });
  } catch (error) {
    console.error("Delete owner error:", error);
    return NextResponse.json(
      { error: "Failed to delete owner" },
      { status: 500 }
    );
  }
}