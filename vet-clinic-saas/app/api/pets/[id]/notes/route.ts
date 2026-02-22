import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Create a new note
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { title, content } = body;
    const params = await context.params;
    const petId = params.id;

    // Validation
    if (!title || !content) {
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

    // Create note
    const note = await prisma.note.create({
      data: {
        title,
        content,
        petId,
        clinicId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}