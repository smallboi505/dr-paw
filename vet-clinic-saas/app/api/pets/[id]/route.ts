import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Get current user's clinic
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // SECURITY: Fetch pet AND verify it belongs to this clinic
    const pet = await prisma.pet.findFirst({
      where: { 
        id,
        clinicId, // ← Only return if pet belongs to this clinic
      },
      include: {
        owner: true,
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet not found or access denied" },
        { status: 404 }
      );
    }

    // Get visits for this pet (already filtered by clinic via pet)
    const visits = await prisma.visit.findMany({
      where: { petId: id },
      orderBy: { date: "desc" },
    });

    // Get notes for this pet (already filtered by clinic via pet)
    const notes = await prisma.note.findMany({
      where: { petId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pet, visits, notes });
  } catch (error) {
    console.error("Get pet error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pet" },
      { status: 500 }
    );
  }
}

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
    const { name, species, breed, sex, color, status } = body;

    // Verify pet belongs to clinic
    const existingPet = await prisma.pet.findFirst({
      where: { id, clinicId },
    });

    if (!existingPet) {
      return NextResponse.json(
        { error: "Pet not found or access denied" },
        { status: 404 }
      );
    }

    // Update pet
    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name,
        species,
        breed: breed || null,
        sex,
        color: color || null,
        status,
      },
      include: {
        owner: true,
      },
    });

    return NextResponse.json({ pet: updatedPet });
  } catch (error) {
    console.error("Update pet error:", error);
    return NextResponse.json(
      { error: "Failed to update pet" },
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

    // Verify pet belongs to clinic
    const existingPet = await prisma.pet.findFirst({
      where: { id, clinicId },
    });

    if (!existingPet) {
      return NextResponse.json(
        { error: "Pet not found or access denied" },
        { status: 404 }
      );
    }

    // Delete pet (cascades to visits, notes, appointments via Prisma schema)
    await prisma.pet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Pet deleted successfully" });
  } catch (error) {
    console.error("Delete pet error:", error);
    return NextResponse.json(
      { error: "Failed to delete pet" },
      { status: 500 }
    );
  }
}