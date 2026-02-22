import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

// Update appointment
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Get current user's clinic
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, date, time, reason, vetId } = body;
    const params = await context.params;
    const id = params.id;

    // SECURITY: Check if appointment exists AND belongs to this clinic
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify appointment belongs to current user's clinic
    if (existingAppointment.clinicId !== clinicId) {
      return NextResponse.json(
        { error: "Unauthorized - Cannot modify appointment from another clinic" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (reason) updateData.reason = reason;
    if (vetId) updateData.vetId = vetId;

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// Delete appointment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Get current user's clinic
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;

    // SECURITY: Check if appointment exists AND belongs to this clinic
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify appointment belongs to current user's clinic
    if (existingAppointment.clinicId !== clinicId) {
      return NextResponse.json(
        { error: "Unauthorized - Cannot delete appointment from another clinic" },
        { status: 403 }
      );
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}