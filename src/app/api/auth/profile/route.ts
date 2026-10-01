import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      schoolName,
      classGrade,
      section,
      rollNo,
      subjectSpecialty,
      phone,
      bio,
    } = body;

    // Role is immutable once registered - users can only modify their own profile data
    const existingRole = user.role;

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ? name.trim() : user.name,
      },
    });

    if (existingRole === "TEACHER") {
      // Upsert Teacher Profile
      await prisma.teacherProfile.upsert({
        where: { userId: user.id },
        update: {
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone !== undefined ? phone?.trim() : undefined,
          bio: bio !== undefined ? bio?.trim() : undefined,
        },
        create: {
          userId: user.id,
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone?.trim() || null,
          bio: bio?.trim() || `Teacher at ${schoolName || "ClassBoard"}`,
        },
      });
    } else if (existingRole === "STUDENT") {
      // Upsert Student Profile
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          classGrade: classGrade?.trim() || "Class 8",
          section: section?.trim() || "A",
          rollNo: rollNo !== undefined ? rollNo?.trim() : undefined,
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
      action: "PROFILE_UPDATED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: fullUser?.role, name: fullUser?.name },
    });

    return NextResponse.json({
      success: true,
      user: fullUser,
      redirectUrl:
        fullUser?.role === "TEACHER"
          ? "/teacher/dashboard"
          : "/student/dashboard",
    });
  } catch (error) {
    console.error("Error in /api/auth/profile:", error);
    return NextResponse.json(
      { error: "Unable to update profile. Please try again." },
      { status: 500 }
    );
  }
}
