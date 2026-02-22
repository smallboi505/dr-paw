import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyVets } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, vetId, date, time, reason } = body;

    // Validation
    if (!petId || !vetId || !date || !time || !reason) {
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

    // Check if vet exists
    const vet = await prisma.user.findUnique({
      where: { id: vetId },
    });

    if (!vet) {
      return NextResponse.json(
        { error: "Vet not found" },
        { status: 404 }
      );
    }

    // Check for time slot conflicts
    const appointmentDate = new Date(date);
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId: clinicId,
        vetId: vetId,
        date: appointmentDate,
        time: time,
        status: {
          not: "CANCELED",
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked for the selected vet" },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        petId,
        vetId,
        clinicId: clinicId,
        date: appointmentDate,
        time,
        reason,
        status: "CONFIRMED",
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // CREATE NOTIFICATION FOR THE VET
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedTime = time;

    await createNotification({
      userId: vetId,
      clinicId,
      type: "APPOINTMENT",
      title: "New appointment scheduled",
      message: `${appointment.pet.name} - ${formattedDate} at ${formattedTime}`,
      link: `/appointments`,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}