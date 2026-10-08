import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ClassBoard Safe Seed Database...");

  // 1. System Settings (Upsert)
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      requireTeacherVerification: true,
      sequentialExerciseCompletion: false,
    },
  });

  // 2. Admins (Upsert)
  await prisma.user.upsert({
    where: { email: "itsvikash143@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      email: "itsvikash143@gmail.com",
      password: "admin123",
      name: "Vikash Kumar (Admin)",
      role: "ADMIN",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@classboard.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@classboard.com",
      password: "admin123",
      name: "Dr. Arvind Gupta",
      role: "ADMIN",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Teachers: Clean up deleted mock teachers so they NEVER reappear
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["teacher@classboard.com", "verma@classboard.com"],
      },
    },
  });

  const teacherVikash = await prisma.user.upsert({
    where: { email: "cvksir07@gmail.com" },
    update: {
      name: "VIKASH KUMAR",
      role: "TEACHER",
      status: "ACTIVE",
    },
    create: {
      id: "user_teacher_vikash_kumar",
      email: "cvksir07@gmail.com",
      password: "teacher123",
      name: "VIKASH KUMAR",
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: {
        create: {
          subjectSpecialty: "Mathematics & Science & Chemistry & Physics (Class 9, Class 10, Class 12, JEE / NEET Dropper, Class 11, Class 8, Class 7, Class 6)",
          phone: "+91 98765 43210",
          bio: "Senior Educator at LV INSTITUTE",
        },
      },
    },
  });

  const teacherLaxmi = await prisma.user.upsert({
    where: { email: "laxmeena01@gmail.com" },
    update: {
      name: "laxmi kumari",
      role: "TEACHER",
      status: "ACTIVE",
    },
    create: {
      id: "user_teacher_laxmi_kumari",
      email: "laxmeena01@gmail.com",
      password: "teacher123",
      name: "laxmi kumari",
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: {
        create: {
          subjectSpecialty: "Biology & English & Hindi & Social Science & Science (Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12, JEE / NEET Dropper)",
          phone: "+91 98765 43211",
          bio: "Senior Educator at LV INSTITUTE",
        },
      },
    },
  });

  const studentLvTax = await prisma.user.upsert({
    where: { email: "lvtaxconsultant@gmail.com" },
    update: {
      name: "LV TAX CONSULTANCY",
      role: "STUDENT",
      status: "ACTIVE",
    },
    create: {
      id: "user_student_lv_tax_consultancy",
      email: "lvtaxconsultant@gmail.com",
      password: "student123",
      name: "LV TAX CONSULTANCY",
      role: "STUDENT",
      status: "ACTIVE",
      studentProfile: {
        create: {
          classGrade: "NEET Dropper",
          section: "A",
          rollNo: "1",
          schoolName: "LV INSTITUTE",
        },
      },
    },
  });

  // 4. Ensure Core Subjects exist
  const subjectsData = [
    {
      name: "Mathematics",
      classGrade: "Class 8",
      code: "MATH8",
      description: "CBSE Standard Class 8 Mathematics focusing on algebra, geometry, and data handling.",
      color: "#4F46E5",
      icon: "calculator",
    },
    {
      name: "Science",
      classGrade: "Class 8",
      code: "SCI8",
      description: "CBSE Class 8 Natural Sciences covering biology, physics fundamentals, and chemistry.",
      color: "#059669",
      icon: "flask-conical",
    },
    {
      name: "English",
      classGrade: "Class 8",
      code: "ENG8",
      description: "English Literature, reading comprehension and applied grammar.",
      color: "#D97706",
      icon: "book-open",
    },
  ];

  for (const s of subjectsData) {
    const existing = await prisma.subject.findFirst({
      where: { name: s.name, classGrade: s.classGrade },
    });
    if (!existing) {
      await prisma.subject.create({ data: s });
    }
  }

  // NOTE: No mock students or mock assignments are seeded!
  // Students and their assignments should only be created or assigned dynamically by the Admin.
  console.log("✅ Seed completed cleanly: Admins and Teachers configured without mock students.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
