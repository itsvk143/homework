import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isStudentAssignedToTeacher } from "@/lib/teacherAuth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const requestedTeacherId = searchParams.get("teacherId");

    const where: any = {};

    if (user.role === "TEACHER") {
      if (requestedTeacherId && requestedTeacherId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (studentId) {
        const isAssigned = await isStudentAssignedToTeacher(user.id, studentId);
        if (!isAssigned) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        where.studentId = studentId;
      }
      where.student = {
        assignedTeachersAsStudent: {
          some: {
            teacherId: user.id,
            status: "ACTIVE",
          },
        },
      };
    } else if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "ADMIN") {
      if (studentId) where.studentId = studentId;
      if (requestedTeacherId) where.teacherId = requestedTeacherId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.homeworkAssignment.findMany({
      where,
      include: {
        subject: true,
        book: true,
        chapter: true,
        exercise: true,
        student: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const events = assignments.map((a) => {
      const now = new Date();
      let statusColor = "#3B82F6"; // In progress / assigned
      if (a.exerciseStatus === "COMPLETED") {
        statusColor = "#10B981"; // green
      } else if (a.dueDate < now) {
        statusColor = "#EF4444"; // red overdue
      } else if (a.exerciseStatus === "IN_PROGRESS") {
        statusColor = "#F59E0B"; // amber
      }

      return {
        id: a.id,
        title: `${a.subject.name}: ${a.exercise.name}`,
        subtitle: `${a.book.name} — ${a.questionsCompleted}/${a.totalQuestions} Qs`,
        date: a.dueDate.toISOString().split("T")[0],
        status: a.exerciseStatus,
        homeworkStatus: a.homeworkStatus,
        color: statusColor,
        studentName: a.student.name,
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}
