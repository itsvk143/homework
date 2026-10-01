import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// GET all teachers
export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },
      include: {
        teacherProfile: true,
        _count: {
          select: {
            teacherAssignments: true,
            assignedBooksAsTeacher: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST create new teacher
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
    const { name, email, password, subjectSpecialty, phone, bio, schoolName } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const newTeacher = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: password || "teacher123",
        role: "TEACHER",
        status: "ACTIVE",
        teacherProfile: {
          create: {
            subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
            phone: phone?.trim() || null,
            bio: bio?.trim() || `Teacher at ${schoolName?.trim() || "ClassBoard"}`,
          },
        },
      },
      include: {
        teacherProfile: true,
      },
    });

    await logAuditEvent({
      action: "ADMIN_CREATE_TEACHER",
      entityType: "User",
      entityId: newTeacher.id,
      metadata: { name: newTeacher.name, email: newTeacher.email },
    });

    return NextResponse.json({ success: true, teacher: newTeacher });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}

// PUT modify teacher or convert to student
export async function PUT(req: NextRequest) {
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
      id,
      name,
      email,
      status,
      subjectSpecialty,
      phone,
      bio,
      convertToRole, // "STUDENT" if changing role
      classGrade,
      section,
      rollNo,
      schoolName,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { teacherProfile: true, studentProfile: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Role conversion: TEACHER -> STUDENT
    if (convertToRole === "STUDENT") {
      // 1. Clean up references that restrict teacher deletion/conversion
      await prisma.studentBook.deleteMany({ where: { assignedByTeacherId: id } });
      await prisma.homeworkProgressHistory.deleteMany({
        where: { homeworkAssignment: { teacherId: id } },
      });
      await prisma.homeworkAssignment.deleteMany({ where: { teacherId: id } });
      await prisma.teacherProfile.deleteMany({ where: { userId: id } });

      // 2. Update user to STUDENT
      const updatedToStudent = await prisma.user.update({
        where: { id },
        data: {
          name: name ? name.trim() : existingUser.name,
          email: email ? email.toLowerCase().trim() : existingUser.email,
          role: "STUDENT",
          status: status || existingUser.status,
          studentProfile: {
            create: {
              classGrade: classGrade?.trim() || "Class 8",
              section: section?.trim() || "A",
              rollNo: rollNo?.trim() || null,
              schoolName: schoolName?.trim() || "Delhi Public School",
            },
          },
        },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });

      await logAuditEvent({
        action: "ADMIN_CONVERT_ROLE",
        entityType: "User",
        entityId: id,
        metadata: { from: "TEACHER", to: "STUDENT", email: updatedToStudent.email },
      });

      return NextResponse.json({
        success: true,
        message: "Successfully converted Teacher to Student",
        user: updatedToStudent,
      });
    }

    // Standard modification of teacher data
    const updatedTeacher = await prisma.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingUser.name,
        email: email ? email.toLowerCase().trim() : existingUser.email,
        status: status || existingUser.status,
      },
    });

    if (existingUser.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { userId: id },
        data: {
          subjectSpecialty: subjectSpecialty !== undefined ? subjectSpecialty.trim() : existingUser.teacherProfile.subjectSpecialty,
          phone: phone !== undefined ? phone?.trim() : existingUser.teacherProfile.phone,
          bio: bio !== undefined ? bio?.trim() : existingUser.teacherProfile.bio,
        },
      });
    } else {
      await prisma.teacherProfile.create({
        data: {
          userId: id,
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone?.trim() || null,
          bio: bio?.trim() || `Teacher at ${schoolName || "ClassBoard"}`,
        },
      });
    }

    const fullTeacher = await prisma.user.findUnique({
      where: { id },
      include: { teacherProfile: true },
    });

    await logAuditEvent({
      action: "ADMIN_UPDATE_TEACHER",
      entityType: "User",
      entityId: id,
      metadata: { name: fullTeacher?.name, email: fullTeacher?.email },
    });

    return NextResponse.json({ success: true, teacher: fullTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

// DELETE teacher
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

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // Clean up all foreign keys safely
    await prisma.studentBook.deleteMany({ where: { assignedByTeacherId: id } });
    await prisma.homeworkProgressHistory.deleteMany({
      where: { homeworkAssignment: { teacherId: id } },
    });
    await prisma.homeworkAssignment.deleteMany({ where: { teacherId: id } });
    await prisma.teacherProfile.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.auditLog.deleteMany({ where: { entityId: id } });

    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      action: "ADMIN_DELETE_TEACHER",
      entityType: "User",
      entityId: id,
      metadata: { deletedBy: admin.email },
    });

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
