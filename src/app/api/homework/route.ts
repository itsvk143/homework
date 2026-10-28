import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
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
    const requestedTeacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");
    const bookId = searchParams.get("bookId");
    const chapterId = searchParams.get("chapterId");
    const exerciseId = searchParams.get("exerciseId");
    const status = searchParams.get("status"); // homeworkStatus
    const exerciseStatus = searchParams.get("exerciseStatus");
    const filter = searchParams.get("filter"); // today, overdue, upcoming, completed, in_progress, not_started, no_update_recently
    const search = searchParams.get("search")?.toLowerCase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const where: any = {};

    if (user.role === "TEACHER") {
      // Security enforcement: Teachers cannot query another teacher's ID
      if (requestedTeacherId && requestedTeacherId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden. Teachers can only access homework for their own students." },
          { status: 403 }
        );
      }

      // If querying specific student, verify assignment
      if (studentId) {
        const isAssigned = await isStudentAssignedToTeacher(user.id, studentId);
        if (!isAssigned) {
          return NextResponse.json(
            { error: "Forbidden. You are not assigned to this student." },
            { status: 403 }
          );
        }
        where.studentId = studentId;
      }

      // Automatically scope to students actively assigned to this teacher
      where.student = {
        assignedTeachersAsStudent: {
          some: {
            teacherId: user.id,
            status: "ACTIVE",
          },
        },
      };
    } else if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "ADMIN") {
      if (studentId) where.studentId = studentId;
      if (requestedTeacherId) where.teacherId = requestedTeacherId;
    } else {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }

    if (subjectId) where.subjectId = subjectId;
    if (bookId) where.bookId = bookId;
    if (chapterId) where.chapterId = chapterId;
    if (exerciseId) where.exerciseId = exerciseId;

    if (status && status !== "ALL") {
      if (status === "OVERDUE") {
        where.dueDate = { lt: now };
        where.exerciseStatus = { not: "COMPLETED" };
      } else {
        where.homeworkStatus = status;
      }
    }

    if (exerciseStatus && exerciseStatus !== "ALL") {
      where.exerciseStatus = exerciseStatus;
    }

    // Special quick filters
    if (filter === "today") {
      where.dueDate = {
        gte: startOfToday,
        lte: endOfToday,
      };
    } else if (filter === "overdue") {
      where.dueDate = { lt: now };
      where.exerciseStatus = { not: "COMPLETED" };
    } else if (filter === "upcoming") {
      where.dueDate = { gt: endOfToday };
      where.exerciseStatus = { not: "COMPLETED" };
    } else if (filter === "not_started") {
      where.exerciseStatus = "NOT_STARTED";
    } else if (filter === "in_progress") {
      where.exerciseStatus = "IN_PROGRESS";
    } else if (filter === "completed") {
      where.exerciseStatus = "COMPLETED";
    } else if (filter === "no_update_recently") {
      // Not updated in the last 48 hours and not completed
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      where.exerciseStatus = { not: "COMPLETED" };
      where.OR = [
        { lastProgressUpdate: { lt: twoDaysAgo } },
        { lastProgressUpdate: null },
      ];
    }

    if (search) {
      where.OR = [
        { subject: { name: { contains: search } } },
        { book: { name: { contains: search } } },
        { chapter: { name: { contains: search } } },
        { exercise: { name: { contains: search } } },
        { exercise: { exerciseNumber: { contains: search } } },
        { student: { name: { contains: search } } },
      ];
    }

    const assignments = await prisma.homeworkAssignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            studentProfile: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subject: true,
        book: true,
        chapter: true,
        exercise: true,
        progressHistory: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 1,
          include: { attachments: true },
        },
        attachments: true,
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching homework assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Forbidden. Only teachers and admins can assign homework." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      studentIds, // string[]
      subjectId,
      bookId,
      chapterId,
      exerciseId,
      dueDate,
      instructions,
    } = body;

    const ids: string[] = Array.isArray(studentIds) ? studentIds : [body.studentId].filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ error: "Select at least one student." }, { status: 400 });
    }
    if (!exerciseId || !dueDate) {
      return NextResponse.json({ error: "Exercise and due date are required." }, { status: 400 });
    }

    // Verify teacher authorization for every student in ids
    if (user.role === "TEACHER") {
      const authCheck = await authorizeTeacherForStudents(user, ids);
      if (!authCheck.authorized) {
        return NextResponse.json(
          { error: authCheck.error || "Forbidden. You can only assign homework to students assigned to you." },
          { status: 403 }
        );
      }
    }

    // Retrieve exercise to snapshot totalQuestions authoritative value
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        chapter: {
          include: {
            book: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
    }

    const resolvedChapterId = chapterId || exercise.chapterId;
    const resolvedBookId = bookId || exercise.chapter.bookId;
    const resolvedSubjectId = subjectId || exercise.chapter.book.subjectId;
    const teacherId = user.id;

    const parsedDueDate = new Date(dueDate);

    const createdAssignments = [];

    for (const sId of ids) {
      // Ensure student has this book assigned
      const hasBook = await prisma.studentBook.findUnique({
        where: {
          studentId_bookId: { studentId: sId, bookId: resolvedBookId },
        },
      });

      if (!hasBook) {
        await prisma.studentBook.create({
          data: {
            studentId: sId,
            bookId: resolvedBookId,
            assignedByTeacherId: teacherId,
          },
        });
      }

      // Check if assignment already exists for this student & exercise
      const existingAssignment = await prisma.homeworkAssignment.findFirst({
        where: {
          studentId: sId,
          exerciseId: exercise.id,
        },
      });

      if (existingAssignment) {
        // Update existing due date / instructions if re-assigned
        const updated = await prisma.homeworkAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            dueDate: parsedDueDate,
            instructions: instructions || existingAssignment.instructions,
            teacherId,
          },
        });
        createdAssignments.push(updated);
      } else {
        const assignment = await prisma.homeworkAssignment.create({
          data: {
            studentId: sId,
            teacherId,
            subjectId: resolvedSubjectId,
            bookId: resolvedBookId,
            chapterId: resolvedChapterId,
            exerciseId: exercise.id,
            assignedDate: new Date(),
            dueDate: parsedDueDate,
            instructions: instructions || null,
            totalQuestions: exercise.totalQuestions,
            questionsCompleted: 0,
            progressPercentage: 0.0,
            exerciseStatus: "NOT_STARTED",
            homeworkStatus: "ASSIGNED",
          },
        });
        createdAssignments.push(assignment);
      }

      // Create notification for student
      await prisma.notification.create({
        data: {
          userId: sId,
          title: "New Homework Assigned",
          message: `${exercise.chapter.book.name} — ${exercise.name} (${exercise.totalQuestions} questions) has been assigned. Due on ${parsedDueDate.toLocaleDateString()}.`,
          type: "HOMEWORK_ASSIGNED",
        },
      });
    }

    await logAuditEvent({
      userId: teacherId,
      action: "ASSIGN_HOMEWORK_BULK",
      entityType: "HomeworkAssignment",
      metadata: {
        exerciseNumber: exercise.exerciseNumber,
        exerciseName: exercise.name,
        totalQuestions: exercise.totalQuestions,
        studentsCount: ids.length,
        dueDate: parsedDueDate,
      },
    });

    return NextResponse.json({
      success: true,
      count: createdAssignments.length,
      assignments: createdAssignments,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating bulk homework assignments:", error);
    return NextResponse.json({ error: "Failed to assign homework" }, { status: 500 });
  }
}
