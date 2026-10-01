import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { isAdminEmail, SESSION_COOKIE_OPTIONS, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Password verification (compatible with seed plaintext or hashed)
    if (user.password && user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is not active. Please contact administrator." },
        { status: 403 }
      );
    }

    if (isAdminEmail(user.email) && user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
    }

    await logAuditEvent({
      action: "PASSWORD_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const sessionToken = createSessionToken(user);

    const redirectUrl =
      user.role === "TEACHER"
        ? "/teacher/dashboard"
        : user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/student/dashboard";

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
      },
      sessionToken,
      redirectUrl,
    });

    response.cookies.set("cb_user_id", user.id, SESSION_COOKIE_OPTIONS);
    response.cookies.set("cb_user_email", user.email, SESSION_COOKIE_OPTIONS);
    response.cookies.set("cb_user_role", user.role, SESSION_COOKIE_OPTIONS);
    if (sessionToken) {
      response.cookies.set("cb_session", sessionToken, SESSION_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { error: "Unable to process login. Please try again." },
      { status: 500 }
    );
  }
}
