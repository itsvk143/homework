import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { isAdminEmail } from "@/lib/auth";

// In-memory rate limiting map: ip -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Check
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in a few moments." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      credential,
      role: requestedRole,
      classGrade,
      section,
      rollNo,
      schoolName,
      subjectSpecialty,
      phone,
    } = body;

    // 2. Validate request
    if (!credential || typeof credential !== "string") {
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 400 }
      );
    }

    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "";

    if (!clientId) {
      console.warn("GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured.");
      return NextResponse.json(
        {
          error:
            "Google Client ID is not configured on the server. Please configure GOOGLE_CLIENT_ID in environment variables.",
        },
        { status: 503 }
      );
    }

    // 3. Verify the Google ID token using official Google OAuth2Client
    const oauth2Client = new OAuth2Client(clientId);
    let payload;

    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr: any) {
      // Do NOT log token or expose stack trace to user
      console.error("Google ID token verification failed");
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 401 }
      );
    }

    // 4. Validate Issuer
    const issuer = payload.iss;
    if (issuer !== "accounts.google.com" && issuer !== "https://accounts.google.com") {
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 401 }
      );
    }

    // 5. Validate Audience
    const aud = payload.aud;
    if (aud !== clientId) {
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 401 }
      );
    }

    // 6. Validate Expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return NextResponse.json(
        { error: "Google authentication could not be verified. Please try again." },
        { status: 401 }
      );
    }

    // 7. Extract Verified Google Identity
    const googleSub = payload.sub; // Permanent Google User ID
    const email = payload.email?.toLowerCase().trim();
    const name = payload.name?.trim() || "Google User";
    const avatarUrl = payload.picture || null;

    if (!googleSub || !email) {
      return NextResponse.json(
        { error: "Google profile information incomplete. Please try again." },
        { status: 400 }
      );
    }

    const isAdmin = isAdminEmail(email);

    // 8. Find corresponding application user by permanent google_provider_id
    let user = await prisma.user.findUnique({
      where: { google_provider_id: googleSub },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (user) {
      // Existing Google account is already connected
      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Your account is not active. Please contact support." },
          { status: 403 }
        );
      }
      if (isAdmin && user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
          include: {
            studentProfile: true,
            teacherProfile: true,
          },
        });
      }
    } else {
      // Check if an existing account uses the same email
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });

      if (existingEmailUser) {
        // Link Google OAuth and ensure admin elevation if applicable
        user = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            google_provider_id: googleSub,
            avatarUrl: avatarUrl || existingEmailUser.avatarUrl,
            role: isAdmin ? "ADMIN" : existingEmailUser.role,
          },
          include: {
            studentProfile: true,
            teacherProfile: true,
          },
        });
      } else {
        // Create new user with chosen role, or PENDING if not yet selected
        const targetRole = isAdmin
          ? "ADMIN"
          : requestedRole === "TEACHER"
          ? "TEACHER"
          : requestedRole === "STUDENT"
          ? "STUDENT"
          : "PENDING";

        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
            google_provider_id: googleSub,
            role: targetRole,
            status: "ACTIVE",
            ...(targetRole === "TEACHER"
              ? {
                  teacherProfile: {
                    create: {
                      subjectSpecialty:
                        subjectSpecialty?.trim() || "Mathematics & Science",
                      phone: phone?.trim() || null,
                      bio: `Teacher at ${schoolName || "ClassBoard"}`,
                    },
                  },
                }
              : targetRole === "STUDENT"
              ? {
                  studentProfile: {
                    create: {
                      classGrade: classGrade?.trim() || "Class 8",
                      section: section?.trim() || "A",
                      rollNo: rollNo?.trim() || null,
                      schoolName: schoolName?.trim() || "Delhi Public School",
                    },
                  },
                }
              : {}),
          },
          include: {
            studentProfile: true,
            teacherProfile: true,
          },
        });

        await logAuditEvent({
          action: "GOOGLE_OAUTH_REGISTER",
          entityType: "User",
          entityId: user.id,
          metadata: { email: user.email, role: user.role, name: user.name },
        });
      }
    }

    // 9. Audit event for login
    await logAuditEvent({
      action: "GOOGLE_OAUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });

    // 10. Determine redirect based on existing role:
    // If new user has not selected role (PENDING or placeholder Online Student), redirect to /onboarding
    const needsOnboarding =
      user.role === "PENDING" ||
      (!isAdmin &&
        user.role === "STUDENT" &&
        user.studentProfile?.schoolName === "Online Student" &&
        user.studentProfile?.classGrade === "Class 11 & 12");

    const redirectUrl =
      user.role === "ADMIN"
        ? "/admin/dashboard"
        : needsOnboarding
        ? "/onboarding"
        : user.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/student/dashboard";

    // 11. Create normal application session via cookie
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
      redirectUrl,
    });

    response.cookies.set("cb_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Error in /auth/google handler");
    return NextResponse.json(
      { error: "Unable to sign in with Google right now. Please try again later." },
      { status: 500 }
    );
  }
}
