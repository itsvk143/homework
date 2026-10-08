import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/sync/roster
// Self-heals serverless instances by synchronizing client roster across ephemeral containers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teachers = [], students = [] } = body;

    // 1. Sync any missing teachers
    for (const t of teachers) {
      if (!t.email) continue;
      const cleanEmail = t.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existing) {
        try {
          await prisma.user.create({
            data: {
              ...(t.id ? { id: t.id } : {}),
              email: cleanEmail,
              name: t.name || cleanEmail.split("@")[0],
              role: "TEACHER",
              status: t.status || "ACTIVE",
              password: "teacher123",
              teacherProfile: {
                create: {
                  subjectSpecialty:
                    t.teacherProfile?.subjectSpecialty ||
                    t.subjectSpecialty ||
                    "Mathematics & Science",
                  phone: t.teacherProfile?.phone || t.phone || null,
                  bio: t.teacherProfile?.bio || t.bio || "Educator at LV INSTITUTE",
                },
              },
            },
          });
        } catch (e) {
          console.warn("Sync teacher skipped:", e);
        }
      }
    }

    // 2. Sync any missing students
    for (const s of students) {
      if (!s.email) continue;
      const cleanEmail = s.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existing) {
        try {
          await prisma.user.create({
            data: {
              ...(s.id ? { id: s.id } : {}),
              email: cleanEmail,
              name: s.name || cleanEmail.split("@")[0],
              role: "STUDENT",
              status: s.status || "ACTIVE",
              password: "student123",
              studentProfile: {
                create: {
                  classGrade:
                    s.studentProfile?.classGrade ||
                    s.classGrade ||
                    "NEET Dropper",
                  section: s.studentProfile?.section || s.section || "A",
                  rollNo: s.studentProfile?.rollNo || s.rollNo || null,
                  schoolName:
                    s.studentProfile?.schoolName ||
                    s.schoolName ||
                    "LV INSTITUTE",
                },
              },
            },
          });
        } catch (e) {
          console.warn("Sync student skipped:", e);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Roster synchronized successfully" });
  } catch (error) {
    console.error("Error in /api/sync/roster:", error);
    return NextResponse.json({ error: "Failed to sync roster" }, { status: 500 });
  }
}
