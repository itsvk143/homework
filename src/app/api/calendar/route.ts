import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;

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
