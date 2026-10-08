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

    const andClauses: any[] = [{ status: { not: "ARCHIVED" } }];

    if (subjectId && subjectId !== "ALL") {
      andClauses.push({ subjectId });
    }
    if (curriculumType && curriculumType !== "ALL") {
      andClauses.push({ curriculumType });
    }
    if (exam && exam !== "ALL") {
      andClauses.push({ exam });
    }
    if (branch && branch !== "ALL") {
      andClauses.push({ branch });
    }
    if (bookType && bookType !== "ALL") {
      andClauses.push({ bookType });
    }

    if (classGrade && classGrade !== "ALL") {
      const lower = classGrade.trim().toLowerCase();

      // Rule: Books of CLASS 11 & 12 JEE show to: Class 11, Class 11 JEE, Class 12, Class 12 JEE, JEE Dropper
      // Rule: Books of CLASS 11 & 12 NEET show to: Class 11, Class 11 NEET, Class 12, Class 12 NEET, NEET Dropper

      if (lower === "class 11") {
        // Shows Class 11 books, plus Class 11 & 12 books (both JEE and NEET)
        andClauses.push({
          OR: [
            { classGrade: "Class 11" },
            { classGrade: "Class 11 & 12" },
          ],
        });
      } else if (lower === "class 12") {
        // Shows Class 12 books, plus Class 11 & 12 books (both JEE and NEET)
        andClauses.push({
          OR: [
            { classGrade: "Class 12" },
            { classGrade: "Class 11 & 12" },
          ],
        });
      } else if (lower === "class 11 jee") {
        // Books of Class 11, Class 11 JEE, and Class 11 & 12 JEE
        andClauses.push({
          OR: [
            { classGrade: "Class 11 JEE" },
            { classGrade: "Class 11" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "JEE" }, { exam: "JEE" }, { name: { contains: "JEE" } }],
            },
          ],
        });
      } else if (lower === "class 12 jee") {
        // Books of Class 12, Class 12 JEE, and Class 11 & 12 JEE
        andClauses.push({
          OR: [
            { classGrade: "Class 12 JEE" },
            { classGrade: "Class 12" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "JEE" }, { exam: "JEE" }, { name: { contains: "JEE" } }],
            },
          ],
        });
      } else if (lower.includes("jee") && lower.includes("drop")) {
        // Books of JEE Dropper, Class 11 & 12 JEE, and all JEE exam books
        andClauses.push({
          OR: [
            { classGrade: "JEE Dropper" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "JEE" }, { exam: "JEE" }, { name: { contains: "JEE" } }],
            },
            { curriculumType: "JEE" },
            { exam: "JEE" },
          ],
        });
      } else if (lower === "class 11 neet") {
        // Books of Class 11, Class 11 NEET, and Class 11 & 12 NEET
        andClauses.push({
          OR: [
            { classGrade: "Class 11 NEET" },
            { classGrade: "Class 11" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "NEET" }, { exam: "NEET" }, { name: { contains: "NEET" } }],
            },
          ],
        });
      } else if (lower === "class 12 neet") {
        // Books of Class 12, Class 12 NEET, and Class 11 & 12 NEET
        andClauses.push({
          OR: [
            { classGrade: "Class 12 NEET" },
            { classGrade: "Class 12" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "NEET" }, { exam: "NEET" }, { name: { contains: "NEET" } }],
            },
          ],
        });
      } else if (lower.includes("neet") && lower.includes("drop")) {
        // Books of NEET Dropper, Class 11 & 12 NEET, and all NEET exam books
        andClauses.push({
          OR: [
            { classGrade: "NEET Dropper" },
            {
              classGrade: "Class 11 & 12",
              OR: [{ curriculumType: "NEET" }, { exam: "NEET" }, { name: { contains: "NEET" } }],
            },
            { curriculumType: "NEET" },
            { exam: "NEET" },
          ],
        });
      } else {
        andClauses.push({ classGrade: classGrade.trim() });
      }
    }

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search } },
          { author: { contains: search } },
          { publisher: { contains: search } },
          { branch: { contains: search } },
          { subject: { name: { contains: search } } },
        ],
      });
    }

    const whereClause: any = andClauses.length > 1 ? { AND: andClauses } : andClauses[0];

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
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
      status,
      chapters,
    } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "Book ID and name are required" }, { status: 400 });
    }

    // 1. Update book metadata
    await prisma.book.update({
      where: { id },
      data: {
        ...(subjectId ? { subjectId } : {}),
        name: name.trim(),
        ...(classGrade ? { classGrade } : {}),
        ...(curriculumType ? { curriculumType } : {}),
        ...(bookType ? { bookType } : {}),
        exam: exam !== undefined ? (exam || null) : undefined,
        branch: branch !== undefined ? (branch || null) : undefined,
        edition: edition !== undefined ? edition : undefined,
        language: language !== undefined ? language : undefined,
        author: author !== undefined ? (author?.trim() || null) : undefined,
        publisher: publisher !== undefined ? (publisher?.trim() || null) : undefined,
        isbn: isbn !== undefined ? (isbn?.trim() || null) : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        coverUrl: coverUrl !== undefined ? (coverUrl?.trim() || null) : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        status: status || undefined,
      },
    });

    // 2. Synchronize chapters and exercises if chapters are provided
    if (chapters && Array.isArray(chapters)) {
      const existingChapters = await prisma.chapter.findMany({
        where: { bookId: id },
        include: { exercises: true },
      });

      const existingChapterIds = new Set(existingChapters.map((c) => c.id));
      const incomingChapterIds = new Set(chapters.filter((c: any) => c.id).map((c: any) => c.id));

      // Handle removed chapters: if safe to delete (no homework assignments linked), delete; otherwise set status to INACTIVE
      for (const exCh of existingChapters) {
        if (!incomingChapterIds.has(exCh.id)) {
          const hwCount = await prisma.homeworkAssignment.count({ where: { chapterId: exCh.id } });
          if (hwCount === 0) {
            await prisma.exercise.deleteMany({ where: { chapterId: exCh.id } });
            await prisma.chapter.delete({ where: { id: exCh.id } });
          } else {
            await prisma.chapter.update({ where: { id: exCh.id }, data: { status: "INACTIVE" } });
          }
        }
      }

      // Upsert incoming chapters and exercises
      for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
        const ch = chapters[chIdx];
        if (!ch.name?.trim()) continue;
        const chNum = Number(ch.chapterNumber) || chIdx + 1;

        let chapterRecord;
        if (ch.id && existingChapterIds.has(ch.id)) {
          chapterRecord = await prisma.chapter.update({
            where: { id: ch.id },
            data: {
              name: ch.name.trim(),
              chapterNumber: chNum,
              displayOrder: chNum,
              description: ch.description || null,
              status: "ACTIVE",
            },
          });
        } else {
          chapterRecord = await prisma.chapter.create({
            data: {
              bookId: id,
              name: ch.name.trim(),
              chapterNumber: chNum,
              displayOrder: chNum,
              description: ch.description || null,
              status: "ACTIVE",
            },
          });
        }

        if (ch.exercises && Array.isArray(ch.exercises)) {
          const existingExs = await prisma.exercise.findMany({
            where: { chapterId: chapterRecord.id },
          });
          const existingExMap = new Map(existingExs.map((e) => [e.id, e]));
          const incomingExIds = new Set(ch.exercises.filter((e: any) => e.id).map((e: any) => e.id));

          // Handle removed exercises
          for (const ex of existingExs) {
            if (!incomingExIds.has(ex.id)) {
              const exHwCount = await prisma.homeworkAssignment.count({ where: { exerciseId: ex.id } });
              if (exHwCount === 0) {
                await prisma.exercise.delete({ where: { id: ex.id } });
              } else {
                await prisma.exercise.update({ where: { id: ex.id }, data: { status: "INACTIVE" } });
              }
            }
          }

          // Upsert exercises
          for (let exIdx = 0; exIdx < ch.exercises.length; exIdx++) {
            const ex = ch.exercises[exIdx];
            if (!ex.name?.trim()) continue;
            const exNum = ex.exerciseNumber || `${chNum}.${exIdx + 1}`;
            const qCount = Math.max(1, Number(ex.totalQuestions) || 10);

            if (ex.id && existingExMap.has(ex.id)) {
              await prisma.exercise.update({
                where: { id: ex.id },
                data: {
                  name: ex.name.trim(),
                  exerciseNumber: exNum,
                  totalQuestions: qCount,
                  displayOrder: exIdx + 1,
                  status: "ACTIVE",
                },
              });
            } else {
              await prisma.exercise.create({
                data: {
                  chapterId: chapterRecord.id,
                  name: ex.name.trim(),
                  exerciseNumber: exNum,
                  totalQuestions: qCount,
                  displayOrder: exIdx + 1,
                  status: "ACTIVE",
                },
              });
            }
          }
        }
      }
    }

    const fullBook = await prisma.book.findUnique({
      where: { id },
      include: {
        subject: true,
        chapters: {
          include: { exercises: true },
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    await logAuditEvent({
      action: "UPDATE_BOOK",
      entityType: "Book",
      entityId: id,
      metadata: { name: fullBook?.name, chaptersCount: fullBook?.chapters.length },
    });

    return NextResponse.json({ book: fullBook });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

