import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const format = searchParams.get("format") || "csv"; // csv or json

    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build date filter
    let startDate: Date;
    let endDate: Date;

    if (year && month && month !== "All") {
      const monthIndex = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ].indexOf(month);
      
      startDate = new Date(parseInt(year), monthIndex, 1);
      endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);
    } else if (year) {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(2020, 0, 1);
      endDate = new Date();
    }

    // Get clinic info for the report
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, location: true, phone: true },
    });

    // Summary Stats
    const totalVisits = await prisma.visit.count({
      where: { clinicId, date: { gte: startDate, lte: endDate } },
    });

    const newPets = await prisma.pet.count({
      where: { clinicId, createdAt: { gte: startDate, lte: endDate } },
    });

    const totalAppointments = await prisma.appointment.count({
      where: { clinicId, date: { gte: startDate, lte: endDate } },
    });

    // Visit & Appointment History
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const visitHistory = [];
    const appointmentHistory = [];

    if (year && month === "All") {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(parseInt(year), i, 1);
        const monthEnd = new Date(parseInt(year), i + 1, 0, 23, 59, 59, 999);

        const visitsCount = await prisma.visit.count({
          where: { clinicId, date: { gte: monthStart, lte: monthEnd } },
        });

        const appointmentsCount = await prisma.appointment.count({
          where: { clinicId, date: { gte: monthStart, lte: monthEnd } },
        });

        visitHistory.push({ period: months[i], visits: visitsCount, appointments: appointmentsCount });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const visitsCount = await prisma.visit.count({
          where: { clinicId, date: { gte: monthStart, lte: monthEnd } },
        });

        const appointmentsCount = await prisma.appointment.count({
          where: { clinicId, date: { gte: monthStart, lte: monthEnd } },
        });

        visitHistory.push({ period: months[date.getMonth()], visits: visitsCount, appointments: appointmentsCount });
      }
    }

    // Most Common Reasons
    const appointments = await prisma.appointment.findMany({
      where: { clinicId, date: { gte: startDate, lte: endDate } },
      select: { reason: true },
    });

    const reasonCounts: Record<string, number> = {};
    appointments.forEach((apt) => {
      const reason = apt.reason || "Other";
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const commonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / appointments.length) * 100) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Pets
    const topPets = await prisma.pet.findMany({
      where: { clinicId },
      include: {
        visits: {
          where: { date: { gte: startDate, lte: endDate } },
        },
      },
    });

    const petsWithVisitCounts = topPets
      .map((pet) => ({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || "N/A",
        visits: pet.visits.length,
        lastVisit: pet.visits.length > 0 
          ? pet.visits.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date.toLocaleDateString()
          : "N/A",
      }))
      .filter((pet) => pet.visits > 0)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20);

    // Vet Performance
    const vets = await prisma.user.findMany({
      where: { clinicId, role: "VET" },
      include: {
        appointments: {
          where: { date: { gte: startDate, lte: endDate } },
        },
      },
    });

    const vetPerformance = vets.map((vet) => {
      const totalAppointments = vet.appointments.length;
      const completedAppointments = vet.appointments.filter(
        (apt) => apt.status === "COMPLETED"
      ).length;
      const completionRate = totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0;

      return {
        name: `Dr. ${vet.firstName || ""} ${vet.lastName || ""}`.trim(),
        totalAppointments,
        completedAppointments,
        completionRate: `${completionRate}%`,
      };
    });

    // Return data
    return NextResponse.json({
      success: true,
      reportInfo: {
        clinicName: clinic?.name || "Dr. Paw Clinic",
        clinicLocation: clinic?.location || "",
        clinicPhone: clinic?.phone || "",
        reportPeriod: month && month !== "All" ? `${month} ${year}` : `Year ${year}`,
        generatedDate: new Date().toLocaleDateString(),
      },
      summary: {
        totalVisits,
        newPets,
        totalAppointments,
      },
      visitHistory,
      commonReasons,
      topPets: petsWithVisitCounts,
      vetPerformance,
    });
  } catch (error) {
    console.error("Export reports error:", error);
    return NextResponse.json(
      { error: "Failed to export reports" },
      { status: 500 }
    );
  }
}