import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        students: [],
        teachers: [],
        subjects: [],
        books: [],
        chapters: [],
        exercises: [],
        homework: [],
      });
    }

    const [students, teachers, subjects, books, chapters, exercises, homework] = await Promise.all([
      // 1. Students
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          OR: [{ name: { contains: q } }, { email: { contains: q } }],
        },
        include: {
          studentProfile: true,
          _count: { select: { studentAssignments: true } },
        },
        take: 5,
      }),

      // 2. Teachers
      prisma.user.findMany({
        where: {
          role: "TEACHER",
          OR: [{ name: { contains: q } }, { email: { contains: q } }],
        },
        include: { teacherProfile: true },
        take: 5,
      }),

      // 3. Subjects
      prisma.subject.findMany({
        where: {
          OR: [{ name: { contains: q } }, { code: { contains: q } }],
          status: { not: "ARCHIVED" },
        },
        take: 5,
      }),

      // 4. Books
      prisma.book.findMany({
        where: {
          OR: [{ name: { contains: q } }, { author: { contains: q } }],
          status: { not: "ARCHIVED" },
        },
        include: { subject: true },
        take: 5,
      }),

      // 5. Chapters
      prisma.chapter.findMany({
        where: {
          name: { contains: q },
          status: { not: "ARCHIVED" },
        },
        include: { book: { include: { subject: true } } },
        take: 5,
      }),

      // 6. Exercises
      prisma.exercise.findMany({
        where: {
          OR: [{ name: { contains: q } }, { exerciseNumber: { contains: q } }],
          status: { not: "ARCHIVED" },
        },
        include: { chapter: { include: { book: true } } },
        take: 5,
      }),

      // 7. Homework
      prisma.homeworkAssignment.findMany({
        where: {
          OR: [
            { student: { name: { contains: q } } },
            { exercise: { name: { contains: q } } },
            { book: { name: { contains: q } } },
          ],
        },
        include: {
          student: { select: { name: true } },
          exercise: true,
          book: true,
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      query: q,
      results: {
        students,
        teachers,
        subjects,
        books,
        chapters,
        exercises,
        homework,
      },
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
