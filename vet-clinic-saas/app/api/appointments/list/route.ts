import { NextRequest, NextResponse } from "next/server";
import { getCurrentClinicId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const date = searchParams.get("date") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      clinicId,
    };

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Date filter
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Search filter (pet name, owner name, reason)
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { pet: { name: { contains: search, mode: "insensitive" } } },
        { pet: { owner: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments with relations
    const appointments = await prisma.appointment.findMany({
      where,
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
      orderBy: [
        { date: "asc" },
        { time: "asc" },
      ],
      skip,
      take: limit,
    });

    // Get stats for today
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await prisma.appointment.count({
      where: {
        clinicId: clinicId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const canceledCount = await prisma.appointment.count({
      where: {
        clinicId: clinicId,
        status: "CANCELED",
      },
    });

    const totalCount = await prisma.appointment.count({
      where: {
        clinicId: clinicId,
      },
    });

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        today: todayCount,
        canceled: canceledCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("List appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}