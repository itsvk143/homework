import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const whereClause: any = {};
    if (studentId) {
      whereClause.studentId = studentId;
    }

    const assignments = await prisma.studentBook.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        book: {
          include: {
            subject: true,
            chapters: {
              where: { status: { not: "ARCHIVED" } },
              include: {
                exercises: {
                  where: { status: { not: "ARCHIVED" } },
                },
              },
            },
          },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { assignedDate: "desc" },
    });

    return NextResponse.json({ studentBooks: assignments });
  } catch (error) {
    console.error("Error fetching student books:", error);
    return NextResponse.json({ error: "Failed to fetch student books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { studentIds, bookId } = body; // Can assign single or multiple students

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    const ids: string[] = Array.isArray(studentIds) ? studentIds : [body.studentId].filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ error: "At least one student must be selected" }, { status: 400 });
    }

    const results = [];
    const teacherId = user?.id || "teacher-1";

    for (const studentId of ids) {
      const existing = await prisma.studentBook.findUnique({
        where: {
          studentId_bookId: { studentId, bookId },
        },
      });

      if (!existing) {
        const record = await prisma.studentBook.create({
          data: {
            studentId,
            bookId,
            assignedByTeacherId: teacherId,
          },
        });
        results.push(record);
      }
    }

    await logAuditEvent({
      userId: teacherId,
      action: "ASSIGN_BOOKS_TO_STUDENTS",
      entityType: "StudentBook",
      metadata: { bookId, studentCount: ids.length },
    });

    return NextResponse.json({ success: true, count: results.length, records: results });
  } catch (error) {
    console.error("Error assigning book to student:", error);
    return NextResponse.json({ error: "Failed to assign book to student" }, { status: 500 });
  }
}
