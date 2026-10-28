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

    const assignment = await prisma.homeworkAssignment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            studentProfile: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: true,
          },
        },
        subject: true,
        book: true,
        chapter: true,
        exercise: true,
        progressHistory: {
          orderBy: { createdAt: "desc" },
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
          include: { attachments: true },
        },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Homework assignment not found" }, { status: 404 });
    }

    // Role-based authorization
    if (user.role === "TEACHER") {
      const isAssigned = await isStudentAssignedToTeacher(user.id, assignment.studentId);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden. You are not authorized to view this student's homework." },
          { status: 403 }
        );
      }
    } else if (user.role === "STUDENT") {
      if (user.id !== assignment.studentId) {
        return NextResponse.json(
          { error: "Forbidden. You can only view your own homework." },
          { status: 403 }
        );
      }
    } else if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { assignment },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}
