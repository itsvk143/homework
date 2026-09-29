import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Teacher or Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { assignmentId, questionsCompleted, reason } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });
    }

    if (questionsCompleted === undefined || questionsCompleted === null || typeof questionsCompleted !== "number") {
      return NextResponse.json({ error: "Invalid questions completed count" }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: "An administrative override reason (min 5 characters) is mandatory." }, { status: 400 });
    }

    const assignment = await prisma.homeworkAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: true,
        exercise: true,
        chapter: true,
        book: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Homework assignment not found" }, { status: 404 });
    }

    if (questionsCompleted < 0 || questionsCompleted > assignment.totalQuestions) {
      return NextResponse.json(
        { error: `Questions completed must be between 0 and ${assignment.totalQuestions}.` },
        { status: 400 }
      );
    }

    const previousCount = assignment.questionsCompleted;
    const delta = questionsCompleted - previousCount;
    const pct = Math.round((questionsCompleted / assignment.totalQuestions) * 100);

    let exStatus = "NOT_STARTED";
    let hwStatus = assignment.homeworkStatus;

    if (questionsCompleted >= assignment.totalQuestions) {
      exStatus = "COMPLETED";
      hwStatus = "COMPLETED";
    } else if (questionsCompleted > 0) {
      exStatus = "IN_PROGRESS";
      if (hwStatus === "ASSIGNED" || hwStatus === "NOT_STARTED") {
        hwStatus = "IN_PROGRESS";
      }
    } else {
      exStatus = "NOT_STARTED";
    }

    const now = new Date();

    // Update assignment
    const updatedAssignment = await prisma.homeworkAssignment.update({
      where: { id: assignment.id },
      data: {
        questionsCompleted,
        progressPercentage: pct,
        exerciseStatus: exStatus,
        homeworkStatus: hwStatus,
        lastProgressUpdate: now,
        startedAt: assignment.startedAt || (questionsCompleted > 0 ? now : null),
        completedAt: questionsCompleted >= assignment.totalQuestions ? now : null,
      },
    });

    // Record Progress History
    await prisma.homeworkProgressHistory.create({
      data: {
        homeworkAssignmentId: assignment.id,
        studentId: assignment.studentId,
        exerciseId: assignment.exerciseId,
        questionsCompleted,
        totalQuestions: assignment.totalQuestions,
        questionsRemaining: assignment.totalQuestions - questionsCompleted,
        progressPercentage: pct,
        deltaQuestions: delta,
        status: exStatus,
        notes: `[Teacher Override by ${user.name}] Reason: ${reason.trim()}`,
      },
    });

    // Write to Audit Log (Section 147)
    await logAuditEvent({
      userId: user.id,
      action: "TEACHER_PROGRESS_OVERRIDE",
      entityType: "HomeworkAssignment",
      entityId: assignment.id,
      metadata: {
        teacherId: user.id,
        teacherName: user.name,
        studentId: assignment.studentId,
        studentName: assignment.student.name,
        bookName: assignment.book.name,
        chapterName: assignment.chapter.name,
        exerciseName: assignment.exercise.name,
        previousQuestions: previousCount,
        newQuestions: questionsCompleted,
        totalQuestions: assignment.totalQuestions,
        reason: reason.trim(),
        timestamp: now.toISOString(),
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: assignment.studentId,
        title: "Homework Progress Adjusted by Teacher",
        message: `${user.name} adjusted your progress on ${assignment.exercise.name} (${assignment.chapter.name}) to ${questionsCompleted}/${assignment.totalQuestions} questions. Reason: ${reason.trim()}`,
        type: "PROGRESS_UPDATE",
        link: `/`,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: `Progress successfully overridden to ${questionsCompleted}/${assignment.totalQuestions} (${pct}%). Audit record created.`,
    });
  } catch (err: any) {
    console.error("POST /api/teacher/chapter-progress/override error:", err);
    return NextResponse.json(
      { error: "Failed to apply teacher override", details: err.message },
      { status: 500 }
    );
  }
}
