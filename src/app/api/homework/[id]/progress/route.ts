import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQuestionCount, calculateProgress } from "@/lib/progress";
import { logAuditEvent } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = await getCurrentUser();

    // 1. Fetch authoritative homework assignment
    const assignment = await prisma.homeworkAssignment.findUnique({
      where: { id },
      include: {
        exercise: true,
        student: true,
        teacher: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Homework assignment not found." },
        { status: 404 }
      );
    }

    // 2. Authorization check: if student, must be their own homework
    if (user?.role === "STUDENT" && assignment.studentId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own homework progress." },
        { status: 403 }
      );
    }

    const totalQuestions = assignment.totalQuestions || assignment.exercise.totalQuestions;

    // 3. Handle "completed" shortcut or explicit question count
    let targetQuestionsCompleted = body.questionsCompleted;

    if (body.markCompleted === true) {
      targetQuestionsCompleted = totalQuestions;
    }

    // 4. Validate input strictly on server side
    const validation = validateQuestionCount(targetQuestionsCompleted, totalQuestions);
    if (!validation.valid || validation.count === undefined) {
      return NextResponse.json(
        { error: validation.error || "Questions completed cannot exceed the total number of questions." },
        { status: 400 }
      );
    }

    const safeCount = validation.count;

    // 5. Check system settings for teacher verification
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const requireTeacherVerification = settings?.requireTeacherVerification ?? true;

    // 6. Calculate authoritative progress
    const progressResult = calculateProgress({
      totalQuestions,
      questionsCompleted: safeCount,
      requireTeacherVerification,
    });

    const now = new Date();
    const deltaQuestions = safeCount - assignment.questionsCompleted;

    // 7. Update Homework Assignment
    const isFirstStart = assignment.startedAt === null && safeCount > 0;
    const isCompleted = progressResult.exerciseStatus === "COMPLETED";

    const updatedAssignment = await prisma.homeworkAssignment.update({
      where: { id },
      data: {
        questionsCompleted: progressResult.questionsCompleted,
        progressPercentage: progressResult.progressPercentage,
        exerciseStatus: progressResult.exerciseStatus,
        homeworkStatus: isCompleted
          ? (requireTeacherVerification ? "AWAITING_REVIEW" : "COMPLETED")
          : (safeCount > 0 ? "IN_PROGRESS" : "ASSIGNED"),
        startedAt: isFirstStart ? now : assignment.startedAt,
        completedAt: isCompleted ? now : null,
        lastProgressUpdate: now,
      },
      include: {
        exercise: true,
        subject: true,
        book: true,
        chapter: true,
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 8. Record in HomeworkProgressHistory
    const historyEntry = await prisma.homeworkProgressHistory.create({
      data: {
        homeworkAssignmentId: id,
        studentId: assignment.studentId,
        exerciseId: assignment.exerciseId,
        questionsCompleted: progressResult.questionsCompleted,
        totalQuestions: progressResult.totalQuestions,
        questionsRemaining: progressResult.questionsRemaining,
        progressPercentage: progressResult.progressPercentage,
        deltaQuestions,
        status: progressResult.exerciseStatus,
        notes: body.notes?.trim() || (isCompleted ? "Exercise marked completed" : `Progress updated to ${safeCount}/${totalQuestions}`),
        createdAt: now,
      },
    });

    // 9. Send notifications if notable milestone
    if (isCompleted) {
      await prisma.notification.create({
        data: {
          userId: assignment.teacherId,
          title: "Student Completed Exercise",
          message: `${assignment.student.name} completed ${assignment.exercise.name} (${progressResult.questionsCompleted}/${progressResult.totalQuestions} questions). ${
            requireTeacherVerification ? "Awaiting your verification." : "Marked completed."
          }`,
          type: "PROGRESS_UPDATE",
        },
      });
    }

    // 10. Audit log
    await logAuditEvent({
      userId: user?.id || assignment.studentId,
      action: "UPDATE_HOMEWORK_PROGRESS",
      entityType: "HomeworkAssignment",
      entityId: id,
      metadata: {
        previousCount: assignment.questionsCompleted,
        newCount: safeCount,
        totalQuestions,
        progressPercentage: progressResult.progressPercentage,
        exerciseStatus: progressResult.exerciseStatus,
        homeworkStatus: updatedAssignment.homeworkStatus,
      },
    });

    return NextResponse.json({
      success: true,
      questionsCompleted: progressResult.questionsCompleted,
      totalQuestions: progressResult.totalQuestions,
      questionsRemaining: progressResult.questionsRemaining,
      progressPercentage: progressResult.progressPercentage,
      exerciseStatus: progressResult.exerciseStatus,
      homeworkStatus: updatedAssignment.homeworkStatus,
      assignment: updatedAssignment,
      historyEntry,
    });
  } catch (error) {
    console.error("Error updating homework progress:", error);
    return NextResponse.json(
      { error: "Something went wrong. Your homework progress could not be updated. Please try again." },
      { status: 500 }
    );
  }
}
