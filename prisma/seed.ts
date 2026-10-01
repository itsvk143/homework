import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ClassBoard Seed Database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.homeworkAttachment.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.homeworkProgressHistory.deleteMany();
  await prisma.teacherStudentAssignment.deleteMany();
  await prisma.homeworkAssignment.deleteMany();
  await prisma.studentBook.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.book.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. System Settings
  await prisma.systemSetting.create({
    data: {
      id: "default",
      requireTeacherVerification: true,
      sequentialExerciseCompletion: false,
    },
  });

  // 2. Users: Admin, Teachers, Students
  const admin = await prisma.user.create({
    data: {
      email: "admin@classboard.com",
      password: "admin123",
      name: "Dr. Arvind Gupta",
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const adminVikash = await prisma.user.create({
    data: {
      email: "itsvikash143@gmail.com",
      password: "admin123",
      name: "Vikash Kumar (Admin)",
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: "teacher@classboard.com",
      password: "teacher123",
      name: "Mrs. Sunita Sharma",
      role: "TEACHER",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      teacherProfile: {
        create: {
          subjectSpecialty: "Mathematics & Science",
          phone: "+91 98765 43210",
          bio: "Senior Mathematics Coordinator with 12+ years experience in CBSE curriculum.",
        },
      },
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "verma@classboard.com",
      password: "teacher123",
      name: "Mr. R. K. Verma",
      role: "TEACHER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      teacherProfile: {
        create: {
          subjectSpecialty: "Science & English",
          phone: "+91 98765 43211",
          bio: "Head of Science Department. Passionate about hands-on laboratory exercises.",
        },
      },
    },
  });

  const rahul = await prisma.user.create({
    data: {
      email: "rahul@classboard.com",
      password: "student123",
      name: "Rahul Kumar",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          classGrade: "Class 8",
          section: "A",
          rollNo: "14",
          schoolName: "Delhi Public School, R.K. Puram",
          parentName: "Rajesh Kumar",
          parentPhone: "+91 98111 22334",
        },
      },
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: "priya@classboard.com",
      password: "student123",
      name: "Priya Patel",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          classGrade: "Class 8",
          section: "A",
          rollNo: "22",
          schoolName: "Delhi Public School, R.K. Puram",
          parentName: "Sanjay Patel",
          parentPhone: "+91 98222 33445",
        },
      },
    },
  });

  const aman = await prisma.user.create({
    data: {
      email: "aman@classboard.com",
      password: "student123",
      name: "Aman Singh",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          classGrade: "Class 8",
          section: "B",
          rollNo: "05",
          schoolName: "Delhi Public School, R.K. Puram",
          parentName: "Vikram Singh",
          parentPhone: "+91 98333 44556",
        },
      },
    },
  });

  const ananya = await prisma.user.create({
    data: {
      email: "ananya@classboard.com",
      password: "student123",
      name: "Ananya Roy",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          classGrade: "Class 8",
          section: "A",
          rollNo: "08",
          schoolName: "Delhi Public School, R.K. Puram",
          parentName: "Debashis Roy",
          parentPhone: "+91 98444 55667",
        },
      },
    },
  });

  const rohit = await prisma.user.create({
    data: {
      email: "rohit@classboard.com",
      password: "student123",
      name: "Rohit Verma",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          classGrade: "Class 8",
          section: "B",
          rollNo: "31",
          schoolName: "Delhi Public School, R.K. Puram",
          parentName: "Manoj Verma",
          parentPhone: "+91 98555 66778",
        },
      },
    },
  });

  // 3. Subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: "Mathematics",
      classGrade: "Class 8",
      code: "MATH8",
      description: "CBSE Standard Class 8 Mathematics focusing on algebra, geometry, and data handling.",
      color: "#4F46E5",
      icon: "calculator",
    },
  });

  const scienceSubject = await prisma.subject.create({
    data: {
      name: "Science",
      classGrade: "Class 8",
      code: "SCI8",
      description: "CBSE Class 8 Natural Sciences covering biology, physics fundamentals, and chemistry.",
      color: "#059669",
      icon: "flask-conical",
    },
  });

  const englishSubject = await prisma.subject.create({
    data: {
      name: "English",
      classGrade: "Class 8",
      code: "ENG8",
      description: "English Literature, reading comprehension and applied grammar.",
      color: "#D97706",
      icon: "book-open",
    },
  });

  // 4. Books
  const ncertMathBook = await prisma.book.create({
    data: {
      subjectId: mathSubject.id,
      name: "NCERT Mathematics Class 8",
      classGrade: "Class 8",
      author: "NCERT Editorial Team",
      publisher: "National Council of Educational Research and Training",
      isbn: "978-81-7450-482-1",
      description: "Official textbook prescribed by Central Board of Secondary Education.",
      coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&auto=format&fit=crop&q=80",
      displayOrder: 1,
    },
  });

  const rdSharmaBook = await prisma.book.create({
    data: {
      subjectId: mathSubject.id,
      name: "RD Sharma Class 8",
      classGrade: "Class 8",
      author: "Dr. R.D. Sharma",
      publisher: "Dhanpat Rai Publications",
      isbn: "978-81-9366-123-4",
      description: "Comprehensive reference with conceptual problems and advanced exercises.",
      coverUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3777b?w=200&auto=format&fit=crop&q=80",
      displayOrder: 2,
    },
  });

  const ncertScienceBook = await prisma.book.create({
    data: {
      subjectId: scienceSubject.id,
      name: "NCERT Science Class 8",
      classGrade: "Class 8",
      author: "NCERT Committee",
      publisher: "NCERT",
      isbn: "978-81-7450-485-2",
      description: "Prescribed Science textbook containing practical activities and chapter-end questions.",
      coverUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=200&auto=format&fit=crop&q=80",
      displayOrder: 1,
    },
  });

  const englishGrammarBook = await prisma.book.create({
    data: {
      subjectId: englishSubject.id,
      name: "English Grammar & Composition Class 8",
      classGrade: "Class 8",
      author: "Wren & Martin / NCERT",
      publisher: "S. Chand & Company",
      isbn: "978-93-5283-847-1",
      description: "Comprehensive English grammar, writing tasks, and vocabulary exercises.",
      coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=80",
      displayOrder: 1,
    },
  });

  // 5. Chapters & Exercises for NCERT Mathematics
  // Chapter 1: Rational Numbers
  const ch1 = await prisma.chapter.create({
    data: {
      bookId: ncertMathBook.id,
      name: "Rational Numbers",
      chapterNumber: 1,
      description: "Properties of rational numbers, operations, and number line representation.",
      displayOrder: 1,
      exercises: {
        create: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10, pageNumber: 14, questionRange: "1–10", estimatedTime: 35, displayOrder: 1 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 8, pageNumber: 20, questionRange: "1–8", estimatedTime: 30, displayOrder: 2 },
          { name: "Exercise 1.3", exerciseNumber: "1.3", totalQuestions: 12, pageNumber: 26, questionRange: "1–12", estimatedTime: 40, displayOrder: 3 },
        ],
      },
    },
  });

  // Chapter 2: Linear Equations
  const ch2 = await prisma.chapter.create({
    data: {
      bookId: ncertMathBook.id,
      name: "Linear Equations in One Variable",
      chapterNumber: 2,
      description: "Solving linear equations having variables on one and both sides.",
      displayOrder: 2,
      exercises: {
        create: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12, pageNumber: 32, questionRange: "1–12", estimatedTime: 40, displayOrder: 1 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 16, pageNumber: 38, questionRange: "1–16", estimatedTime: 50, displayOrder: 2 },
          { name: "Exercise 2.3", exerciseNumber: "2.3", totalQuestions: 10, pageNumber: 44, questionRange: "1–10", estimatedTime: 35, displayOrder: 3 },
        ],
      },
    },
  });

  // Chapter 3: Understanding Quadrilaterals
  const ch3 = await prisma.chapter.create({
    data: {
      bookId: ncertMathBook.id,
      name: "Understanding Quadrilaterals",
      chapterNumber: 3,
      description: "Polygons, angle sum property, kites, parallelograms, and trapeziums.",
      displayOrder: 3,
      exercises: {
        create: [
          { name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 8, pageNumber: 52, questionRange: "1–8", estimatedTime: 30, displayOrder: 1 },
          { name: "Exercise 3.2", exerciseNumber: "3.2", totalQuestions: 6, pageNumber: 60, questionRange: "1–6", estimatedTime: 25, displayOrder: 2 },
          { name: "Exercise 3.3", exerciseNumber: "3.3", totalQuestions: 12, pageNumber: 68, questionRange: "1–12", estimatedTime: 45, displayOrder: 3 },
        ],
      },
    },
  });

  // Chapter 4: Data Handling
  const ch4 = await prisma.chapter.create({
    data: {
      bookId: ncertMathBook.id,
      name: "Data Handling",
      chapterNumber: 4,
      description: "Organizing data, frequency distribution tables, pie charts, and probability.",
      displayOrder: 4,
      exercises: {
        create: [
          {
            name: "Exercise 4.1",
            exerciseNumber: "4.1",
            totalQuestions: 15,
            pageNumber: 70,
            questionRange: "1–15",
            estimatedTime: 45,
            teacherNotes: "Ensure neat frequency distribution bar charts with labelled axes.",
            displayOrder: 1,
          },
          {
            name: "Exercise 4.2",
            exerciseNumber: "4.2",
            totalQuestions: 20,
            pageNumber: 75,
            questionRange: "1–20",
            estimatedTime: 60,
            teacherNotes: "Focus on pie-chart central angles and random event probability.",
            displayOrder: 2,
          },
          {
            name: "Exercise 4.3",
            exerciseNumber: "4.3",
            totalQuestions: 12,
            pageNumber: 82,
            questionRange: "1–12",
            estimatedTime: 40,
            teacherNotes: "Equally likely outcomes and chance experiments.",
            displayOrder: 3,
          },
        ],
      },
    },
  });

  // Science Chapters
  const sciCh1 = await prisma.chapter.create({
    data: {
      bookId: ncertScienceBook.id,
      name: "Crop Production and Management",
      chapterNumber: 1,
      description: "Agricultural practices, sowing, manure, fertilizers, and irrigation.",
      displayOrder: 1,
      exercises: {
        create: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10, pageNumber: 12, questionRange: "1–10", estimatedTime: 30, displayOrder: 1 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 8, pageNumber: 16, questionRange: "1–8", estimatedTime: 25, displayOrder: 2 },
        ],
      },
    },
  });

  // 6. Assign Books to Students
  const students = [rahul, priya, aman, ananya, rohit];
  for (const stu of students) {
    await prisma.studentBook.create({
      data: {
        studentId: stu.id,
        bookId: ncertMathBook.id,
        assignedByTeacherId: teacher1.id,
      },
    });
  }

  // Assign Science & English to selected students
  await prisma.studentBook.create({
    data: { studentId: rahul.id, bookId: ncertScienceBook.id, assignedByTeacherId: teacher1.id },
  });
  await prisma.studentBook.create({
    data: { studentId: rahul.id, bookId: englishGrammarBook.id, assignedByTeacherId: teacher2.id },
  });
  await prisma.studentBook.create({
    data: { studentId: priya.id, bookId: ncertScienceBook.id, assignedByTeacherId: teacher1.id },
  });

  // Get exercises for assignment creation
  const ch4Exercises = await prisma.exercise.findMany({ where: { chapterId: ch4.id } });
  const ex4_1 = ch4Exercises.find((e) => e.exerciseNumber === "4.1")!;
  const ex4_2 = ch4Exercises.find((e) => e.exerciseNumber === "4.2")!;
  const ex4_3 = ch4Exercises.find((e) => e.exerciseNumber === "4.3")!;

  const ch3Exercises = await prisma.exercise.findMany({ where: { chapterId: ch3.id } });
  const ex3_2 = ch3Exercises.find((e) => e.exerciseNumber === "3.2")!;

  const sciCh1Exercises = await prisma.exercise.findMany({ where: { chapterId: sciCh1.id } });
  const sciEx1_1 = sciCh1Exercises.find((e) => e.exerciseNumber === "1.1")!;

  // 7. Seed Sample Homework Assignments

  // Assignment 1: Rahul - Exercise 4.2 (In Progress - 12/20 = 60%, Due today)
  const now = new Date();
  const dueToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const dueTomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  const hw1 = await prisma.homeworkAssignment.create({
    data: {
      studentId: rahul.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch4.id,
      exerciseId: ex4_2.id,
      assignedDate: twoDaysAgo,
      dueDate: dueToday,
      instructions: "Solve all problems step-by-step in your homework notebook. Draw neat diagrams for questions 14-20.",
      totalQuestions: 20,
      questionsCompleted: 12,
      progressPercentage: 60.0,
      exerciseStatus: "IN_PROGRESS",
      homeworkStatus: "IN_PROGRESS",
      startedAt: twoDaysAgo,
      lastProgressUpdate: oneDayAgo,
    },
  });

  // Progress history for HW1 (Day 1: 5/20, Day 2: 12/20)
  await prisma.homeworkProgressHistory.create({
    data: {
      homeworkAssignmentId: hw1.id,
      studentId: rahul.id,
      exerciseId: ex4_2.id,
      questionsCompleted: 5,
      totalQuestions: 20,
      questionsRemaining: 15,
      progressPercentage: 25.0,
      deltaQuestions: 5,
      status: "IN_PROGRESS",
      notes: "Completed initial 5 straightforward questions.",
      createdAt: twoDaysAgo,
    },
  });

  await prisma.homeworkProgressHistory.create({
    data: {
      homeworkAssignmentId: hw1.id,
      studentId: rahul.id,
      exerciseId: ex4_2.id,
      questionsCompleted: 12,
      totalQuestions: 20,
      questionsRemaining: 8,
      progressPercentage: 60.0,
      deltaQuestions: 7,
      status: "IN_PROGRESS",
      notes: "Solved questions 6 to 12. Pie chart calculations done.",
      createdAt: oneDayAgo,
    },
  });

  // Assignment 2: Rahul - Exercise 4.1 (Completed - 15/15 = 100%)
  const hw2 = await prisma.homeworkAssignment.create({
    data: {
      studentId: rahul.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch4.id,
      exerciseId: ex4_1.id,
      assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: twoDaysAgo,
      instructions: "Frequency tables and bar graphs practice.",
      totalQuestions: 15,
      questionsCompleted: 15,
      progressPercentage: 100.0,
      exerciseStatus: "COMPLETED",
      homeworkStatus: "COMPLETED",
      startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      submittedAt: twoDaysAgo,
      completedAt: twoDaysAgo,
      lastProgressUpdate: twoDaysAgo,
      teacherComment: "Excellent and neat working! Keep it up Rahul.",
    },
  });

  await prisma.homeworkProgressHistory.create({
    data: {
      homeworkAssignmentId: hw2.id,
      studentId: rahul.id,
      exerciseId: ex4_1.id,
      questionsCompleted: 15,
      totalQuestions: 15,
      questionsRemaining: 0,
      progressPercentage: 100.0,
      deltaQuestions: 15,
      status: "COMPLETED",
      notes: "All 15 questions completed in notebook.",
      createdAt: twoDaysAgo,
    },
  });

  // Assignment 3: Rahul - Science Exercise 1.1 (Awaiting Review / Submitted with proof images)
  const hw3 = await prisma.homeworkAssignment.create({
    data: {
      studentId: rahul.id,
      teacherId: teacher1.id,
      subjectId: scienceSubject.id,
      bookId: ncertScienceBook.id,
      chapterId: sciCh1.id,
      exerciseId: sciEx1_1.id,
      assignedDate: threeDaysAgo(3),
      dueDate: dueTomorrow,
      instructions: "Answer short questions and draw the crop cycle chart.",
      totalQuestions: 10,
      questionsCompleted: 10,
      progressPercentage: 100.0,
      exerciseStatus: "COMPLETED",
      homeworkStatus: "AWAITING_REVIEW",
      startedAt: threeDaysAgo(2),
      submittedAt: oneDayAgo,
      lastProgressUpdate: oneDayAgo,
    },
  });

  const sub3 = await prisma.homeworkSubmission.create({
    data: {
      homeworkAssignmentId: hw3.id,
      studentNotes: "Ma'am, I have uploaded photos of page 12 and 13 from my science register.",
      status: "SUBMITTED",
      submittedAt: oneDayAgo,
    },
  });

  await prisma.homeworkAttachment.create({
    data: {
      homeworkAssignmentId: hw3.id,
      submissionId: sub3.id,
      fileName: "science_hw_page1.jpg",
      fileType: "IMAGE",
      fileUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80",
      fileSize: 420000,
    },
  });

  await prisma.homeworkAttachment.create({
    data: {
      homeworkAssignmentId: hw3.id,
      submissionId: sub3.id,
      fileName: "science_hw_page2.jpg",
      fileType: "IMAGE",
      fileUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      fileSize: 385000,
    },
  });

  // Assignment 4: Rahul - Exercise 3.2 (Not Started - 0/6, Due in 3 days)
  await prisma.homeworkAssignment.create({
    data: {
      studentId: rahul.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch3.id,
      exerciseId: ex3_2.id,
      assignedDate: now,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      instructions: "Solve exterior angle property problems.",
      totalQuestions: 6,
      questionsCompleted: 0,
      progressPercentage: 0.0,
      exerciseStatus: "NOT_STARTED",
      homeworkStatus: "ASSIGNED",
    },
  });

  // Assign Homework to Priya, Aman, Ananya, Rohit as well
  await prisma.homeworkAssignment.create({
    data: {
      studentId: priya.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch4.id,
      exerciseId: ex4_2.id,
      assignedDate: twoDaysAgo,
      dueDate: dueToday,
      instructions: "Solve all problems step-by-step.",
      totalQuestions: 20,
      questionsCompleted: 18,
      progressPercentage: 90.0,
      exerciseStatus: "IN_PROGRESS",
      homeworkStatus: "IN_PROGRESS",
      startedAt: twoDaysAgo,
      lastProgressUpdate: oneDayAgo,
    },
  });

  await prisma.homeworkAssignment.create({
    data: {
      studentId: aman.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch4.id,
      exerciseId: ex4_2.id,
      assignedDate: twoDaysAgo,
      dueDate: dueToday,
      instructions: "Solve all problems step-by-step.",
      totalQuestions: 20,
      questionsCompleted: 0,
      progressPercentage: 0.0,
      exerciseStatus: "NOT_STARTED",
      homeworkStatus: "ASSIGNED",
    },
  });

  await prisma.homeworkAssignment.create({
    data: {
      studentId: ananya.id,
      teacherId: teacher1.id,
      subjectId: mathSubject.id,
      bookId: ncertMathBook.id,
      chapterId: ch4.id,
      exerciseId: ex4_2.id,
      assignedDate: twoDaysAgo,
      dueDate: dueToday,
      instructions: "Solve all problems step-by-step.",
      totalQuestions: 20,
      questionsCompleted: 20,
      progressPercentage: 100.0,
      exerciseStatus: "COMPLETED",
      homeworkStatus: "COMPLETED",
      startedAt: twoDaysAgo,
      completedAt: oneDayAgo,
      lastProgressUpdate: oneDayAgo,
    },
  });

  // Teacher-Student Subject Assignments
  await prisma.teacherStudentAssignment.createMany({
    data: [
      // Mrs. Sunita Sharma (Teacher 1) - Mathematics
      { teacherId: teacher1.id, studentId: rahul.id, subjectId: mathSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher1.id, studentId: priya.id, subjectId: mathSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher1.id, studentId: aman.id, subjectId: mathSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher1.id, studentId: ananya.id, subjectId: mathSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher1.id, studentId: rohit.id, subjectId: mathSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      // Mrs. Sunita Sharma (Teacher 1) - Science
      { teacherId: teacher1.id, studentId: rahul.id, subjectId: scienceSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher1.id, studentId: priya.id, subjectId: scienceSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      
      // Mr. R.K. Verma (Teacher 2) - Science (Rahul is assigned to both teachers for different or complementary roles!)
      { teacherId: teacher2.id, studentId: rahul.id, subjectId: scienceSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher2.id, studentId: aman.id, subjectId: scienceSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher2.id, studentId: rohit.id, subjectId: scienceSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      // Mr. R.K. Verma (Teacher 2) - English
      { teacherId: teacher2.id, studentId: priya.id, subjectId: englishSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
      { teacherId: teacher2.id, studentId: ananya.id, subjectId: englishSubject.id, academicYear: "2026-2027", status: "ACTIVE" },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: rahul.id,
        title: "Homework Due Today",
        message: "NCERT Mathematics Chapter 4 Exercise 4.2 is due today at 11:59 PM.",
        type: "DUE_SOON",
        read: false,
      },
      {
        userId: rahul.id,
        title: "Teacher Feedback Received",
        message: "Mrs. Sunita Sharma reviewed your Exercise 4.1: 'Excellent and neat working!'",
        type: "VERIFIED",
        read: true,
      },
      {
        userId: teacher1.id,
        title: "Homework Submitted for Review",
        message: "Rahul Kumar submitted Science Exercise 1.1 with 2 attachments.",
        type: "PROGRESS_UPDATE",
        read: false,
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: teacher1.id,
        action: "ASSIGN_HOMEWORK_BULK",
        entityType: "HomeworkAssignment",
        entityId: hw1.id,
        metadata: JSON.stringify({ exerciseNumber: "4.2", studentCount: 5, book: "NCERT Mathematics Class 8" }),
      },
      {
        userId: rahul.id,
        action: "UPDATE_PROGRESS",
        entityType: "HomeworkAssignment",
        entityId: hw1.id,
        metadata: JSON.stringify({ questionsCompleted: 12, totalQuestions: 20, progressPercentage: 60 }),
      },
    ],
  });

  console.log("✅ Seed completed successfully with demo users, academic hierarchy, and homework!");
}

function threeDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
