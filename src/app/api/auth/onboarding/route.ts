import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      role,
      name,
      schoolName,
      classGrade,
      section,
      rollNo,
      subjectSpecialty,
      phone,
    } = body;

    // Validate role
    if (role !== "TEACHER" && role !== "STUDENT") {
      return NextResponse.json(
        { error: "Please select whether you are a Teacher or a Student." },
        { status: 400 }
      );
    }

    const isSysAdmin = isAdminEmail(user.email);
    const finalRole = isSysAdmin ? "ADMIN" : role;

    // Update user name and lock in final role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || user.name,
        role: finalRole,
      },
    });

    if (finalRole === "TEACHER") {
      // Remove any leftover student profile and create/upsert teacher profile
      await prisma.studentProfile.deleteMany({
        where: { userId: user.id },
      });

      await prisma.teacherProfile.upsert({
        where: { userId: user.id },
        update: {
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone?.trim() || null,
          bio: `Teacher at ${schoolName?.trim() || "ClassBoard Academy"}`,
        },
        create: {
          userId: user.id,
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone?.trim() || null,
          bio: `Teacher at ${schoolName?.trim() || "ClassBoard Academy"}`,
        },
      });
    } else if (finalRole === "STUDENT") {
      // Upsert student profile
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          classGrade: classGrade?.trim() || "Class 8",
          section: section?.trim() || "A",
          rollNo: rollNo?.trim() || null,
          schoolName: schoolName?.trim() || "Delhi Public School",
        },
        create: {
          userId: user.id,
          classGrade: classGrade?.trim() || "Class 8",
          section: section?.trim() || "A",
          rollNo: rollNo?.trim() || null,
          schoolName: schoolName?.trim() || "Delhi Public School",
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    await logAuditEvent({
      action: "ROLE_ONBOARDING_COMPLETED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: fullUser?.role, email: fullUser?.email },
    });

    const redirectUrl =
      fullUser?.role === "ADMIN"
        ? "/admin/dashboard"
        : fullUser?.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/student/dashboard";

    return NextResponse.json({
      success: true,
      user: fullUser,
      redirectUrl,
    });
  } catch (error) {
    console.error("Error in /api/auth/onboarding:", error);
    return NextResponse.json(
      { error: "Unable to complete onboarding. Please try again." },
      { status: 500 }
    );
  }
}
