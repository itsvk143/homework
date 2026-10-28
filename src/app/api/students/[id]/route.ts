import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isStudentAssignedToTeacher } from "@/lib/teacherAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    // Role-based authorization
    if (user.role === "TEACHER") {
      const isAssigned = await isStudentAssignedToTeacher(user.id, id);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden. You are not authorized to view this student." },
          { status: 403 }
        );
      }
    } else if (user.role === "STUDENT") {
      if (user.id !== id) {
        return NextResponse.json(
          { error: "Forbidden. You can only view your own student profile." },
          { status: 403 }
        );
      }
    } else if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        assignedTeachersAsStudent: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            teacherId: true,
            subjectId: true,
            teacher: {
              select: { id: true, name: true, teacherProfile: { select: { phone: true } } },
            },
            subject: {
              select: { id: true, name: true, classGrade: true },
            },
          },
        },
        assignedBooksAsStudent: {
          include: {
            book: {
              include: {
                subject: true,
                chapters: {
                  include: {
                    exercises: { select: { id: true } },
                  },
                  orderBy: { chapterNumber: "asc" },
                },
              },
            },
          },
        },
        _count: {
          select: {
            studentAssignments: true,
            assignedTeachersAsStudent: true,
            assignedBooksAsStudent: true,
          },
        },
      },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { student },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch student profile" },
      { status: 500 }
    );
  }
}
