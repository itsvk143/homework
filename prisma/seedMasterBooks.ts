import { PrismaClient } from "@prisma/client";
import { MASTER_BOOKS } from "./masterBooksData";

const prisma = new PrismaClient();

export async function seedMasterBooks() {
  console.log(`📚 Seeding ${MASTER_BOOKS.length} Master Books (NCERT Classes 4–12 + JEE & NEET)...`);

  for (const bookData of MASTER_BOOKS) {
    // 1. Ensure Subject exists
    let subject = await prisma.subject.findFirst({
      where: { name: bookData.subjectName, classGrade: bookData.classGrade },
    });

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
    }

    // 2. Upsert Book by bookCode
    const existingBook = await prisma.book.findUnique({
      where: { bookCode: bookData.bookCode },
    });

    let book = existingBook;

    if (!existingBook) {
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
      });
    }

    if (!book) continue;

    // 3. Upsert Chapters and Exercises
    for (const chData of bookData.chapters) {
      let chapter = await prisma.chapter.findFirst({
        where: { bookId: book.id, chapterNumber: chData.chapterNumber },
      });

      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            bookId: book.id,
            name: chData.name,
            chapterNumber: chData.chapterNumber,
            displayOrder: chData.chapterNumber,
            status: "ACTIVE",
          },
        });
      }

      for (const exData of chData.exercises) {
        const existingEx = await prisma.exercise.findFirst({
          where: { chapterId: chapter.id, exerciseNumber: exData.exerciseNumber },
        });

        if (!existingEx) {
          await prisma.exercise.create({
            data: {
              chapterId: chapter.id,
              name: exData.name,
              exerciseNumber: exData.exerciseNumber,
              totalQuestions: exData.totalQuestions,
              questionRange: exData.questionRange || null,
              pageNumber: exData.pageNumber || null,
              status: "ACTIVE",
            },
          });
        }
      }
    }
  }

  // Seed sample assignments for students (Aman, Priya, Rahul, Ananya, Rohit)
  const students = await prisma.user.findMany({ where: { role: "STUDENT" } });
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });

  if (teacher && students.length > 0) {
    const neetAvasthiBook = await prisma.book.findFirst({
      where: { bookCode: "NEET_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI" },
      include: {
        chapters: {
          where: { chapterNumber: 1 },
          include: { exercises: { orderBy: { exerciseNumber: "asc" } } },
        },
      },
    });

    if (neetAvasthiBook && neetAvasthiBook.chapters[0]) {
      const moleChapter = neetAvasthiBook.chapters[0];
      const exercises = moleChapter.exercises;

      // Assign book to students
      for (const st of students) {
        await prisma.studentBook.upsert({
          where: { studentId_bookId: { studentId: st.id, bookId: neetAvasthiBook.id } },
          create: { studentId: st.id, bookId: neetAvasthiBook.id, assignedByTeacherId: teacher.id },
          update: {},
        });
      }

      // Sample progress patterns matching Section 133
      // Rahul: Ex1: 20/20, Ex2: 15/20, Ex3: 10/15, Ex4: 0/20, Ex5: 12/12
      // Aman: Ex1: 20/20, Ex2: 20/20, Ex3: 15/15, Ex4: 18/20, Ex5: 12/12
      // Priya: Ex1: 10/20, Ex2: 0/20, Ex3: 8/15, Ex4: 0/20 (overdue), Ex5: 0/12
      // Ananya: Ex1: 20/20, Ex2: 20/20, Ex3: 15/15, Ex4: 15/20, Ex5: 10/12
      // Rohit: Ex1: 4/20, Ex2: 8/20, Ex3: 0/15, Ex4: 0/20 (overdue), Ex5: 6/12
      const progressMap: Record<string, number[]> = {
        "rahul@classboard.com": [20, 15, 10, 0, 12],
        "aman@classboard.com": [20, 20, 15, 18, 12],
        "priya@classboard.com": [10, 0, 8, 0, 0],
        "ananya@classboard.com": [20, 20, 15, 15, 10],
        "rohit@classboard.com": [4, 8, 0, 0, 6],
      };

      const now = new Date();
      const pastDue = new Date(Date.now() - 24 * 3600 * 1000);
      const futureDue = new Date(Date.now() + 4 * 24 * 3600 * 1000);

      for (const st of students) {
        const studentProgress = progressMap[st.email];
        if (!studentProgress) continue;

        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          const completed = studentProgress[i] ?? 0;
          const total = ex.totalQuestions;
          const pct = Math.round((completed / total) * 100);

          let exStatus = "NOT_STARTED";
          let hwStatus = "ASSIGNED";
          if (completed >= total) {
            exStatus = "COMPLETED";
            hwStatus = "COMPLETED";
          } else if (completed > 0) {
            exStatus = "IN_PROGRESS";
            hwStatus = "IN_PROGRESS";
          }

          // Exercise 4 for Priya and Rohit is overdue
          const isOverdue = (st.email === "priya@classboard.com" || st.email === "rohit@classboard.com") && i === 3;
          const dueDate = isOverdue ? pastDue : futureDue;
          if (isOverdue && exStatus !== "COMPLETED") {
            hwStatus = "OVERDUE";
          }

          const existingHw = await prisma.homeworkAssignment.findFirst({
            where: {
              studentId: st.id,
              exerciseId: ex.id,
            },
          });

          if (!existingHw) {
            const hw = await prisma.homeworkAssignment.create({
              data: {
                studentId: st.id,
                teacherId: teacher.id,
                subjectId: neetAvasthiBook.subjectId,
                bookId: neetAvasthiBook.id,
                chapterId: moleChapter.id,
                exerciseId: ex.id,
                assignedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                dueDate,
                instructions: `Solve all objective questions of ${ex.name} from Narendra Avasthi Physical Chemistry.`,
                totalQuestions: total,
                questionsCompleted: completed,
                progressPercentage: pct,
                exerciseStatus: exStatus,
                homeworkStatus: hwStatus,
                startedAt: completed > 0 ? new Date(Date.now() - 2 * 24 * 3600 * 1000) : null,
                completedAt: completed >= total ? new Date(Date.now() - 12 * 3600 * 1000) : null,
                lastProgressUpdate: completed > 0 ? new Date(Date.now() - 6 * 3600 * 1000) : null,
              },
            });

            if (completed > 0) {
              await prisma.homeworkProgressHistory.create({
                data: {
                  homeworkAssignmentId: hw.id,
                  studentId: st.id,
                  exerciseId: ex.id,
                  questionsCompleted: completed,
                  totalQuestions: total,
                  questionsRemaining: total - completed,
                  progressPercentage: pct,
                  deltaQuestions: completed,
                  status: exStatus,
                  notes: `Initial student progress submission: ${completed}/${total} questions solved`,
                  createdAt: new Date(Date.now() - 6 * 3600 * 1000),
                },
              });
            }
          }
        }
      }
    }
  }

  console.log("✅ Master Book Library and Chapter Progress seeding completed successfully!");
}

if (require.main === module) {
  seedMasterBooks()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
