import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "student"; // "student" | "teacher" | "book"
    const format = searchParams.get("format"); // "json" | "csv"

    if (type === "student") {
      const studentId = searchParams.get("studentId");
      const assignments = await prisma.homeworkAssignment.findMany({
        where: studentId ? { studentId } : {},
        include: {
          student: true,
          subject: true,
          book: true,
          chapter: true,
          exercise: true,
        },
        orderBy: { dueDate: "desc" },
      });

      const rows = assignments.map((a) => {
        const remaining = Math.max(0, a.totalQuestions - a.questionsCompleted);
        return {
          id: a.id,
          studentName: a.student.name,
          studentEmail: a.student.email,
          subject: a.subject.name,
          book: a.book.name,
          chapter: `Ch ${a.chapter.chapterNumber}: ${a.chapter.name}`,
          exercise: a.exercise.name,
          totalQuestions: a.totalQuestions,
          questionsCompleted: a.questionsCompleted,
          questionsRemaining: remaining,
          progressPercentage: `${a.progressPercentage}%`,
          assignedDate: a.assignedDate.toISOString().split("T")[0],
          dueDate: a.dueDate.toISOString().split("T")[0],
          completedDate: a.completedAt ? a.completedAt.toISOString().split("T")[0] : "-",
          exerciseStatus: a.exerciseStatus,
          homeworkStatus: a.homeworkStatus,
        };
      });

      if (format === "csv") {
        const headers = [
          "Student",
          "Subject",
          "Book",
          "Chapter",
          "Exercise",
          "Total Questions",
          "Questions Completed",
          "Questions Remaining",
          "Progress",
          "Assigned Date",
          "Due Date",
          "Completed Date",
          "Status",
        ];
        const csvLines = [headers.join(",")];
        rows.forEach((r) => {
          csvLines.push(
            [
              `"${r.studentName}"`,
              `"${r.subject}"`,
              `"${r.book}"`,
              `"${r.chapter}"`,
              `"${r.exercise}"`,
              r.totalQuestions,
              r.questionsCompleted,
              r.questionsRemaining,
              `"${r.progressPercentage}"`,
              r.assignedDate,
              r.dueDate,
              r.completedDate,
              `"${r.homeworkStatus}"`,
            ].join(",")
          );
        });
        return new NextResponse(csvLines.join("\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="student_homework_report.csv"`,
          },
        });
      }

      return NextResponse.json({ reportType: "student", count: rows.length, data: rows });
    }

    if (type === "teacher") {
      const teachers = await prisma.user.findMany({
        where: { role: "TEACHER" },
        include: {
          teacherAssignments: {
            include: { exercise: true },
          },
        },
      });

      const rows = teachers.map((t) => {
        const total = t.teacherAssignments.length;
        const completed = t.teacherAssignments.filter((a) => a.exerciseStatus === "COMPLETED").length;
        const inProgress = t.teacherAssignments.filter((a) => a.exerciseStatus === "IN_PROGRESS").length;
        const now = new Date();
        const overdue = t.teacherAssignments.filter((a) => a.exerciseStatus !== "COMPLETED" && a.dueDate < now).length;
        const avgCompletion = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: t.id,
          teacherName: t.name,
          email: t.email,
          totalAssignments: total,
          completedCount: completed,
          inProgressCount: inProgress,
          overdueCount: overdue,
          averageCompletion: `${avgCompletion}%`,
        };
      });

      if (format === "csv") {
        const headers = ["Teacher", "Email", "Total Assignments", "Completed", "In Progress", "Overdue", "Avg Completion"];
        const csvLines = [headers.join(",")];
        rows.forEach((r) => {
          csvLines.push([`"${r.teacherName}"`, r.email, r.totalAssignments, r.completedCount, r.inProgressCount, r.overdueCount, `"${r.averageCompletion}"`].join(","));
        });
        return new NextResponse(csvLines.join("\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="teacher_activity_report.csv"`,
          },
        });
      }

      return NextResponse.json({ reportType: "teacher", data: rows });
    }

    if (type === "book") {
      const books = await prisma.book.findMany({
        include: {
          subject: true,
          chapters: {
            include: {
              exercises: {
                include: {
                  homeworks: true,
                },
              },
            },
          },
        },
      });

      const rows = books.map((b) => {
        const totalChapters = b.chapters.length;
        const totalExercises = b.chapters.reduce((sum, ch) => sum + ch.exercises.length, 0);
        let assignedHomeworks = 0;
        let completedHomeworks = 0;

        b.chapters.forEach((ch) => {
          ch.exercises.forEach((ex) => {
            assignedHomeworks += ex.homeworks.length;
            completedHomeworks += ex.homeworks.filter((h) => h.exerciseStatus === "COMPLETED").length;
          });
        });

        const overallProgress = assignedHomeworks > 0 ? Math.round((completedHomeworks / assignedHomeworks) * 100) : 0;

        return {
          id: b.id,
          bookName: b.name,
          subject: b.subject.name,
          totalChapters,
          totalExercises,
          assignedExercisesCount: assignedHomeworks,
          completedExercisesCount: completedHomeworks,
          overallProgress: `${overallProgress}%`,
        };
      });

      if (format === "csv") {
        const headers = ["Book", "Subject", "Total Chapters", "Total Exercises", "Assigned Exercises", "Completed Exercises", "Overall Progress"];
        const csvLines = [headers.join(",")];
        rows.forEach((r) => {
          csvLines.push([`"${r.bookName}"`, `"${r.subject}"`, r.totalChapters, r.totalExercises, r.assignedExercisesCount, r.completedExercisesCount, `"${r.overallProgress}"`].join(","));
        });
        return new NextResponse(csvLines.join("\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="book_coverage_report.csv"`,
          },
        });
      }

      return NextResponse.json({ reportType: "book", data: rows });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
