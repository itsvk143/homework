import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("cb_user_id")?.value;

  if (userIdCookie) {
    const user = await prisma.user.findUnique({
      where: { id: userIdCookie },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
    if (user && user.status === "ACTIVE") {
      return user;
    }
  }

  // Authentication required: No demo fallback. Returns null if not logged in.
  return null;
}

export async function listDemoUsers() {
  return [];
}
