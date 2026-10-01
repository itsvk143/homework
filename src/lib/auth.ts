import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const ADMIN_EMAILS = [
  "admin@classboard.com",
  "itsvikash143@gmail.com",
];

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
  maxAge: 60 * 60 * 24 * 365, // 1 Year (remember and keep logged in until explicitly logged out)
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

export async function getCurrentUser(fallbackEmailOrId?: string | null) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("cb_user_id")?.value;
  const userEmailCookie = cookieStore.get("cb_user_email")?.value;

  let user = null;

  // 1. Try finding by userIdCookie
  if (userIdCookie) {
    user = await prisma.user.findUnique({
      where: { id: userIdCookie },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  // 2. Fallback to userEmailCookie if user was not found by ID (e.g. database reseed / ID change across builds)
  if (!user && userEmailCookie) {
    user = await prisma.user.findUnique({
      where: { email: userEmailCookie.toLowerCase().trim() },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  // 3. Fallback to explicit argument if passed (e.g. from header or query)
  if (!user && fallbackEmailOrId) {
    const clean = fallbackEmailOrId.trim();
    if (clean.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: clean.toLowerCase() },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: clean },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
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

  // Authentication required: No demo fallback. Returns null if not logged in.
  return null;
}

export async function listDemoUsers() {
  return [];
}
