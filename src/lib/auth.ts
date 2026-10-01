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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("cb_user_id")?.value;

  if (userIdCookie) {
    let user = await prisma.user.findUnique({
      where: { id: userIdCookie },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
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
  }

  // Authentication required: No demo fallback. Returns null if not logged in.
  return null;
}

export async function listDemoUsers() {
  return [];
}
