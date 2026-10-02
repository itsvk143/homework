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

  // 3. Teachers (Upsert without any fake students attached)
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher@classboard.com" },
    update: { role: "TEACHER" },
    create: {
      email: "teacher@classboard.com",
      password: "teacher123",
      name: "Mrs. Sunita Sharma",
      role: "TEACHER",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      teacherProfile: {
        create: {
          subjectSpecialty: "Mathematics & Science",
          phone: "+91 98765 43210",
          bio: "Senior Mathematics Coordinator with 12+ years experience in CBSE curriculum.",
        },
      },
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "verma@classboard.com" },
    update: { role: "TEACHER" },
    create: {
      email: "verma@classboard.com",
      password: "teacher123",
      name: "Mr. R. K. Verma",
      role: "TEACHER",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      teacherProfile: {
        create: {
          subjectSpecialty: "Science & English",
          phone: "+91 98765 43211",
          bio: "Head of Science Department. Passionate about hands-on laboratory exercises.",
        },
      },
    },
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: "astrovikash07@gmail.com" },
    update: {
      name: "Astro Vikash",
      role: "TEACHER",
      status: "ACTIVE",
    },
    create: {
      id: "user_teacher_astro_vikash",
      email: "astrovikash07@gmail.com",
      password: "teacher123",
      name: "Astro Vikash",
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: {
        create: {
          subjectSpecialty: "Chemistry (NEET)",
          phone: "+91 98765 43212",
          bio: "Senior Chemistry Faculty specializing in Physical Chemistry & NEET.",
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
