import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const body = await req.json();

    const { action, teacherComment } = body; // action: "VERIFY" | "SEND_BACK" | "COMMENT"

    const assignment = await prisma.homeworkAssignment.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        exercise: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Homework assignment not found" }, { status: 404 });
    }

    if (user.role === "TEACHER") {
      const { isStudentAssignedToTeacher } = await import("@/lib/teacherAuth");
      const isAssigned = await isStudentAssignedToTeacher(user.id, assignment.studentId);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden. You are not authorized to review this student's homework." },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    let newHomeworkStatus = assignment.homeworkStatus;

    if (action === "VERIFY") {
      newHomeworkStatus = "COMPLETED";
    } else if (action === "SEND_BACK") {
      newHomeworkStatus = "REJECTED"; // returned to student for correction
    }

    const updated = await prisma.homeworkAssignment.update({
      where: { id },
      data: {
        homeworkStatus: newHomeworkStatus,
        teacherComment: teacherComment?.trim() || assignment.teacherComment,
        completedAt: action === "VERIFY" ? now : assignment.completedAt,
      },
      include: {
        exercise: true,
        subject: true,
        book: true,
      },
    });

    // Notify student
    if (action === "VERIFY") {
      await prisma.notification.create({
        data: {
          userId: assignment.studentId,
          title: "Homework Verified & Approved! 🎉",
          message: `${assignment.exercise.name} has been verified and marked completed by your teacher.`,
          type: "VERIFIED",
        },
      });
    } else if (action === "SEND_BACK") {
      await prisma.notification.create({
        data: {
          userId: assignment.studentId,
          title: "Homework Returned for Revision ⚠️",
          message: `Teacher Comment: "${teacherComment || "Please review questions and resubmit."}"`,
          type: "RETURNED",
        },
      });
    }

    await logAuditEvent({
      userId: user?.id,
      action: action === "VERIFY" ? "TEACHER_VERIFIED_HOMEWORK" : "TEACHER_RETURNED_HOMEWORK",
      entityType: "HomeworkAssignment",
      entityId: id,
      metadata: { action, comment: teacherComment, newStatus: newHomeworkStatus },
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: action === "VERIFY" ? "Homework verified successfully." : "Homework returned to student.",
    });
  } catch (error) {
    console.error("Error in teacher review:", error);
    return NextResponse.json({ error: "Failed to review homework" }, { status: 500 });
  }
}
