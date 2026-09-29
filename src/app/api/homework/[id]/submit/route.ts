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
    const body = await req.json();

    const { studentNotes, attachments } = body; // attachments: Array<{ fileName, fileType, fileUrl, fileSize }>

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

    if (user?.role === "STUDENT" && assignment.studentId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();

    // Create Submission record
    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkAssignmentId: id,
        studentNotes: studentNotes?.trim() || null,
        status: "SUBMITTED",
        submittedAt: now,
      },
    });

    // Create attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await prisma.homeworkAttachment.create({
          data: {
            homeworkAssignmentId: id,
            submissionId: submission.id,
            fileName: att.fileName || "proof.jpg",
            fileType: att.fileType || "IMAGE",
            fileUrl: att.fileUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
            fileSize: att.fileSize || 250000,
          },
        });
      }
    }

    // Update assignment status
    const updatedAssignment = await prisma.homeworkAssignment.update({
      where: { id },
      data: {
        homeworkStatus: "AWAITING_REVIEW",
        submittedAt: now,
      },
      include: {
        attachments: true,
        submissions: {
          include: { attachments: true },
        },
      },
    });

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: assignment.teacherId,
        title: "Homework Submitted for Review",
        message: `${assignment.student.name} submitted homework for ${assignment.exercise.name} with ${
          attachments?.length || 0
        } proof attachment(s).`,
        type: "PROGRESS_UPDATE",
      },
    });

    await logAuditEvent({
      userId: user?.id || assignment.studentId,
      action: "SUBMIT_HOMEWORK_PROOF",
      entityType: "HomeworkAssignment",
      entityId: id,
      metadata: { attachmentsCount: attachments?.length || 0, notes: studentNotes },
    });

    return NextResponse.json({
      success: true,
      message: "Homework proof submitted successfully!",
      assignment: updatedAssignment,
      submission,
    });
  } catch (error) {
    console.error("Error submitting homework proof:", error);
    return NextResponse.json({ error: "Failed to submit homework proof" }, { status: 500 });
  }
}
