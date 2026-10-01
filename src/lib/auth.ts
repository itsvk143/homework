import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";

export const ADMIN_EMAILS = [
  "admin@classboard.com",
  "itsvikash143@gmail.com",
];

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "classboard-persistent-auth-secret-2026-v2";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.toLowerCase()
        .split(",")
        .map((e) => e.trim())
    : [];
  return ADMIN_EMAILS.includes(clean) || envAdmins.includes(clean);
}

export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 Year persistent session (remember and keep logged in until explicitly logged out)
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const SESSION_CLEAR_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 0,
  expires: new Date(0),
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolName?: string;
  classGrade?: string;
  subjectSpecialty?: string;
  phone?: string;
  ts: number;
}

// Create a tamper-proof signed session token
export function createSessionToken(user: any): string {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name || "",
    role: user.role || "STUDENT",
    schoolName:
      user.studentProfile?.schoolName ||
      user.teacherProfile?.bio ||
      "ClassBoard Academy",
    classGrade: user.studentProfile?.classGrade || "",
    subjectSpecialty: user.teacherProfile?.subjectSpecialty || "",
    phone: user.teacherProfile?.phone || "",
    ts: Date.now(),
  };

  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

// Verify and decode a session token
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  try {
    const [data, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(data)
      .digest("base64url");

    if (signature !== expectedSig) {
      return null;
    }

    const json = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(
  fallbackEmailOrId?: string | null,
  fallbackToken?: string | null,
  fallbackRole?: string | null
) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("cb_user_id")?.value;
  const userEmailCookie = cookieStore.get("cb_user_email")?.value;
  const sessionTokenCookie = cookieStore.get("cb_session")?.value;
  const userRoleCookie = cookieStore.get("cb_user_role")?.value;

  // Verify session token from cookie or fallback
  const verifiedSession =
    verifySessionToken(sessionTokenCookie) ||
    verifySessionToken(fallbackToken);

  let user = null;

  // 1. Try finding by userIdCookie or verified session id
  const targetId = verifiedSession?.id || userIdCookie;
  if (targetId) {
    user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  // 2. Try finding by email
  const targetEmail = (
    verifiedSession?.email ||
    userEmailCookie ||
    (fallbackEmailOrId?.includes("@") ? fallbackEmailOrId : null)
  )?.toLowerCase().trim();

  if (!user && targetEmail) {
    user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  // 3. Try finding by explicit fallback ID
  if (!user && fallbackEmailOrId && !fallbackEmailOrId.includes("@")) {
    user = await prisma.user.findUnique({
      where: { id: fallbackEmailOrId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  // 4. CRITICAL SELF-HEALING RESTORATION:
  // In serverless environments (like Vercel), instances can be recycled or cold-started with a clean DB.
  // If the user has a verified session cookie or email cookie, automatically restore their account
  // in the local database so they are NEVER logged out and NEVER asked to sign up or onboard again!
  if (!user && targetEmail) {
    const isSysAdmin = isAdminEmail(targetEmail);
    const candidateRole =
      (isSysAdmin ? "ADMIN" : verifiedSession?.role || userRoleCookie || fallbackRole || "STUDENT") as string;
    const finalRole = isSysAdmin ? "ADMIN" : candidateRole === "PENDING" ? "STUDENT" : candidateRole;
    const targetName = verifiedSession?.name || targetEmail.split("@")[0];

    try {
      user = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
          name: targetName,
          role: finalRole,
          status: "ACTIVE",
        },
        create: {
          ...(targetId ? { id: targetId } : {}),
          email: targetEmail,
          name: targetName,
          role: finalRole,
          status: "ACTIVE",
          ...(finalRole === "TEACHER"
            ? {
                teacherProfile: {
                  create: {
                    subjectSpecialty:
                      verifiedSession?.subjectSpecialty || "Mathematics & Science",
                    phone: verifiedSession?.phone || null,
                    bio: `Teacher at ${verifiedSession?.schoolName || "ClassBoard"}`,
                  },
                },
              }
            : {
                studentProfile: {
                  create: {
                    classGrade: verifiedSession?.classGrade || "Class 8",
                    section: "A",
                    schoolName: verifiedSession?.schoolName || "Delhi Public School",
                  },
                },
              }),
        },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
    } catch (e) {
      console.warn("Self-healing user restore skipped:", e);
    }
  }

  if (user && user.status === "ACTIVE") {
    // Auto-elevate to ADMIN if email matches administrator list
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
    return user;
  }

  // Authentication required: Returns null only if no session exists
  return null;
}

export async function listDemoUsers() {
  return [];
}
