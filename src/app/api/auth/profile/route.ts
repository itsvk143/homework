import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getNextRollNumber } from "@/lib/rollNumber";

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
          bio: bio?.trim() || `Teacher at ${schoolName || "LV INSTITUTE"}`,
        },
      });
    } else if (existingRole === "STUDENT") {
      const targetGrade = classGrade?.trim() || "NEET Dropper";
      const targetSection = section?.trim() || "A";
      const targetSchool = schoolName?.trim() || "LV INSTITUTE";

      let finalRollNo = rollNo !== undefined ? rollNo?.trim() : undefined;
      if (finalRollNo === "") finalRollNo = undefined;

      // If user has no roll number in DB and didn't provide one, compute next roll number
      const existingProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile?.rollNo && !finalRollNo) {
        finalRollNo = await getNextRollNumber(targetGrade, targetSection);
      }

      // Upsert Student Profile
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          classGrade: targetGrade,
          section: targetSection,
          rollNo: finalRollNo !== undefined ? finalRollNo : existingProfile?.rollNo,
          schoolName: targetSchool,
        },
        create: {
          userId: user.id,
          classGrade: targetGrade,
          section: targetSection,
          rollNo: finalRollNo || (await getNextRollNumber(targetGrade, targetSection)),
          schoolName: targetSchool,
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
