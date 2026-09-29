import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: { not: "ARCHIVED" },
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { studentProfile: { classGrade: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        studentProfile: true,
        assignedBooksAsStudent: {
          include: {
            book: {
              include: { subject: true },
            },
          },
        },
        _count: {
          select: {
            studentAssignments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
