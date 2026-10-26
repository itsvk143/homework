import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newCount: rawNewCount } = body;
    const newCount = parseInt(rawNewCount, 10);

    if (isNaN(newCount) || newCount < 1) {
      return NextResponse.json(
        { error: "Question count must be a positive integer greater than 0." },
        { status: 400 }
      );
    }

    // 1. Fetch exercise with chapter and book
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        chapter: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found." },
        { status: 404 }
      );
    }

    const book = exercise.chapter.book;
    const previousCount = exercise.totalQuestions;

    // 2. Authorization check
    let isAuthorized = false;
    let minLimit = 1;
    let maxLimit = 500;

    // Fetch system default limits
    const settings = await prisma.systemSetting.findFirst();
    if (settings) {
      minLimit = settings.minExerciseQuestions || 1;
      maxLimit = settings.maxExerciseQuestions || 500;
    }

    if (user.role === "ADMIN") {
      isAuthorized = true;
    } else if (user.role === "STUDENT") {
      // Check if student is assigned to this book and has trusted configuration permission
      const studentBook = await prisma.studentBook.findUnique({
        where: {
          studentId_bookId: {
            studentId: user.id,
            bookId: book.id,
          },
        },
      });

      if (studentBook && studentBook.isTrustedForConfig) {
        isAuthorized = true;
        if (studentBook.minQuestions) minLimit = studentBook.minQuestions;
        if (studentBook.maxQuestions) maxLimit = studentBook.maxQuestions;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "Permission denied. You are not authorized to configure question counts for this book. Only administrators or explicitly trusted students can modify exercise configurations.",
        },
        { status: 403 }
      );
    }

    // Validate limits
    if (newCount < minLimit || newCount > maxLimit) {
      return NextResponse.json(
        {
          error: `Question count must be between ${minLimit} and ${maxLimit} questions.`,
        },
        { status: 400 }
      );
    }

    // If identical, return early
    if (newCount === previousCount) {
      return NextResponse.json({
        success: true,
        message: "Question count unchanged.",
        exercise,
        previousCount,
        newCount,
        updatedAssignmentsCount: 0,
      });
    }

    // 3. Update canonical Exercise configuration
    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        totalQuestions: newCount,
      },
    });

    // 4. Update all students assigned to this same book and exercise
    const assignments = await prisma.homeworkAssignment.findMany({
      where: { exerciseId: exercise.id },
    });

    let updatedAssignmentsCount = 0;
    for (const hw of assignments) {
      const qCompleted = hw.questionsCompleted;
      const isCompleted = qCompleted >= newCount;
      const newPct = newCount > 0 ? Math.min(100, Math.round((qCompleted / newCount) * 100)) : 0;
      const newExStatus = isCompleted ? "COMPLETED" : qCompleted > 0 ? "IN_PROGRESS" : "NOT_STARTED";
      const newHwStatus = isCompleted
        ? "COMPLETED"
        : qCompleted > 0
        ? "IN_PROGRESS"
        : hw.homeworkStatus === "COMPLETED"
        ? "IN_PROGRESS"
        : hw.homeworkStatus;

      await prisma.homeworkAssignment.update({
        where: { id: hw.id },
        data: {
          totalQuestions: newCount,
          progressPercentage: newPct,
          exerciseStatus: newExStatus,
          homeworkStatus: newHwStatus,
          lastProgressUpdate: new Date(),
        },
      });
      updatedAssignmentsCount++;
    }

    // 5. Create audit record in ExerciseConfigAudit
    const auditRecord = await prisma.exerciseConfigAudit.create({
      data: {
        exerciseId: exercise.id,
        chapterId: exercise.chapter.id,
        bookId: book.id,
        previousCount,
        newCount,
        changedById: user.id,
        changedByRole: user.role,
        changedByName: user.name || "Trusted User",
        status: "APPLIED",
        note: `Updated question count from ${previousCount} to ${newCount}`,
      },
    });

    // 6. Log system audit event
    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_EXERCISE_QUESTION_COUNT",
      entityType: "Exercise",
      entityId: exercise.id,
      metadata: {
        exerciseName: exercise.name,
        chapterName: exercise.chapter.name,
        bookName: book.name,
        bookId: book.id,
        previousCount,
        newCount,
        affectedAssignments: updatedAssignmentsCount,
        auditId: auditRecord.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${exercise.name} question count to ${newCount}. This canonical change applies to all students assigned to ${book.name}.`,
      exercise: updatedExercise,
      previousCount,
      newCount,
      updatedAssignmentsCount,
      auditId: auditRecord.id,
    });
  } catch (error: any) {
    console.error("Error updating exercise question count:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update exercise question count." },
      { status: 500 }
    );
  }
}
