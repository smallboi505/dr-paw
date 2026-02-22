import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Build date filter
    let startDate: Date;
    let endDate: Date;

    if (year && month && month !== "All") {
      // Specific month and year
      const monthIndex = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ].indexOf(month);
      
      startDate = new Date(parseInt(year), monthIndex, 1);
      endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);
    } else if (year) {
      // Entire year
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
    } else {
      // All time - use a very old date
      startDate = new Date(2020, 0, 1);
      endDate = new Date();
    }

    // Total Visits
    const totalVisits = await prisma.visit.count({
      where: {
        clinicId: clinicId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // New Pets
    const newPets = await prisma.pet.count({
      where: {
        clinicId: clinicId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Total Appointments
    const totalAppointments = await prisma.appointment.count({
      where: {
        clinicId: clinicId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Visit History by Month (for the year)
    const visitHistory = [];
    const appointmentHistory = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (year && month === "All") {
      // Show all 12 months
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(parseInt(year), i, 1);
        const monthEnd = new Date(parseInt(year), i + 1, 0, 23, 59, 59, 999);

        const visitsCount = await prisma.visit.count({
          where: {
            clinicId: clinicId,
            date: { gte: monthStart, lte: monthEnd },
          },
        });

        const appointmentsCount = await prisma.appointment.count({
          where: {
            clinicId: clinicId,
            date: { gte: monthStart, lte: monthEnd },
          },
        });

        visitHistory.push({ month: months[i], count: visitsCount });
        appointmentHistory.push({ month: months[i], count: appointmentsCount });
      }
    } else if (year && month && month !== "All") {
      // Show days of the specific month
      const monthIndex = months.indexOf(month);
      const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(parseInt(year), monthIndex, day, 0, 0, 0, 0);
        const dayEnd = new Date(parseInt(year), monthIndex, day, 23, 59, 59, 999);

        const visitsCount = await prisma.visit.count({
          where: {
            clinicId: clinicId,
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        const appointmentsCount = await prisma.appointment.count({
          where: {
            clinicId: clinicId,
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        visitHistory.push({ month: `Day ${day}`, count: visitsCount });
        appointmentHistory.push({ month: `Day ${day}`, count: appointmentsCount });
      }
    } else {
      // Show last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const visitsCount = await prisma.visit.count({
          where: {
            clinicId: clinicId,
            date: { gte: monthStart, lte: monthEnd },
          },
        });

        const appointmentsCount = await prisma.appointment.count({
          where: {
            clinicId: clinicId,
            date: { gte: monthStart, lte: monthEnd },
          },
        });

        visitHistory.push({ 
          month: months[date.getMonth()], 
          count: visitsCount 
        });
        appointmentHistory.push({ 
          month: months[date.getMonth()], 
          count: appointmentsCount 
        });
      }
    }

    // Most Common Reasons (from appointments)
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinicId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        reason: true,
      },
    });

    // Count frequency
    const reasonCounts: Record<string, number> = {};
    appointments.forEach((apt) => {
      const reason = apt.reason || "Other";
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Convert to array and sort
    const commonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / appointments.length) * 100) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Pets by Visit Count
    const topPets = await prisma.pet.findMany({
      where: {
        clinicId: clinicId,
      },
      include: {
        visits: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        owner: true,
      },
    });

    const petsWithVisitCounts = topPets
      .map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        visits: pet.visits.length,
        lastVisit: pet.visits.length > 0 
          ? pet.visits.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
          : null,
      }))
      .filter((pet) => pet.visits > 0)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Vet Performance
    const vets = await prisma.user.findMany({
      where: {
        clinicId: clinicId,
        role: "VET",
      },
      include: {
        appointments: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
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
        id: vet.id,
        name: `Dr. ${vet.firstName} ${vet.lastName}`,
        appointments: totalAppointments,
        completionRate,
      };
    });

    return NextResponse.json({
      totalVisits,
      newPets,
      totalAppointments,
      visitHistory,
      appointmentHistory,
      commonReasons,
      topPets: petsWithVisitCounts,
      vetPerformance,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
}