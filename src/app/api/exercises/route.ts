import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const whereClause: any = {};
    if (!includeArchived) {
      whereClause.status = { not: "ARCHIVED" };
    }

    if (chapterId) {
      whereClause.chapterId = chapterId;
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
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
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chapterId,
      name,
      exerciseNumber,
      totalQuestions,
      pageNumber,
      questionRange,
      estimatedTime,
      teacherNotes,
      displayOrder,
    } = body;

    if (!chapterId || !name?.trim() || !exerciseNumber?.trim()) {
      return NextResponse.json({ error: "Chapter, name, and exercise number are required" }, { status: 400 });
    }

    const questionsCount = Number(totalQuestions);
    if (isNaN(questionsCount) || questionsCount <= 0) {
      return NextResponse.json({ error: "totalQuestions must be a positive integer" }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        chapterId,
        name: name.trim(),
        exerciseNumber: exerciseNumber.trim(),
        totalQuestions: questionsCount,
        pageNumber: pageNumber ? Number(pageNumber) : null,
        questionRange: questionRange?.trim() || null,
        estimatedTime: estimatedTime ? Number(estimatedTime) : null,
        teacherNotes: teacherNotes?.trim() || null,
        displayOrder: Number(displayOrder) || 1,
        status: "ACTIVE",
      },
    });

    await logAuditEvent({
      action: "CREATE_EXERCISE",
      entityType: "Exercise",
      entityId: exercise.id,
      metadata: { name: exercise.name, exerciseNumber: exercise.exerciseNumber, totalQuestions: questionsCount },
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}
