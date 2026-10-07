import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  isAdminEmail,
  createSessionToken,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getNextRollNumber } from "@/lib/rollNumber";

export async function POST(req: NextRequest) {
  try {
    const headerUserId = req.headers.get("x-user-id");
    const headerUserEmail = req.headers.get("x-user-email");
    const headerUserRole = req.headers.get("x-user-role");
    const headerSessionToken = req.headers.get("x-session-token");
    const fallback = headerUserEmail || headerUserId;

    const user = await getCurrentUser(fallback, headerSessionToken, headerUserRole);
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
          bio: `Teacher at ${schoolName?.trim() || "LV INSTITUTE"}`,
        },
        create: {
          userId: user.id,
          subjectSpecialty: subjectSpecialty?.trim() || "Mathematics & Science",
          phone: phone?.trim() || null,
          bio: `Teacher at ${schoolName?.trim() || "LV INSTITUTE"}`,
        },
      });
    } else if (finalRole === "STUDENT") {
      const targetGrade = classGrade?.trim() || "NEET Dropper";
      const targetSection = section?.trim() || "A";
      const targetSchool = schoolName?.trim() || "LV INSTITUTE";

      let finalRollNo = rollNo?.trim();
      if (!finalRollNo) {
        finalRollNo = await getNextRollNumber(targetGrade, targetSection);
      }

      // Upsert student profile
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          classGrade: targetGrade,
          section: targetSection,
          rollNo: finalRollNo,
          schoolName: targetSchool,
        },
        create: {
          userId: user.id,
          classGrade: targetGrade,
          section: targetSection,
          rollNo: finalRollNo,
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
      action: "ROLE_ONBOARDING_COMPLETED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: fullUser?.role, email: fullUser?.email },
    });

    const sessionToken = createSessionToken(fullUser);

    const redirectUrl =
      fullUser?.role === "ADMIN"
        ? "/admin/dashboard"
        : fullUser?.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/student/dashboard";

    const response = NextResponse.json({
      success: true,
      user: fullUser,
      sessionToken,
      redirectUrl,
    });

    if (fullUser) {
      response.cookies.set("cb_user_id", fullUser.id, SESSION_COOKIE_OPTIONS);
      response.cookies.set("cb_user_email", fullUser.email, SESSION_COOKIE_OPTIONS);
      response.cookies.set("cb_user_role", fullUser.role, SESSION_COOKIE_OPTIONS);
      if (sessionToken) {
        response.cookies.set("cb_session", sessionToken, SESSION_COOKIE_OPTIONS);
      }
    }

    return response;
  } catch (error) {
    console.error("Error in /api/auth/onboarding:", error);
    return NextResponse.json(
      { error: "Unable to complete onboarding. Please try again." },
      { status: 500 }
    );
  }
}
