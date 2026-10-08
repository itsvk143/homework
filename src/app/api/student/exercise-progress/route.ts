import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      exerciseId,
      chapterId,
      bookId,
      studentId: reqStudentId,
      markCompleted,
      exerciseStatus,
      questionsCompleted: reqQuestionsCompleted,
      notes,
      action, // "COMPLETE_CHAPTER" | "RESET_CHAPTER"
    } = body;

    // Student can only update their own progress unless teacher/admin
    const studentId = user.role === "STUDENT" ? user.id : reqStudentId || user.id;

    // ==============================================================
    // ACTION: BATCH CHAPTER PROGRESS (Mark Whole Chapter Completed or Reset)
    // ==============================================================
    if (action === "COMPLETE_CHAPTER" || action === "RESET_CHAPTER") {
      if (!chapterId) {
        return NextResponse.json({ error: "chapterId is required for chapter action" }, { status: 400 });
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: { include: { subject: true } },
          exercises: { where: { status: { not: "ARCHIVED" } }, orderBy: { displayOrder: "asc" } },
        },
      });

      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }

      // Resolve teacher
      const studentBook = await prisma.studentBook.findFirst({
        where: { studentId, bookId: chapter.bookId },
      });
      let teacherId = studentBook?.assignedByTeacherId;
      if (!teacherId) {
        const tsa = await prisma.teacherStudentAssignment.findFirst({
          where: { studentId, subjectId: chapter.book.subjectId, status: "ACTIVE" },
        });
        teacherId = tsa?.teacherId;
      }
      if (!teacherId) {
        const anyTeacher = await prisma.user.findFirst({ where: { role: { in: ["TEACHER", "ADMIN"] } } });
        teacherId = anyTeacher?.id || user.id;
      }

      const isCompletedAction = action === "COMPLETE_CHAPTER";
      const updatedAssignments = [];

      for (const ex of chapter.exercises) {
        const totalQ = ex.totalQuestions || 10;
        const qCompleted = isCompletedAction ? totalQ : 0;
        const status = isCompletedAction ? "COMPLETED" : "NOT_STARTED";
        const hwStatus = isCompletedAction ? "COMPLETED" : "ASSIGNED";

        const existingHw = await prisma.homeworkAssignment.findFirst({
          where: { studentId, exerciseId: ex.id },
        });

        let savedHw;
        if (existingHw) {
          savedHw = await prisma.homeworkAssignment.update({
            where: { id: existingHw.id },
            data: {
              questionsCompleted: qCompleted,
              totalQuestions: totalQ,
              progressPercentage: isCompletedAction ? 100 : 0,
              exerciseStatus: status,
              homeworkStatus: hwStatus,
              startedAt: isCompletedAction ? existingHw.startedAt || new Date() : null,
              completedAt: isCompletedAction ? new Date() : null,
              lastProgressUpdate: new Date(),
            },
            include: {
              exercise: true,
              chapter: true,
              book: true,
              subject: true,
            },
          });
        } else {
          savedHw = await prisma.homeworkAssignment.create({
            data: {
              studentId,
              teacherId,
              subjectId: chapter.book.subjectId,
              bookId: chapter.bookId,
              chapterId: chapter.id,
              exerciseId: ex.id,
              dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
              totalQuestions: totalQ,
              questionsCompleted: qCompleted,
              progressPercentage: isCompletedAction ? 100 : 0,
              exerciseStatus: status,
              homeworkStatus: hwStatus,
              startedAt: isCompletedAction ? new Date() : null,
              completedAt: isCompletedAction ? new Date() : null,
              lastProgressUpdate: new Date(),
              instructions: `Solve ${ex.name} from ${chapter.book.name}`,
            },
            include: {
              exercise: true,
              chapter: true,
              book: true,
              subject: true,
            },
          });
        }

        await prisma.homeworkProgressHistory.create({
          data: {
            homeworkAssignmentId: savedHw.id,
            studentId,
            exerciseId: ex.id,
            questionsCompleted: qCompleted,
            totalQuestions: totalQ,
            questionsRemaining: totalQ - qCompleted,
            progressPercentage: isCompletedAction ? 100 : 0,
            deltaQuestions: qCompleted,
            status,
            notes: isCompletedAction ? "Chapter marked as completed" : "Chapter reset to not started",
          },
        });

        updatedAssignments.push(savedHw);
      }

      await logAuditEvent({
        userId: user.id,
        action: isCompletedAction ? "COMPLETE_CHAPTER" : "RESET_CHAPTER",
        entityType: "Chapter",
        entityId: chapter.id,
        metadata: { studentId, exerciseCount: chapter.exercises.length },
      });

      return NextResponse.json({
        success: true,
        action,
        chapterId: chapter.id,
        updatedAssignments,
      });
    }

    // ==============================================================
    // ACTION: SINGLE EXERCISE PROGRESS UPDATE
    // ==============================================================
    if (!exerciseId) {
      return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        chapter: {
          include: {
            book: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const totalQuestions = exercise.totalQuestions || 10;
    let questionsCompleted = 0;

    if (markCompleted === true || exerciseStatus === "COMPLETED") {
      questionsCompleted = totalQuestions;
    } else if (exerciseStatus === "NOT_STARTED") {
      questionsCompleted = 0;
    } else if (reqQuestionsCompleted !== undefined) {
      const parsed = parseInt(String(reqQuestionsCompleted), 10);
      questionsCompleted = isNaN(parsed) ? 0 : Math.min(totalQuestions, Math.max(0, parsed));
    }

    // Determine authoritative status
    let authoritativeStatus = "NOT_STARTED";
    if (questionsCompleted >= totalQuestions) {
      authoritativeStatus = "COMPLETED";
      questionsCompleted = totalQuestions;
    } else if (questionsCompleted > 0) {
      authoritativeStatus = "IN_PROGRESS";
    }

    const progressPercentage = Math.round((questionsCompleted / totalQuestions) * 100);

    // Resolve teacher
    const studentBook = await prisma.studentBook.findFirst({
      where: { studentId, bookId: exercise.chapter.bookId },
    });
    let teacherId = studentBook?.assignedByTeacherId;
    if (!teacherId) {
      const tsa = await prisma.teacherStudentAssignment.findFirst({
        where: { studentId, subjectId: exercise.chapter.book.subjectId, status: "ACTIVE" },
      });
      teacherId = tsa?.teacherId;
    }
    if (!teacherId) {
      const anyTeacher = await prisma.user.findFirst({ where: { role: { in: ["TEACHER", "ADMIN"] } } });
      teacherId = anyTeacher?.id || user.id;
    }

    // Check existing homework assignment
    const existing = await prisma.homeworkAssignment.findFirst({
      where: { studentId, exerciseId: exercise.id },
    });

    let savedAssignment;
    const now = new Date();

    if (existing) {
      savedAssignment = await prisma.homeworkAssignment.update({
        where: { id: existing.id },
        data: {
          questionsCompleted,
          totalQuestions,
          progressPercentage,
          exerciseStatus: authoritativeStatus,
          homeworkStatus: authoritativeStatus === "COMPLETED" ? "COMPLETED" : (questionsCompleted > 0 ? "IN_PROGRESS" : "ASSIGNED"),
          startedAt: existing.startedAt || (questionsCompleted > 0 ? now : null),
          completedAt: authoritativeStatus === "COMPLETED" ? now : null,
          lastProgressUpdate: now,
        },
        include: {
          exercise: true,
          chapter: true,
          book: true,
          subject: true,
        },
      });
    } else {
      savedAssignment = await prisma.homeworkAssignment.create({
        data: {
          studentId,
          teacherId,
          subjectId: exercise.chapter.book.subjectId,
          bookId: exercise.chapter.bookId,
          chapterId: exercise.chapterId,
          exerciseId: exercise.id,
          dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          totalQuestions,
          questionsCompleted,
          progressPercentage,
          exerciseStatus: authoritativeStatus,
          homeworkStatus: authoritativeStatus === "COMPLETED" ? "COMPLETED" : (questionsCompleted > 0 ? "IN_PROGRESS" : "ASSIGNED"),
          startedAt: questionsCompleted > 0 ? now : null,
          completedAt: authoritativeStatus === "COMPLETED" ? now : null,
          lastProgressUpdate: now,
          instructions: `Solve ${exercise.name} from ${exercise.chapter.book.name}.`,
        },
        include: {
          exercise: true,
          chapter: true,
          book: true,
          subject: true,
        },
      });
    }

    // Record history
    await prisma.homeworkProgressHistory.create({
      data: {
        homeworkAssignmentId: savedAssignment.id,
        studentId,
        exerciseId: exercise.id,
        questionsCompleted,
        totalQuestions,
        questionsRemaining: totalQuestions - questionsCompleted,
        progressPercentage,
        deltaQuestions: questionsCompleted - (existing?.questionsCompleted || 0),
        status: authoritativeStatus,
        notes: notes || (authoritativeStatus === "COMPLETED" ? "Marked completed" : `Questions completed: ${questionsCompleted}/${totalQuestions}`),
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_EXERCISE_PROGRESS",
      entityType: "HomeworkAssignment",
      entityId: savedAssignment.id,
      metadata: { studentId, exerciseId: exercise.id, questionsCompleted, status: authoritativeStatus },
    });

    return NextResponse.json({
      success: true,
      assignment: savedAssignment,
    });
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    return NextResponse.json({ error: "Failed to update exercise progress" }, { status: 500 });
  }
}
