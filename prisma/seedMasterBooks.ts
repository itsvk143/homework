import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { MASTER_BOOKS } from "./masterBooksData";

const prisma = new PrismaClient();

export async function seedMasterBooks() {
  console.log(`📚 Seeding ${MASTER_BOOKS.length} Master Books (NCERT Classes 4–12 + JEE & NEET)...`);

  // 1. Preload existing subjects and books with all chapters and exercises in one shot
  const existingSubjects = await prisma.subject.findMany();
  const subjectMap = new Map<string, any>();
  for (const s of existingSubjects) {
    subjectMap.set(`${s.name}_${s.classGrade}`, s);
    if (s.code) {
      subjectMap.set(s.code, s);
    }
  }

  const existingBooks = await prisma.book.findMany({
    include: {
      chapters: {
        include: {
          exercises: true,
        },
      },
    },
  });
  const bookMap = new Map<string, any>();
  for (const b of existingBooks) {
    if (b.bookCode) {
      bookMap.set(b.bookCode, b);
    }
  }

  for (const bookData of MASTER_BOOKS) {
    // 1. Ensure Subject exists
    const subKey = `${bookData.subjectName}_${bookData.classGrade}`;
    let subject = (bookData.subjectCode && subjectMap.get(bookData.subjectCode)) || subjectMap.get(subKey);

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          name: bookData.subjectName,
          classGrade: bookData.classGrade,
          code: bookData.subjectCode,
          color:
            bookData.subjectName === "Mathematics"
              ? "#4F46E5"
              : bookData.subjectName === "Science" || bookData.subjectName === "Biology"
              ? "#059669"
              : bookData.subjectName === "Chemistry"
              ? "#D97706"
              : bookData.subjectName === "Physics"
              ? "#2563EB"
              : "#7C3AED",
          status: "ACTIVE",
        },
      });
      subjectMap.set(subKey, subject);
    }

    // 2. Upsert Book by bookCode
    let book = bookMap.get(bookData.bookCode);

    if (!book) {
      book = await prisma.book.create({
        data: {
          bookCode: bookData.bookCode,
          subjectId: subject.id,
          name: bookData.name,
          classGrade: bookData.classGrade,
          curriculumType: bookData.curriculumType,
          bookType: bookData.bookType,
          exam: bookData.exam || null,
          branch: bookData.branch || null,
          author: bookData.author,
          publisher: bookData.publisher,
          edition: bookData.edition,
          language: bookData.language,
          description: bookData.description,
          coverUrl: bookData.coverUrl || null,
          status: "ACTIVE",
        },
        include: {
          chapters: {
            include: {
              exercises: true,
            },
          },
        },
      });
      bookMap.set(bookData.bookCode, book);
    }

    if (!book) continue;

    // 3. Upsert Chapters and Exercises in memory cache
    const chapterMap = new Map<number, any>();
    for (const ch of book.chapters || []) {
      chapterMap.set(ch.chapterNumber, ch);
    }

    for (const chData of bookData.chapters) {
      let chapter = chapterMap.get(chData.chapterNumber);

      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            bookId: book.id,
            name: chData.name,
            chapterNumber: chData.chapterNumber,
            displayOrder: chData.chapterNumber,
            status: "ACTIVE",
          },
          include: {
            exercises: true,
          },
        });
        chapterMap.set(chData.chapterNumber, chapter);
      } else if (chapter.name !== chData.name) {
        chapter = await prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            name: chData.name,
            displayOrder: chData.chapterNumber,
          },
          include: {
            exercises: true,
          },
        });
        chapterMap.set(chData.chapterNumber, chapter);
      }

      const exerciseMap = new Map<string, any>();
      for (const ex of chapter.exercises || []) {
        exerciseMap.set(ex.exerciseNumber, ex);
      }

      for (let exIdx = 0; exIdx < chData.exercises.length; exIdx++) {
        const exData = chData.exercises[exIdx];
        const existingEx = exerciseMap.get(exData.exerciseNumber);

        if (!existingEx) {
          const createdEx = await prisma.exercise.create({
            data: {
              chapterId: chapter.id,
              name: exData.name,
              exerciseNumber: exData.exerciseNumber,
              totalQuestions: exData.totalQuestions,
              questionRange: exData.questionRange || null,
              pageNumber: exData.pageNumber || null,
              displayOrder: exIdx + 1,
              status: "ACTIVE",
            },
          });
          exerciseMap.set(exData.exerciseNumber, createdEx);
        } else {
          const needsUpdate =
            existingEx.name !== exData.name ||
            existingEx.totalQuestions !== exData.totalQuestions ||
            (existingEx.questionRange || null) !== (exData.questionRange || null) ||
            (existingEx.pageNumber || null) !== (exData.pageNumber || null) ||
            existingEx.displayOrder !== (exIdx + 1);

          if (needsUpdate) {
            const updatedEx = await prisma.exercise.update({
              where: { id: existingEx.id },
              data: {
                name: exData.name,
                totalQuestions: exData.totalQuestions,
                questionRange: exData.questionRange || null,
                pageNumber: exData.pageNumber || null,
                displayOrder: exIdx + 1,
              },
            });
            exerciseMap.set(exData.exerciseNumber, updatedEx);
          }
        }
      }

      // Remove obsolete exercises only if any exist in DB
      const validExerciseNumbers = new Set(chData.exercises.map((e) => e.exerciseNumber));
      const obsoleteExercises = (chapter.exercises || []).filter(
        (e: any) => !validExerciseNumbers.has(e.exerciseNumber)
      );

      if (obsoleteExercises.length > 0) {
        for (const obsEx of obsoleteExercises) {
          await prisma.homeworkProgressHistory.deleteMany({
            where: { exerciseId: obsEx.id },
          });
          await prisma.homeworkAssignment.deleteMany({
            where: { exerciseId: obsEx.id },
          });
          await prisma.exercise.delete({
            where: { id: obsEx.id },
          });
        }
      }
    }
  }

  // NOTE: Master books should ONLY be seeded to the Library.
  // Books and homework must NEVER be automatically assigned to real students during build/seeding.
  // Assignments must only be created dynamically by authorized teachers and admins.

  // 4. Synchronize all existing homework assignments with authoritative exercise question counts
  const allAssignments = await prisma.homeworkAssignment.findMany({
    include: { exercise: true },
  });
  for (const h of allAssignments) {
    if (!h.exercise) continue;
    const exTotal = h.exercise.totalQuestions;
    const isCompleted =
      h.exerciseStatus === "COMPLETED" ||
      h.homeworkStatus === "COMPLETED" ||
      (h.totalQuestions > 0 && h.questionsCompleted >= h.totalQuestions);
    const newCompleted = isCompleted ? exTotal : Math.min(h.questionsCompleted, exTotal);
    const newPct = exTotal > 0 ? Math.round((newCompleted / exTotal) * 100) : 0;
    const newStatus = isCompleted ? "COMPLETED" : newCompleted > 0 ? "IN_PROGRESS" : "NOT_STARTED";

    if (h.totalQuestions !== exTotal || h.questionsCompleted !== newCompleted || h.progressPercentage !== newPct) {
      await prisma.homeworkAssignment.update({
        where: { id: h.id },
        data: {
          totalQuestions: exTotal,
          questionsCompleted: newCompleted,
          progressPercentage: newPct,
          exerciseStatus: newStatus,
          homeworkStatus: isCompleted ? "COMPLETED" : h.homeworkStatus,
        },
      });
    }
  }

  console.log("✅ Master Book Library and Chapter Progress seeding completed successfully!");
}

if (require.main === module) {
  seedMasterBooks()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
