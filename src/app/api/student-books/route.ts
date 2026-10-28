import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import {
  isStudentAssignedToTeacher,
  authorizeTeacherForStudents,
} from "@/lib/teacherAuth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const whereClause: any = {};

    if (user.role === "TEACHER") {
      if (studentId) {
        const isAssigned = await isStudentAssignedToTeacher(user.id, studentId);
        if (!isAssigned) {
          return NextResponse.json(
            { error: "Forbidden. You are not assigned to this student." },
            { status: 403 }
          );
        }
        whereClause.studentId = studentId;
      } else {
        // Only return student books for students actively assigned to this teacher
        whereClause.student = {
          assignedTeachersAsStudent: {
            some: {
              teacherId: user.id,
              status: "ACTIVE",
            },
          },
        };
      }
    } else if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    } else if (user.role === "ADMIN") {
      if (studentId) {
        whereClause.studentId = studentId;
      }
    } else {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
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

    return NextResponse.json(
      { studentBooks: assignments },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching student books:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student books" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Only teachers and admins can assign books." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { studentIds, bookId } = body;

    if (!bookId || typeof bookId !== "string" || !bookId.trim()) {
      return NextResponse.json(
        { success: false, error: "bookId is required and must be a valid string." },
        { status: 400 }
      );
    }

    const cleanBookId = bookId.trim();
    const ids: string[] = Array.isArray(studentIds)
      ? studentIds.filter((id) => typeof id === "string" && id.trim())
      : [body.studentId].filter((id) => typeof id === "string" && id?.trim());

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one student must be selected." },
        { status: 400 }
      );
    }

    // Verify teacher authorization for every requested student before inspecting resources
    if (user.role === "TEACHER") {
      const authCheck = await authorizeTeacherForStudents(user, ids);
      if (!authCheck.authorized) {
        return NextResponse.json(
          {
            success: false,
            error:
              authCheck.error ||
              "Forbidden. You can only assign books to students actively assigned to you.",
          },
          { status: 403 }
        );
      }
    }

    // Resolve and validate student records
    const students = await prisma.user.findMany({
      where: {
        id: { in: ids },
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (students.length !== ids.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more selected students could not be found or are not students.",
        },
        { status: 400 }
      );
    }

    // Resolve and validate book details
    const book = await prisma.book.findUnique({
      where: { id: cleanBookId },
      select: {
        id: true,
        name: true,
        status: true,
        subjectId: true,
        subject: { select: { id: true, name: true } },
      },
    });

    if (!book || book.status === "ARCHIVED") {
      return NextResponse.json(
        { success: false, error: "Book not found or is archived." },
        { status: 404 }
      );
    }

    const teacherId = user.id;

    // Atomically persist assignment records
    const assignmentResults = await prisma.$transaction(async (tx) => {
      const results: Array<{
        record: any;
        student: { id: string; name: string; email: string };
        isNew: boolean;
      }> = [];

      for (const student of students) {
        const existing = await tx.studentBook.findUnique({
          where: {
            studentId_bookId: { studentId: student.id, bookId: book.id },
          },
        });

        if (!existing) {
          const created = await tx.studentBook.create({
            data: {
              studentId: student.id,
              bookId: book.id,
              assignedByTeacherId: teacherId,
            },
          });
          results.push({ record: created, student, isNew: true });
        } else {
          // If already assigned, acknowledge teacher association
          const updated = await tx.studentBook.update({
            where: { id: existing.id },
            data: {
              assignedByTeacherId: teacherId,
            },
          });
          results.push({ record: updated, student, isNew: false });
        }
      }

      return results;
    });

    const newlyCount = assignmentResults.filter((r) => r.isNew).length;
    const alreadyCount = assignmentResults.filter((r) => !r.isNew).length;

    await logAuditEvent({
      userId: teacherId,
      action: "ASSIGN_BOOKS_TO_STUDENTS",
      entityType: "StudentBook",
      metadata: {
        bookId: book.id,
        bookName: book.name,
        totalRequested: ids.length,
        newlyAssigned: newlyCount,
        alreadyAssigned: alreadyCount,
      },
    });

    let message: string;
    if (newlyCount > 0 && alreadyCount > 0) {
      message = `"${book.name}" assigned to ${newlyCount} student(s) (${alreadyCount} already had this book assigned).`;
    } else if (alreadyCount > 0 && newlyCount === 0) {
      message = `"${book.name}" is already assigned to the selected student(s). Faculty assignment record confirmed!`;
    } else {
      message = `"${book.name}" assigned successfully to ${newlyCount} student(s)!`;
    }

    return NextResponse.json(
      {
        success: true,
        count: assignmentResults.length,
        newlyAssignedCount: newlyCount,
        alreadyAssignedCount: alreadyCount,
        bookId: book.id,
        bookName: book.name,
        assignments: assignmentResults.map((r) => ({
          id: r.record.id,
          studentId: r.student.id,
          studentName: r.student.name,
          bookId: book.id,
          bookName: book.name,
          isNew: r.isNew,
          assignedByTeacherId: r.record.assignedByTeacherId,
        })),
        message,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Error assigning book to student:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to assign book to student." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Teacher access required." },
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
        { success: false, error: "studentId and bookId are required." },
        { status: 400 }
      );
    }

    // If teacher, strictly verify that this student is assigned to this teacher
    if (user.role === "TEACHER") {
      const isAssigned = await isStudentAssignedToTeacher(user.id, studentId);
      if (!isAssigned) {
        return NextResponse.json(
          { success: false, error: "Forbidden. You are not assigned to this student." },
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

    return NextResponse.json(
      { success: true, count: result.count },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Error unassigning book:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unassign book." },
      { status: 500 }
    );
  }
}

