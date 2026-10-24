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
    let subject = subjectMap.get(subKey);

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

      for (const exData of chData.exercises) {
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
              status: "ACTIVE",
            },
          });
          exerciseMap.set(exData.exerciseNumber, createdEx);
        } else {
          const needsUpdate =
            existingEx.name !== exData.name ||
            existingEx.totalQuestions !== exData.totalQuestions ||
            (existingEx.questionRange || null) !== (exData.questionRange || null) ||
            (existingEx.pageNumber || null) !== (exData.pageNumber || null);

          if (needsUpdate) {
            const updatedEx = await prisma.exercise.update({
              where: { id: existingEx.id },
              data: {
                name: exData.name,
                totalQuestions: exData.totalQuestions,
                questionRange: exData.questionRange || null,
                pageNumber: exData.pageNumber || null,
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

      // Assign book to students (preloaded)
      const existingStudentBooks = await prisma.studentBook.findMany({
        where: { bookId: neetAvasthiBook.id },
      });
      const assignedStudentIdSet = new Set(existingStudentBooks.map((sb) => sb.studentId));

      for (const st of students) {
        if (!assignedStudentIdSet.has(st.id)) {
          await prisma.studentBook.create({
            data: { studentId: st.id, bookId: neetAvasthiBook.id, assignedByTeacherId: teacher.id },
          });
        }
      }

      // Preload existing homework assignments for moleChapter
      const existingHwList = await prisma.homeworkAssignment.findMany({
        where: { chapterId: moleChapter.id },
      });
      const existingHwMap = new Map<string, any>();
      for (const h of existingHwList) {
        existingHwMap.set(`${h.studentId}_${h.exerciseId}`, h);
      }

      // Sample progress patterns matching Level 1 to Level 4:
      // Rahul: Ex1 (180/180), Ex2 (20/25), Ex3 (10/10), Ex4 (0/42)
      // Aman: Ex1 (180/180), Ex2 (25/25), Ex3 (10/10), Ex4 (35/42)
      // Priya: Ex1 (90/180), Ex2 (0/25), Ex3 (5/10), Ex4 (0/42, overdue)
      // Ananya: Ex1 (180/180), Ex2 (25/25), Ex3 (10/10), Ex4 (30/42)
      // Rohit: Ex1 (45/180), Ex2 (10/25), Ex3 (0/10), Ex4 (0/42, overdue)
      const progressMap: Record<string, number[]> = {
        "rahul@classboard.com": [180, 20, 10, 0],
        "aman@classboard.com": [180, 25, 10, 35],
        "priya@classboard.com": [90, 0, 5, 0],
        "ananya@classboard.com": [180, 25, 10, 30],
        "rohit@classboard.com": [45, 10, 0, 0],
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

          const existingHw = existingHwMap.get(`${st.id}_${ex.id}`);

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
