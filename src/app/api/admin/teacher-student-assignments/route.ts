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

    // If student is requesting, scope to their own assignments
    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    }

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
    let id = searchParams.get("id");
    let ids: string[] = [];
    let teacherId = searchParams.get("teacherId");
    let studentId = searchParams.get("studentId");
    let subjectId = searchParams.get("subjectId");

    // Also safely inspect JSON body if provided
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.json();
        if (body.id) id = body.id;
        if (Array.isArray(body.ids)) ids = body.ids;
        if (body.teacherId) teacherId = body.teacherId;
        if (body.studentId) studentId = body.studentId;
        if (body.subjectId) subjectId = body.subjectId;
      } catch {
        // query params will be used if body parse fails
      }
    }

    // 1. Bulk remove by array of IDs
    if (ids.length > 0) {
      const result = await prisma.teacherStudentAssignment.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Removed ${result.count} assignment(s) successfully`,
      });
    }

    // 2. Remove single by ID (safe deleteMany prevents crashes if already deleted)
    if (id) {
      const result = await prisma.teacherStudentAssignment.deleteMany({
        where: { id },
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        message: "Assignment removed successfully",
      });
    }

    // 3. Remove by teacher + student + subject
    if (teacherId && studentId && subjectId) {
      const result = await prisma.teacherStudentAssignment.deleteMany({
        where: {
          teacherId,
          studentId,
          subjectId,
        },
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        message: "Assignment removed successfully",
      });
    }

    // 4. Remove all assignments between specific teacher and student
    if (teacherId && studentId) {
      const result = await prisma.teacherStudentAssignment.deleteMany({
        where: {
          teacherId,
          studentId,
        },
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Removed ${result.count} assignment(s) successfully`,
      });
    }

    // 5. Remove all assignments for a teacher
    if (teacherId) {
      const result = await prisma.teacherStudentAssignment.deleteMany({
        where: { teacherId },
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Removed all ${result.count} assignment(s) for teacher`,
      });
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
