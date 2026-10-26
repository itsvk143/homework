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
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const filter = searchParams.get("filter") || "ALL"; // ALL, TRUSTED_ONLY, UNTRUSTED_ONLY

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: { not: "ARCHIVED" },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        studentProfile: true,
        assignedBooksAsStudent: {
          include: {
            book: {
              include: {
                subject: true,
                _count: {
                  select: { chapters: true },
                },
              },
            },
          },
          orderBy: { assignedDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = students
      .map((st) => {
        const assignedBooks = st.assignedBooksAsStudent.map((sb) => ({
          studentBookId: sb.id,
          bookId: sb.bookId,
          bookName: sb.book.name,
          bookCode: sb.book.bookCode,
          subjectName: sb.book.subject.name,
          subjectColor: sb.book.subject.color,
          classGrade: sb.book.classGrade,
          chaptersCount: sb.book._count?.chapters || 0,
          isTrustedForConfig: sb.isTrustedForConfig || false,
          minQuestions: sb.minQuestions || 1,
          maxQuestions: sb.maxQuestions || 500,
          trustedGrantedAt: sb.trustedGrantedAt,
          trustedGrantedById: sb.trustedGrantedById,
        }));

        const trustedBooksCount = assignedBooks.filter((b) => b.isTrustedForConfig).length;
        const isTrusted = st.studentProfile?.isTrustedStudent || trustedBooksCount > 0;

        return {
          id: st.id,
          name: st.name,
          email: st.email,
          avatarUrl: st.avatarUrl,
          classGrade: st.studentProfile?.classGrade || "Class 12",
          section: st.studentProfile?.section || "A",
          rollNo: st.studentProfile?.rollNo || "--",
          isTrustedStudent: isTrusted,
          trustedBooksCount,
          totalAssignedBooks: assignedBooks.length,
          assignedBooks,
        };
      })
      .filter((st) => {
        if (filter === "TRUSTED_ONLY") return st.isTrustedStudent;
        if (filter === "UNTRUSTED_ONLY") return !st.isTrustedStudent;
        return true;
      });

    return NextResponse.json({
      students: formatted,
      totalCount: formatted.length,
      trustedCount: formatted.filter((s) => s.isTrustedStudent).length,
    });
  } catch (error: any) {
    console.error("Error fetching trusted students:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch trusted students list." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      isTrustedStudent,
      authorizedBookIds = [],
      minQuestions = 1,
      maxQuestions = 500,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
        assignedBooksAsStudent: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // 1. Update StudentProfile
    const hasAuthorizedBooks = Array.isArray(authorizedBookIds) && authorizedBookIds.length > 0;
    const finalTrustedStatus = isTrustedStudent !== undefined ? Boolean(isTrustedStudent) : hasAuthorizedBooks;

    if (student.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: student.studentProfile.id },
        data: {
          isTrustedStudent: finalTrustedStatus,
        },
      });
    }

    // 2. Update StudentBook permissions for every assigned book
    const assignedBooks = student.assignedBooksAsStudent;
    const authBookIdSet = new Set(authorizedBookIds);

    for (const sb of assignedBooks) {
      const shouldAuthorize = finalTrustedStatus && authBookIdSet.has(sb.bookId);

      await prisma.studentBook.update({
        where: { id: sb.id },
        data: {
          isTrustedForConfig: shouldAuthorize,
          minQuestions: shouldAuthorize ? minQuestions : (sb.minQuestions || 1),
          maxQuestions: shouldAuthorize ? maxQuestions : (sb.maxQuestions || 500),
          trustedGrantedAt: shouldAuthorize ? new Date() : (sb.isTrustedForConfig ? sb.trustedGrantedAt : null),
          trustedGrantedById: shouldAuthorize ? user.id : (sb.isTrustedForConfig ? sb.trustedGrantedById : null),
        },
      });
    }

    // 3. Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_TRUSTED_STUDENT_PERMISSIONS",
      entityType: "User",
      entityId: student.id,
      metadata: {
        studentName: student.name,
        studentEmail: student.email,
        isTrustedStudent: finalTrustedStatus,
        authorizedBookIds,
        minQuestions,
        maxQuestions,
        grantedByAdmin: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permissions updated successfully for ${student.name}.`,
      isTrustedStudent: finalTrustedStatus,
      authorizedBooksCount: authorizedBookIds.length,
    });
  } catch (error: any) {
    console.error("Error updating trusted student permissions:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update trusted student permissions." },
      { status: 500 }
    );
  }
}
