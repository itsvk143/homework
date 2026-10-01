import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { isAdminEmail, SESSION_COOKIE_OPTIONS, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      schoolName,
      classGrade,
      section,
      rollNo,
      subjectSpecialty,
      phone,
      bio,
    } = body;

    // 1. Validate basic required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSysAdmin = isAdminEmail(cleanEmail);
    const chosenRole = isSysAdmin
      ? "ADMIN"
      : role === "TEACHER"
      ? "TEACHER"
      : "STUDENT";

    // 2. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // 3. Create user with appropriate role profile
    let newUser;
    if (chosenRole === "ADMIN") {
      newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: password,
          role: "ADMIN",
          status: "ACTIVE",
        },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
    } else if (chosenRole === "TEACHER") {
      newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: password,
          role: "TEACHER",
          status: "ACTIVE",
          teacherProfile: {
            create: {
              subjectSpecialty:
                subjectSpecialty?.trim() || "General Academic",
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
    } else {
      newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: password,
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
          teacherProfile: true,
        },
      });
    }

    // 4. Log audit event
    await logAuditEvent({
      action: "USER_SIGNUP",
      entityType: "User",
      entityId: newUser.id,
      metadata: {
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
    });

    // 5. Determine redirection
    const redirectUrl =
      newUser.role === "ADMIN"
        ? "/admin/dashboard"
        : newUser.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/student/dashboard";

    const sessionToken = createSessionToken(newUser);

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        studentProfile: newUser.studentProfile,
        teacherProfile: newUser.teacherProfile,
      },
      sessionToken,
      redirectUrl,
    });

    // 6. Set persistent session cookies (1 year duration)
    response.cookies.set("cb_user_id", newUser.id, SESSION_COOKIE_OPTIONS);
    response.cookies.set("cb_user_email", newUser.email.toLowerCase().trim(), SESSION_COOKIE_OPTIONS);
    response.cookies.set("cb_user_role", newUser.role, SESSION_COOKIE_OPTIONS);
    if (sessionToken) {
      response.cookies.set("cb_session", sessionToken, SESSION_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error("Error in /api/auth/signup:", error);
    return NextResponse.json(
      { error: "Unable to create account right now. Please try again." },
      { status: 500 }
    );
  }
}
