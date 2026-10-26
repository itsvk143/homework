import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const bookId = searchParams.get("bookId");

    const audits = await prisma.exerciseConfigAudit.findMany({
      where: {
        ...(bookId ? { bookId } : {}),
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            exerciseNumber: true,
            totalQuestions: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            chapterNumber: true,
          },
        },
        book: {
          select: {
            id: true,
            name: true,
            bookCode: true,
            subject: {
              select: { name: true, color: true },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({
      audits,
      totalCount: audits.length,
    });
  } catch (error: any) {
    console.error("Error fetching exercise config audit log:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch audit log." },
      { status: 500 }
    );
  }
}

// RESTORE PREVIOUS CONFIGURATION
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json({ error: "auditId is required." }, { status: 400 });
    }

    const auditRecord = await prisma.exerciseConfigAudit.findUnique({
      where: { id: auditId },
      include: {
        exercise: true,
        chapter: true,
        book: true,
      },
    });

    if (!auditRecord) {
      return NextResponse.json({ error: "Audit record not found." }, { status: 404 });
    }

    const targetRestoreCount = auditRecord.previousCount;
    const currentCount = auditRecord.exercise.totalQuestions;

    // 1. Revert Exercise.totalQuestions
    const restoredExercise = await prisma.exercise.update({
      where: { id: auditRecord.exerciseId },
      data: {
        totalQuestions: targetRestoreCount,
      },
    });

    // 2. Revert HomeworkAssignments for this exercise
    const assignments = await prisma.homeworkAssignment.findMany({
      where: { exerciseId: auditRecord.exerciseId },
    });

    for (const hw of assignments) {
      const qCompleted = hw.questionsCompleted;
      const isCompleted = qCompleted >= targetRestoreCount;
      const newPct = targetRestoreCount > 0 ? Math.min(100, Math.round((qCompleted / targetRestoreCount) * 100)) : 0;
      const newExStatus = isCompleted ? "COMPLETED" : qCompleted > 0 ? "IN_PROGRESS" : "NOT_STARTED";
      const newHwStatus = isCompleted ? "COMPLETED" : qCompleted > 0 ? "IN_PROGRESS" : "ASSIGNED";

      await prisma.homeworkAssignment.update({
        where: { id: hw.id },
        data: {
          totalQuestions: targetRestoreCount,
          progressPercentage: newPct,
          exerciseStatus: newExStatus,
          homeworkStatus: newHwStatus,
          lastProgressUpdate: new Date(),
        },
      });
    }

    // 3. Update the audit record status to REVERTED
    await prisma.exerciseConfigAudit.update({
      where: { id: auditId },
      data: {
        status: "REVERTED",
        revertedAt: new Date(),
        revertedById: user.id,
      },
    });

    // 4. Create new audit entry for the restoration
    await prisma.exerciseConfigAudit.create({
      data: {
        exerciseId: auditRecord.exerciseId,
        chapterId: auditRecord.chapterId,
        bookId: auditRecord.bookId,
        previousCount: currentCount,
        newCount: targetRestoreCount,
        changedById: user.id,
        changedByRole: "ADMIN",
        changedByName: user.name || "Administrator",
        status: "APPLIED",
        note: `Restored configuration to previous state (Audit #${auditId.slice(-6)})`,
      },
    });

    // 5. System audit log
    await logAuditEvent({
      userId: user.id,
      action: "RESTORE_EXERCISE_QUESTION_COUNT",
      entityType: "Exercise",
      entityId: auditRecord.exerciseId,
      metadata: {
        restoredFromAuditId: auditId,
        exerciseName: auditRecord.exercise.name,
        bookName: auditRecord.book.name,
        restoredCount: targetRestoreCount,
        previousCount: currentCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${auditRecord.exercise.name} question count back to ${targetRestoreCount}.`,
      exercise: restoredExercise,
      restoredCount: targetRestoreCount,
    });
  } catch (error: any) {
    console.error("Error restoring exercise configuration:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to restore exercise configuration." },
      { status: 500 }
    );
  }
}
