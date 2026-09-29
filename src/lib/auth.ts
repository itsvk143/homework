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

  // Fallback to default demo student (Rahul Kumar)
  const defaultUser = await prisma.user.findFirst({
    where: { email: "rahul@classboard.com" },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  return defaultUser;
}

export async function listDemoUsers() {
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      studentProfile: {
        select: {
          classGrade: true,
          section: true,
          rollNo: true,
        },
      },
      teacherProfile: {
        select: {
          subjectSpecialty: true,
        },
      },
    },
    orderBy: { role: "asc" },
  });
}
