import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// GET all students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { studentProfile: { classGrade: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        studentProfile: true,
        assignedBooksAsStudent: {
          include: {
            book: {
              include: { subject: true },
            },
          },
        },
        _count: {
          select: {
            studentAssignments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST create new student
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
    const { name, email, password, classGrade, section, rollNo, schoolName } = body;

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

    const newStudent = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: password || "student123",
        role: "STUDENT",
        status: "ACTIVE",
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
      },
    });

    await logAuditEvent({
      action: "ADMIN_CREATE_STUDENT",
      entityType: "User",
      entityId: newStudent.id,
      metadata: { name: newStudent.name, email: newStudent.email },
    });

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

// PUT modify student or convert to teacher
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
      classGrade,
      section,
      rollNo,
      schoolName,
      convertToRole, // "TEACHER" if converting role
      subjectSpecialty,
      phone,
      bio,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true, teacherProfile: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Role conversion: STUDENT -> TEACHER
    if (convertToRole === "TEACHER") {
      // 1. Clean up student references
      await prisma.homeworkProgressHistory.deleteMany({
        where: { studentId: id },
      });
      await prisma.studentBook.deleteMany({ where: { studentId: id } });
      await prisma.homeworkAssignment.deleteMany({ where: { studentId: id } });
      await prisma.studentProfile.deleteMany({ where: { userId: id } });

      // 2. Update user to TEACHER
      const updatedToTeacher = await prisma.user.update({
        where: { id },
        data: {
          name: name ? name.trim() : existingUser.name,
          email: email ? email.toLowerCase().trim() : existingUser.email,
          role: "TEACHER",
          status: status || existingUser.status,
          teacherProfile: {
            create: {
              subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
              phone: phone?.trim() || null,
              bio: bio?.trim() || `Teacher at ${schoolName || "ClassBoard"}`,
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
        metadata: { from: "STUDENT", to: "TEACHER", email: updatedToTeacher.email },
      });

      return NextResponse.json({
        success: true,
        message: "Successfully converted Student to Teacher",
        user: updatedToTeacher,
      });
    }

    // Standard modification of student data
    const updatedStudent = await prisma.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingUser.name,
        email: email ? email.toLowerCase().trim() : existingUser.email,
        status: status || existingUser.status,
      },
    });

    if (existingUser.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId: id },
        data: {
          classGrade: classGrade !== undefined ? classGrade.trim() : existingUser.studentProfile.classGrade,
          section: section !== undefined ? section.trim() : existingUser.studentProfile.section,
          rollNo: rollNo !== undefined ? rollNo?.trim() : existingUser.studentProfile.rollNo,
          schoolName: schoolName !== undefined ? schoolName.trim() : existingUser.studentProfile.schoolName,
        },
      });
    } else {
      await prisma.studentProfile.create({
        data: {
          userId: id,
          classGrade: classGrade?.trim() || "Class 8",
          section: section?.trim() || "A",
          rollNo: rollNo?.trim() || null,
          schoolName: schoolName?.trim() || "Delhi Public School",
        },
      });
    }

    const fullStudent = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    });

    await logAuditEvent({
      action: "ADMIN_UPDATE_STUDENT",
      entityType: "User",
      entityId: id,
      metadata: { name: fullStudent?.name, email: fullStudent?.email },
    });

    return NextResponse.json({ success: true, student: fullStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// DELETE student
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
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Clean up all foreign keys safely
    await prisma.homeworkProgressHistory.deleteMany({
      where: { studentId: id },
    });
    await prisma.studentBook.deleteMany({ where: { studentId: id } });
    await prisma.homeworkAssignment.deleteMany({ where: { studentId: id } });
    await prisma.studentProfile.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.auditLog.deleteMany({ where: { entityId: id } });

    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      action: "ADMIN_DELETE_STUDENT",
      entityType: "User",
      entityId: id,
      metadata: { deletedBy: admin.email },
    });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
