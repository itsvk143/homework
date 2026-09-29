import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        status: { not: "ARCHIVED" },
      },
      include: {
        teacherProfile: true,
        _count: {
          select: {
            teacherAssignments: true,
            assignedBooksAsTeacher: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
