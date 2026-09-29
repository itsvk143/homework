import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    const whereClause: any = {
      status: { not: "ARCHIVED" },
    };

    if (bookId) {
      whereClause.bookId = bookId;
    }

    const chapters = await prisma.chapter.findMany({
      where: whereClause,
      include: {
        book: {
          include: { subject: true },
        },
        _count: {
          select: { exercises: true, homeworks: true },
        },
      },
      orderBy: { chapterNumber: "asc" },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, name, chapterNumber, description, displayOrder } = body;

    if (!bookId || !name?.trim()) {
      return NextResponse.json({ error: "Book and Chapter name are required" }, { status: 400 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        bookId,
        name: name.trim(),
        chapterNumber: Number(chapterNumber) || 1,
        description: description?.trim() || null,
        displayOrder: Number(displayOrder) || Number(chapterNumber) || 1,
        status: "ACTIVE",
      },
    });

    await logAuditEvent({
      action: "CREATE_CHAPTER",
      entityType: "Chapter",
      entityId: chapter.id,
      metadata: { name: chapter.name, bookId, chapterNumber },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
