import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// GET assignments (by teacherId, studentId, or all)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    // If teacher is requesting, they can only see their own assignments unless they are admin
    if (user.role === "TEACHER" && teacherId && teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden. Teachers can only view their own student assignments." }, { status: 403 });
    }

    const whereClause: any = {
      status: "ACTIVE",
    };

    if (teacherId) whereClause.teacherId = teacherId;
    if (studentId) whereClause.studentId = studentId;
    if (subjectId) whereClause.subjectId = subjectId;

    const assignments = await prisma.teacherStudentAssignment.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            teacherProfile: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            studentProfile: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            icon: true,
            classGrade: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching teacher-student assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST create or bulk-assign students to teacher with subject(s)
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      teacherId,
      studentId,
      studentIds,
      subjectId,
      subjectIds,
      academicYear = "2026-2027",
    } = body;

    // Support both single and bulk assignment
    const targetTeacherId = teacherId;
    const targetStudentIds: string[] = studentIds || (studentId ? [studentId] : []);
    const targetSubjectIds: string[] = subjectIds || (subjectId ? [subjectId] : []);

    if (!targetTeacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
        { status: 400 }
      );
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { error: "At least one student must be selected" },
        { status: 400 }
      );
    }

    if (targetSubjectIds.length === 0) {
      return NextResponse.json(
        { error: "At least one subject must be selected" },
        { status: 400 }
      );
    }

    // Verify teacher exists and has TEACHER role
    const teacherUser = await prisma.user.findUnique({
      where: { id: targetTeacherId },
    });
    if (!teacherUser || teacherUser.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Invalid teacher selected" },
        { status: 400 }
      );
    }

    // Process assignments
    const createdAssignments = [];
    for (const sId of targetStudentIds) {
      for (const subId of targetSubjectIds) {
        const assignment = await prisma.teacherStudentAssignment.upsert({
          where: {
            teacherId_studentId_subjectId: {
              teacherId: targetTeacherId,
              studentId: sId,
              subjectId: subId,
            },
          },
          update: {
            status: "ACTIVE",
            academicYear,
          },
          create: {
            teacherId: targetTeacherId,
            studentId: sId,
            subjectId: subId,
            academicYear,
            status: "ACTIVE",
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            subject: { select: { id: true, name: true } },
          },
        });
        createdAssignments.push(assignment);
      }
    }

    await logAuditEvent({
      action: "ADMIN_ASSIGN_STUDENT_TO_TEACHER",
      entityType: "TeacherStudentAssignment",
      entityId: targetTeacherId,
      metadata: {
        teacherName: teacherUser.name,
        assignedStudentsCount: targetStudentIds.length,
        subjectsCount: targetSubjectIds.length,
        assignedBy: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Assigned ${targetStudentIds.length} student(s) to ${teacherUser.name}`,
      count: createdAssignments.length,
      assignments: createdAssignments,
    });
  } catch (error) {
    console.error("Error creating teacher-student assignment:", error);
    return NextResponse.json(
      { error: "Failed to assign student to teacher" },
      { status: 500 }
    );
  }
}

// DELETE remove assignment(s)
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const teacherId = searchParams.get("teacherId");
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    if (id) {
      await prisma.teacherStudentAssignment.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Assignment removed successfully" });
    }

    if (teacherId && studentId && subjectId) {
      await prisma.teacherStudentAssignment.deleteMany({
        where: {
          teacherId,
          studentId,
          subjectId,
        },
      });
      return NextResponse.json({ success: true, message: "Assignment removed successfully" });
    }

    if (teacherId && studentId) {
      // Remove all subject assignments between this teacher and student
      await prisma.teacherStudentAssignment.deleteMany({
        where: {
          teacherId,
          studentId,
        },
      });
      return NextResponse.json({ success: true, message: "Assignments removed successfully" });
    }

    return NextResponse.json(
      { error: "Assignment ID or teacherId & studentId required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting teacher-student assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
