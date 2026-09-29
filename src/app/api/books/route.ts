import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const curriculumType = searchParams.get("curriculumType");
    const classGrade = searchParams.get("classGrade");
    const exam = searchParams.get("exam");
    const branch = searchParams.get("branch");
    const bookType = searchParams.get("bookType");
    const search = searchParams.get("search")?.trim().toLowerCase();

    const whereClause: any = {
      status: { not: "ARCHIVED" },
    };

    if (subjectId && subjectId !== "ALL") {
      whereClause.subjectId = subjectId;
    }
    if (curriculumType && curriculumType !== "ALL") {
      whereClause.curriculumType = curriculumType;
    }
    if (classGrade && classGrade !== "ALL") {
      whereClause.classGrade = classGrade;
    }
    if (exam && exam !== "ALL") {
      whereClause.exam = exam;
    }
    if (branch && branch !== "ALL") {
      whereClause.branch = branch;
    }
    if (bookType && bookType !== "ALL") {
      whereClause.bookType = bookType;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { author: { contains: search } },
        { publisher: { contains: search } },
        { branch: { contains: search } },
        { subject: { name: { contains: search } } },
      ];
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        subject: true,
        chapters: {
          where: { status: { not: "ARCHIVED" } },
          orderBy: { chapterNumber: "asc" },
          include: {
            exercises: {
              where: { status: { not: "ARCHIVED" } },
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        _count: {
          select: { chapters: true, homeworks: true, studentBooks: true },
        },
      },
      orderBy: [
        { curriculumType: "asc" },
        { classGrade: "asc" },
        { displayOrder: "asc" },
      ],
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectId,
      name,
      classGrade,
      author,
      publisher,
      isbn,
      description,
      coverUrl,
      displayOrder,
      curriculumType,
      bookType,
      exam,
      branch,
      edition,
      language,
      chapters,
    } = body;

    if (!subjectId || !name?.trim()) {
      return NextResponse.json({ error: "Subject and Book name are required" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        subjectId,
        name: name.trim(),
        classGrade: classGrade || "Class 8",
        curriculumType: curriculumType || "NCERT",
        bookType: bookType || "NCERT",
        exam: exam || null,
        branch: branch || null,
        edition: edition || "2025–26 Edition",
        language: language || "English",
        author: author?.trim() || null,
        publisher: publisher?.trim() || null,
        isbn: isbn?.trim() || null,
        description: description?.trim() || null,
        coverUrl: coverUrl?.trim() || null,
        displayOrder: Number(displayOrder) || 1,
        status: "ACTIVE",
        chapters:
          chapters && Array.isArray(chapters) && chapters.length > 0
            ? {
                create: chapters
                  .filter((c: any) => c.name && c.name.trim())
                  .map((ch: any, idx: number) => ({
                    name: ch.name.trim(),
                    chapterNumber: Number(ch.chapterNumber) || idx + 1,
                    displayOrder: Number(ch.chapterNumber) || idx + 1,
                    description: ch.description || null,
                    status: "ACTIVE",
                    exercises:
                      ch.exercises && Array.isArray(ch.exercises) && ch.exercises.length > 0
                        ? {
                            create: ch.exercises
                              .filter((e: any) => e.name && e.name.trim())
                              .map((ex: any, exIdx: number) => ({
                                name: ex.name.trim(),
                                exerciseNumber:
                                  ex.exerciseNumber ||
                                  `${Number(ch.chapterNumber) || idx + 1}.${exIdx + 1}`,
                                totalQuestions: Number(ex.totalQuestions) || 10,
                                questionRange: ex.questionRange || null,
                                pageNumber: ex.pageNumber ? Number(ex.pageNumber) : null,
                                status: "ACTIVE",
                              })),
                          }
                        : undefined,
                  })),
              }
            : undefined,
      },
      include: {
        subject: true,
        chapters: {
          include: {
            exercises: true,
          },
        },
      },
    });

    await logAuditEvent({
      action: "CREATE_BOOK",
      entityType: "Book",
      entityId: book.id,
      metadata: { name: book.name, subjectId, exam, branch, curriculumType, chaptersCount: chapters?.length || 0 },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
