import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get clinic ID ONCE at the top
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Total Pets - USE clinicId NOT TEMP_CLINIC_ID
    const totalPets = await prisma.pet.count({
      where: {
        clinicId, // ← FIXED
        status: "ACTIVE",
      },
    });

    // Appointments Today - USE clinicId
    const appointmentsToday = await prisma.appointment.count({
      where: {
        clinicId, // ← FIXED
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Upcoming Reminders (mock for now)
    const upcomingReminders = 3;

    // Total Visits This Week - USE clinicId
    const totalVisitsThisWeek = await prisma.visit.count({
      where: {
        clinicId, // ← FIXED
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // This Week's Appointments - USE clinicId
    const thisWeeksAppointments = await prisma.appointment.findMany({
      where: {
        clinicId, // ← FIXED
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { time: "asc" },
      ],
    });

    // Visit History by Day
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const visitHistory = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const visitsCount = await prisma.visit.count({
        where: {
          clinicId, // ← FIXED (use variable, not function call)
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      visitHistory.push({
        day: days[i],
        visits: visitsCount,
      });
    }

    return NextResponse.json({
      totalPets,
      appointmentsToday,
      upcomingReminders,
      totalVisitsThisWeek,
      thisWeeksAppointments,
      visitHistory,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
