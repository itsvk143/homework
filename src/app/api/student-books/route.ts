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
              orderBy: { chapterNumber: "asc" },
              include: {
                exercises: {
                  where: { status: { not: "ARCHIVED" } },
                  orderBy: { displayOrder: "asc" },
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Teacher access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");
    let bookId = searchParams.get("bookId");

    if (!studentId || !bookId) {
      try {
        const body = await req.json();
        studentId = studentId || body.studentId;
        bookId = bookId || body.bookId;
      } catch (e) {
        // body may be empty
      }
    }

    if (!studentId || !bookId) {
      return NextResponse.json(
        { error: "studentId and bookId are required" },
        { status: 400 }
      );
    }

    // If teacher, verify authorization to manage this student or this book assignment
    if (user.role === "TEACHER") {
      const isAssigned = await prisma.teacherStudentAssignment.findFirst({
        where: {
          teacherId: user.id,
          studentId,
          status: "ACTIVE",
        },
      });
      const isAssigner = await prisma.studentBook.findFirst({
        where: {
          studentId,
          bookId,
          assignedByTeacherId: user.id,
        },
      });

      if (!isAssigned && !isAssigner) {
        return NextResponse.json(
          { error: "You are not authorized to manage this student's books." },
          { status: 403 }
        );
      }
    }

    // Delete the assigned book record
    const result = await prisma.studentBook.deleteMany({
      where: {
        studentId,
        bookId,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UNASSIGN_BOOK_FROM_STUDENT",
      entityType: "StudentBook",
      metadata: { studentId, bookId, count: result.count },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Error unassigning book:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unassign book" },
      { status: 500 }
    );
  }
}

