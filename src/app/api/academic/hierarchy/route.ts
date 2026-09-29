import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      include: {
        books: {
          where: { status: { not: "ARCHIVED" } },
          orderBy: { displayOrder: "asc" },
          include: {
            chapters: {
              where: { status: { not: "ARCHIVED" } },
              orderBy: { chapterNumber: "asc" },
              include: {
                exercises: {
                  where: { status: { not: "ARCHIVED" } },
                  orderBy: { displayOrder: "asc" },
                  include: {
                    _count: {
                      select: { homeworks: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching academic hierarchy:", error);
    return NextResponse.json({ error: "Failed to fetch hierarchy" }, { status: 500 });
  }
}
