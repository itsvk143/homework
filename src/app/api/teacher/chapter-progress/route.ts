import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const chapterId = searchParams.get("chapterId");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const statusFilter = searchParams.get("status"); // ALL, COMPLETED, IN_PROGRESS, NOT_STARTED, OVERDUE
    const progressRange = searchParams.get("progressRange"); // ALL, 0, 1-25, 26-50, 51-75, 76-99, 100
    const needsAttentionFilter = searchParams.get("needsAttention") === "true";
    const includeAllBookStudents = searchParams.get("includeAllBookStudents") === "true";
    const sortBy = searchParams.get("sortBy") || "name"; // name, overall, lastUpdated, ex_<id>
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const user = await getCurrentUser();
    // Allow teachers and admins
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Teacher or Admin access required." }, { status: 403 });
    }

    // 1. If no bookId provided, find the first relevant book (or default to NEET Narendra Avasthi / NCERT Math)
    let selectedBook = null;
    if (bookId) {
      selectedBook = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          subject: true,
          chapters: {
            orderBy: { chapterNumber: "asc" },
            include: {
              exercises: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      });
    }

    if (!selectedBook) {
      // Find default book with chapters and exercises, preferably NEET Narendra Avasthi or first book
      selectedBook = await prisma.book.findFirst({
        where: {
          bookCode: "NEET_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI",
        },
        include: {
          subject: true,
          chapters: {
            orderBy: { chapterNumber: "asc" },
            include: {
              exercises: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      });

      if (!selectedBook) {
        selectedBook = await prisma.book.findFirst({
          where: { chapters: { some: {} } },
          include: {
            subject: true,
            chapters: {
              orderBy: { chapterNumber: "asc" },
              include: {
                exercises: {
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
        });
      }
    }

    if (!selectedBook) {
      return NextResponse.json({ error: "No books found in database." }, { status: 404 });
    }

    // 2. Select chapter
    let selectedChapter = null;
    if (chapterId) {
      selectedChapter = selectedBook.chapters.find((c) => c.id === chapterId);
    }
    if (!selectedChapter) {
      selectedChapter = selectedBook.chapters[0] || null;
    }

    if (!selectedChapter) {
      return NextResponse.json({
        book: {
          id: selectedBook.id,
          name: selectedBook.name,
          bookCode: selectedBook.bookCode,
          exam: selectedBook.exam,
          branch: selectedBook.branch,
          curriculumType: selectedBook.curriculumType,
          subject: { id: selectedBook.subject.id, name: selectedBook.subject.name },
        },
        chapter: null,
        exercises: [],
        students: [],
        stats: {
          totalAssignedStudents: 0,
          completedStudents: 0,
          inProgressStudents: 0,
          notStartedStudents: 0,
          overdueStudents: 0,
          needsAttentionStudents: 0,
          averageProgress: 0,
          exercisePerformance: [],
        },
      });
    }

    const chapterExercises = selectedChapter.exercises.sort((a, b) => {
      const numA = parseFloat(a.exerciseNumber) || 0;
      const numB = parseFloat(b.exerciseNumber) || 0;
      if (numA !== numB) return numA - numB;
      return a.displayOrder - b.displayOrder;
    });
    const exerciseIds = chapterExercises.map((e) => e.id);

    // 3. Optimized Student Fetching (Avoid N+1 Queries)
    // Find all students who have homework in this chapter
    const homeworkInChapter = await prisma.homeworkAssignment.findMany({
      where: {
        chapterId: selectedChapter.id,
      },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        progressHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    // Map student ID to their assignments in this chapter
    const studentAssignmentsMap = new Map<string, typeof homeworkInChapter>();
    const studentUserMap = new Map<string, any>();

    for (const hw of homeworkInChapter) {
      if (!studentAssignmentsMap.has(hw.studentId)) {
        studentAssignmentsMap.set(hw.studentId, []);
      }
      studentAssignmentsMap.get(hw.studentId)!.push(hw);
      if (!studentUserMap.has(hw.studentId)) {
        studentUserMap.set(hw.studentId, hw.student);
      }
    }

    // If includeAllBookStudents is requested (Section 145), also fetch students who have this book assigned
    if (includeAllBookStudents) {
      const bookStudents = await prisma.studentBook.findMany({
        where: { bookId: selectedBook.id },
        include: {
          student: {
            include: {
              studentProfile: true,
            },
          },
        },
      });

      for (const sb of bookStudents) {
        if (!studentUserMap.has(sb.studentId)) {
          studentUserMap.set(sb.studentId, sb.student);
          studentAssignmentsMap.set(sb.studentId, []);
        }
      }
    }

    const now = new Date();

    // 4. Transform into Student Matrix Rows
    const rawStudentRows = Array.from(studentUserMap.values()).map((stu) => {
      const stuHwList = studentAssignmentsMap.get(stu.id) || [];
      const hwByExerciseId = new Map<string, (typeof stuHwList)[0]>();
      for (const h of stuHwList) {
        hwByExerciseId.set(h.exerciseId, h);
      }

      let totalCompletedQuestions = 0;
      let totalAssignedQuestions = 0;
      let hasOverdue = false;
      let hasInProgress = false;
      let allCompleted = true;
      let allNotStarted = true;
      let assignedExerciseCount = 0;
      let latestUpdate: Date | null = null;
      let hasRejectedSubmission = false;

      const exerciseCells = chapterExercises.map((ex) => {
        const hw = hwByExerciseId.get(ex.id);
        if (!hw) {
          return {
            exerciseId: ex.id,
            exerciseNumber: ex.exerciseNumber,
            exerciseName: ex.name,
            totalQuestions: ex.totalQuestions,
            assigned: false,
            assignmentId: null,
            questionsCompleted: 0,
            percentage: 0,
            exerciseStatus: "NOT_ASSIGNED",
            homeworkStatus: "NOT_ASSIGNED",
            dueDate: null,
            isOverdue: false,
            lastUpdated: null,
            startedAt: null,
            completedAt: null,
            instructions: null,
            history: [],
          };
        }

        assignedExerciseCount++;
        const completed = hw.questionsCompleted;
        const total = hw.totalQuestions;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        totalCompletedQuestions += completed;
        totalAssignedQuestions += total;

        const effectiveExerciseStatus =
          completed >= total && total > 0 ? "COMPLETED" : hw.exerciseStatus;

        const isOverdue =
          new Date(hw.dueDate) < now && effectiveExerciseStatus !== "COMPLETED";

        if (isOverdue) hasOverdue = true;
        if (effectiveExerciseStatus === "IN_PROGRESS") hasInProgress = true;
        if (effectiveExerciseStatus !== "COMPLETED") allCompleted = false;
        if (effectiveExerciseStatus !== "NOT_STARTED") allNotStarted = false;
        if (hw.homeworkStatus === "REJECTED") hasRejectedSubmission = true;

        if (hw.lastProgressUpdate) {
          const updDate = new Date(hw.lastProgressUpdate);
          if (!latestUpdate || updDate > latestUpdate) {
            latestUpdate = updDate;
          }
        }

        return {
          exerciseId: ex.id,
          exerciseNumber: ex.exerciseNumber,
          exerciseName: ex.name,
          totalQuestions: total,
          assigned: true,
          assignmentId: hw.id,
          questionsCompleted: completed,
          percentage: pct,
          exerciseStatus: effectiveExerciseStatus,
          homeworkStatus: completed >= total ? "COMPLETED" : hw.homeworkStatus,
          dueDate: hw.dueDate.toISOString(),
          isOverdue,
          lastUpdated: hw.lastProgressUpdate ? hw.lastProgressUpdate.toISOString() : null,
          startedAt: hw.startedAt ? hw.startedAt.toISOString() : null,
          completedAt: hw.completedAt ? hw.completedAt.toISOString() : null,
          instructions: hw.instructions || null,
          history: hw.progressHistory.map((ph: any) => ({
            id: ph.id,
            questionsCompleted: ph.questionsCompleted,
            totalQuestions: ph.totalQuestions,
            deltaQuestions: ph.deltaQuestions,
            percentage: ph.progressPercentage,
            status: ph.status,
            notes: ph.notes,
            createdAt: ph.createdAt.toISOString(),
          })),
        };
      });

      // Overall Progress: Question-weighted calculation as per Section 151
      const overallProgress =
        totalAssignedQuestions > 0
          ? Math.round((totalCompletedQuestions / totalAssignedQuestions) * 100)
          : 0;

      // Primary Status determination (Section 140 / 153)
      let primaryStatus: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "OVERDUE" | "NOT_ASSIGNED" = "NOT_ASSIGNED";
      if (assignedExerciseCount === 0) {
        primaryStatus = "NOT_ASSIGNED";
      } else if (hasOverdue) {
        primaryStatus = "OVERDUE";
      } else if (allCompleted && assignedExerciseCount > 0) {
        primaryStatus = "COMPLETED";
      } else if (allNotStarted) {
        primaryStatus = "NOT_STARTED";
      } else {
        primaryStatus = "IN_PROGRESS";
      }

      // Needs Attention determination (Section 150):
      // Progress below 50% OR Overdue homework OR Not started OR No progress update for >48h OR Rejected submission
      const attentionReasons: string[] = [];
      if (assignedExerciseCount > 0) {
        if (hasOverdue) attentionReasons.push("Overdue exercise deadline");
        if (overallProgress < 50) attentionReasons.push(`Progress below 50% (${overallProgress}%)`);
        if (allNotStarted) attentionReasons.push("Not started any exercise");
        if (hasRejectedSubmission) attentionReasons.push("Submission rejected by teacher");
        if (latestUpdate) {
          const updateTime = new Date(latestUpdate).getTime();
          const diffHours = (now.getTime() - updateTime) / (1000 * 3600);
          if (diffHours > 48 && overallProgress < 100) {
            attentionReasons.push("No progress in over 48 hours");
          }
        }
      }

      const needsAttention = attentionReasons.length > 0;

      return {
        studentId: stu.id,
        studentName: stu.name,
        email: stu.email,
        avatarUrl: stu.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        classGrade: stu.studentProfile?.classGrade || "Class 12",
        section: stu.studentProfile?.section || "A",
        rollNo: stu.studentProfile?.rollNo || "—",
        exercises: exerciseCells,
        assignedExerciseCount,
        totalCompletedQuestions,
        totalAssignedQuestions,
        overallProgress,
        primaryStatus,
        needsAttention,
        attentionReasons,
        lastUpdated: latestUpdate ? (latestUpdate as Date).toISOString() : null,
      };
    });

    // 5. Apply Client / Query Filters
    let filteredStudents = rawStudentRows;

    // Search filter
    if (search) {
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.studentName.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.rollNo.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "ALL") {
      filteredStudents = filteredStudents.filter((s) => s.primaryStatus === statusFilter);
    }

    // Needs Attention filter
    if (needsAttentionFilter) {
      filteredStudents = filteredStudents.filter((s) => s.needsAttention);
    }

    // Progress Range filter (0%, 1-25%, 26-50%, 51-75%, 76-99%, 100%)
    if (progressRange && progressRange !== "ALL") {
      filteredStudents = filteredStudents.filter((s) => {
        if (progressRange === "0") return s.overallProgress === 0;
        if (progressRange === "1-25") return s.overallProgress >= 1 && s.overallProgress <= 25;
        if (progressRange === "26-50") return s.overallProgress >= 26 && s.overallProgress <= 50;
        if (progressRange === "51-75") return s.overallProgress >= 51 && s.overallProgress <= 75;
        if (progressRange === "76-99") return s.overallProgress >= 76 && s.overallProgress <= 99;
        if (progressRange === "100") return s.overallProgress === 100;
        return true;
      });
    }

    // 6. Sorting
    filteredStudents.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.studentName.localeCompare(b.studentName);
      } else if (sortBy === "overall") {
        comparison = a.overallProgress - b.overallProgress;
      } else if (sortBy === "lastUpdated") {
        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortBy.startsWith("ex_")) {
        const exId = sortBy.replace("ex_", "");
        const cellA = a.exercises.find((e) => e.exerciseId === exId);
        const cellB = b.exercises.find((e) => e.exerciseId === exId);
        comparison = (cellA?.percentage || 0) - (cellB?.percentage || 0);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // 7. Aggregate Chapter & Exercise Statistics (Section 136, 137, 152, 153)
    const totalStudentsInChapter = rawStudentRows.filter((s) => s.assignedExerciseCount > 0).length;
    const completedStudentsCount = rawStudentRows.filter((s) => s.primaryStatus === "COMPLETED").length;
    const inProgressStudentsCount = rawStudentRows.filter((s) => s.primaryStatus === "IN_PROGRESS").length;
    const notStartedStudentsCount = rawStudentRows.filter((s) => s.primaryStatus === "NOT_STARTED").length;
    const overdueStudentsCount = rawStudentRows.filter((s) => s.primaryStatus === "OVERDUE").length;
    const needsAttentionCount = rawStudentRows.filter((s) => s.needsAttention).length;

    const avgProgress =
      totalStudentsInChapter > 0
        ? Math.round(
            rawStudentRows
              .filter((s) => s.assignedExerciseCount > 0)
              .reduce((acc, s) => acc + s.overallProgress, 0) / totalStudentsInChapter
          )
        : 0;

    // Exercise performance summary (Section 152)
    const exercisePerformance = chapterExercises.map((ex) => {
      let assignedCount = 0;
      let completedCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      let overdueCount = 0;
      let sumPct = 0;

      for (const s of rawStudentRows) {
        const cell = s.exercises.find((e) => e.exerciseId === ex.id);
        if (cell && cell.assigned) {
          assignedCount++;
          sumPct += cell.percentage;
          if (cell.exerciseStatus === "COMPLETED") completedCount++;
          else if (cell.exerciseStatus === "IN_PROGRESS") inProgressCount++;
          else if (cell.exerciseStatus === "NOT_STARTED") notStartedCount++;

          if (cell.isOverdue) overdueCount++;
        }
      }

      const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
      const averagePercentage = assignedCount > 0 ? Math.round(sumPct / assignedCount) : 0;

      return {
        exerciseId: ex.id,
        exerciseNumber: ex.exerciseNumber,
        exerciseName: ex.name,
        totalQuestions: ex.totalQuestions,
        studentsAssigned: assignedCount,
        studentsCompleted: completedCount,
        completionRate,
        averagePercentage,
        inProgressCount,
        notStartedCount,
        overdueCount,
      };
    });

    return NextResponse.json({
      book: {
        id: selectedBook.id,
        name: selectedBook.name,
        bookCode: selectedBook.bookCode,
        exam: selectedBook.exam,
        branch: selectedBook.branch,
        curriculumType: selectedBook.curriculumType,
        subject: { id: selectedBook.subject.id, name: selectedBook.subject.name },
      },
      chapter: {
        id: selectedChapter.id,
        name: selectedChapter.name,
        chapterNumber: selectedChapter.chapterNumber,
        description: selectedChapter.description,
      },
      exercises: chapterExercises.map((e) => ({
        id: e.id,
        name: e.name,
        exerciseNumber: e.exerciseNumber,
        totalQuestions: e.totalQuestions,
        displayOrder: e.displayOrder,
      })),
      students: filteredStudents,
      stats: {
        totalAssignedStudents: totalStudentsInChapter,
        completedStudents: completedStudentsCount,
        inProgressStudents: inProgressStudentsCount,
        notStartedStudents: notStartedStudentsCount,
        overdueStudents: overdueStudentsCount,
        needsAttentionStudents: needsAttentionCount,
        averageProgress: avgProgress,
        exercisePerformance,
      },
    });
  } catch (err: any) {
    console.error("GET /api/teacher/chapter-progress error:", err);
    return NextResponse.json(
      { error: "Failed to load chapter progress matrix", details: err.message },
      { status: 500 }
    );
  }
}
