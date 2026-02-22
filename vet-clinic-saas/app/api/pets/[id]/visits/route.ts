import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";

// CREATE a new visit
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { date, history, diagnosis, treatment, vetId } = body;
    const params = await context.params;
    const petId = params.id;

    // Validation
    if (!date || !history || !diagnosis || !treatment || !vetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if pet exists
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        date: new Date(date),
        history,
        diagnosis,
        treatment,
        petId,
        vetId,
        clinicId,
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
      },
    });

    // NOTIFY ADMINS ABOUT NEW VISIT
    const visitDate = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    await notifyAdmins(
      clinicId,
      "VISIT",
      "New visit recorded",
      `${visit.pet.name} - ${visitDate}`,
      `/pets/${petId}`
    );

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error("Create visit error:", error);
    return NextResponse.json(
      { error: "Failed to create visit" },
      { status: 500 }
    );
  }
}

// UPDATE an existing visit
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
    const { date, history, diagnosis, treatment } = body;

    // Verify visit belongs to clinic
    const existingVisit = await prisma.visit.findFirst({
      where: { 
        id,
        pet: {
          clinicId,
        },
      },
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: "Visit not found or access denied" },
        { status: 404 }
      );
    }

    // Update visit
    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: {
        date: new Date(date),
        history: history || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
      },
    });

    return NextResponse.json({ visit: updatedVisit });
  } catch (error) {
    console.error("Update visit error:", error);
    return NextResponse.json(
      { error: "Failed to update visit" },
      { status: 500 }
    );
  }
}

// DELETE a visit
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

    // Verify visit belongs to clinic
    const existingVisit = await prisma.visit.findFirst({
      where: { 
        id,
        pet: {
          clinicId,
        },
      },
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: "Visit not found or access denied" },
        { status: 404 }
      );
    }

    // Delete visit
    await prisma.visit.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Visit deleted successfully" 
    });
  } catch (error) {
    console.error("Delete visit error:", error);
    return NextResponse.json(
      { error: "Failed to delete visit" },
      { status: 500 }
    );
  }
}