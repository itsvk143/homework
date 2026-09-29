import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            book: {
              include: { subject: true },
            },
          },
        },
        _count: {
          select: { homeworks: true },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return NextResponse.json({ error: "Failed to fetch exercise" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        exerciseNumber: body.exerciseNumber?.trim(),
        totalQuestions: body.totalQuestions !== undefined ? Number(body.totalQuestions) : undefined,
        pageNumber: body.pageNumber !== undefined ? (body.pageNumber ? Number(body.pageNumber) : null) : undefined,
        questionRange: body.questionRange !== undefined ? body.questionRange : undefined,
        estimatedTime: body.estimatedTime !== undefined ? (body.estimatedTime ? Number(body.estimatedTime) : null) : undefined,
        teacherNotes: body.teacherNotes !== undefined ? body.teacherNotes : undefined,
        status: body.status !== undefined ? body.status : undefined,
        displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
      },
    });

    await logAuditEvent({
      action: "UPDATE_EXERCISE",
      entityType: "Exercise",
      entityId: id,
      metadata: body,
    });

    return NextResponse.json({ exercise: updated });
  } catch (error) {
    console.error("Error updating exercise:", error);
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check delete protection: does this exercise have historical homework records?
    const homeworkCount = await prisma.homeworkAssignment.count({
      where: { exerciseId: id },
    });

    if (homeworkCount > 0) {
      // Historical records exist: ARCHIVE the exercise to protect integrity
      const archived = await prisma.exercise.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await logAuditEvent({
        action: "ARCHIVE_EXERCISE_PROTECTED",
        entityType: "Exercise",
        entityId: id,
        metadata: {
          reason: `Protected from permanent delete: ${homeworkCount} historical homework records exist.`,
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Exercise archived safely. Protected ${homeworkCount} historical homework records from destruction.`,
        exercise: archived,
      });
    }

    // No historical records: safe to hard delete
    await prisma.exercise.delete({
      where: { id },
    });

    await logAuditEvent({
      action: "DELETE_EXERCISE",
      entityType: "Exercise",
      entityId: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: "Exercise permanently deleted.",
    });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
