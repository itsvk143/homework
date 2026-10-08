import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getNextRollNumber } from "@/lib/rollNumber";

// GET all students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const teacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");

    const whereClause: any = {
      role: "STUDENT",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { studentProfile: { classGrade: { contains: search } } },
      ];
    }

    if (teacherId) {
      whereClause.assignedTeachersAsStudent = {
        some: {
          teacherId,
          status: "ACTIVE",
          ...(subjectId ? { subjectId } : {}),
        },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true,
        assignedTeachersAsStudent: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            teacher: {
              select: { id: true, name: true, teacherProfile: { select: { phone: true } } },
            },
            subject: {
              select: { id: true, name: true, classGrade: true },
            },
          },
        },
        assignedBooksAsStudent: {
          select: {
            id: true,
            bookId: true,
          },
        },
        _count: {
          select: {
            studentAssignments: true,
            assignedTeachersAsStudent: true,
            assignedBooksAsStudent: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Auto-restore core student LV TAX CONSULTANCY if missing from this container
    if (!search && !teacherId && !students.some((s) => s.email?.toLowerCase() === "lvtaxconsultant@gmail.com")) {
      try {
        const restoredStudent = await prisma.user.create({
          data: {
            id: "user_student_lv_tax_consultancy",
            email: "lvtaxconsultant@gmail.com",
            name: "LV TAX CONSULTANCY",
            role: "STUDENT",
            status: "ACTIVE",
            password: "student123",
            studentProfile: {
              create: {
                classGrade: "NEET Dropper",
                section: "A",
                rollNo: "1",
                schoolName: "LV INSTITUTE",
              },
            },
          },
          include: {
            studentProfile: true,
            assignedTeachersAsStudent: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                teacher: {
                  select: { id: true, name: true, teacherProfile: { select: { phone: true } } },
                },
                subject: {
                  select: { id: true, name: true, classGrade: true },
                },
              },
            },
            assignedBooksAsStudent: {
              select: {
                id: true,
                bookId: true,
              },
            },
            _count: {
              select: {
                studentAssignments: true,
                assignedTeachersAsStudent: true,
                assignedBooksAsStudent: true,
              },
            },
          },
        });
        students.push(restoredStudent);
      } catch (e) {}
    }

    return NextResponse.json(
      { students },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
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

    const targetGrade = classGrade?.trim() || "NEET Dropper";
    const targetSection = section?.trim() || "A";
    const targetSchool = schoolName?.trim() || "LV INSTITUTE";

    let finalRollNo = rollNo?.trim();
    if (!finalRollNo) {
      finalRollNo = await getNextRollNumber(targetGrade, targetSection);
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
            classGrade: targetGrade,
            section: targetSection,
            rollNo: finalRollNo,
            schoolName: targetSchool,
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
      await prisma.teacherStudentAssignment.deleteMany({ where: { studentId: id } });
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
              bio: bio?.trim() || `Teacher at ${schoolName || "LV INSTITUTE"}`,
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
      const targetGrade = classGrade?.trim() || "NEET Dropper";
      const targetSection = section?.trim() || "A";
      const targetSchool = schoolName?.trim() || "LV INSTITUTE";

      let finalRollNo = rollNo?.trim();
      if (!finalRollNo) {
        finalRollNo = await getNextRollNumber(targetGrade, targetSection);
      }

      await prisma.studentProfile.create({
        data: {
          userId: id,
          classGrade: targetGrade,
          section: targetSection,
          rollNo: finalRollNo,
          schoolName: targetSchool,
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
    await prisma.teacherStudentAssignment.deleteMany({ where: { studentId: id } });
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
