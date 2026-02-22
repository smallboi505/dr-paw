import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ owners: [] });
    }

    const owners = await prisma.owner.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      take: 5, // Limit to 5 results
    });

    return NextResponse.json({ owners });
  } catch (error) {
    console.error("Search owners error:", error);
    return NextResponse.json(
      { error: "Failed to search owners" },
      { status: 500 }
    );
  }
}