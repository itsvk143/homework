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

  // 4. Ensure Core Subjects exist (Physics, Chemistry, Biology, Mathematics & Foundations)
  const subjectsData = [
    // Foundation subjects
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

    // Physics
    { name: "Physics", classGrade: "Class 11", code: "PHY11", color: "#2563EB", icon: "atom", description: "Class 11 Physics (Mechanics, Waves, Thermodynamics)" },
    { name: "Physics", classGrade: "Class 11 NEET", code: "PHY11_NEET", color: "#2563EB", icon: "atom", description: "Class 11 Medical Entrance Physics focused on NEET pattern and numericals" },
    { name: "Physics", classGrade: "Class 11 JEE", code: "PHY11_JEE", color: "#2563EB", icon: "atom", description: "Class 11 Engineering Entrance Physics for JEE Main & Advanced" },
    { name: "Physics", classGrade: "NEET Dropper", code: "PHY_NEET_DROP", color: "#2563EB", icon: "atom", description: "Intensive NEET Dropper Physics complete syllabus revision & speed tests" },
    { name: "Physics", classGrade: "Class 12", code: "PHY12", color: "#2563EB", icon: "atom", description: "Class 12 Physics (Electromagnetism, Optics, Modern Physics)" },
    { name: "Physics", classGrade: "Class 12 NEET", code: "PHY12_NEET", color: "#2563EB", icon: "atom", description: "Class 12 Medical Entrance Physics focused on NEET pattern" },
    { name: "Physics", classGrade: "Class 12 JEE", code: "PHY12_JEE", color: "#2563EB", icon: "atom", description: "Class 12 Engineering Entrance Physics for JEE Main & Advanced" },
    { name: "Physics", classGrade: "JEE Dropper", code: "PHY_JEE_DROP", color: "#2563EB", icon: "atom", description: "Intensive JEE Dropper Physics comprehensive problem-solving" },

    // Chemistry
    { name: "Chemistry", classGrade: "Class 11", code: "CHEM11", color: "#D97706", icon: "flask-conical", description: "Class 11 Chemistry (Physical, Inorganic, Organic fundamentals)" },
    { name: "Chemistry", classGrade: "Class 11 NEET", code: "CHEM11_NEET", color: "#D97706", icon: "flask-conical", description: "Class 11 NEET Chemistry with NCERT line-by-line focus" },
    { name: "Chemistry", classGrade: "Class 11 JEE", code: "CHEM11_JEE", color: "#D97706", icon: "flask-conical", description: "Class 11 JEE Main & Advanced Chemistry" },
    { name: "Chemistry", classGrade: "NEET Dropper", code: "CHEM_NEET_DROP", color: "#D97706", icon: "flask-conical", description: "Target NEET Dropper Chemistry complete revision & test series" },
    { name: "Chemistry", classGrade: "Class 12", code: "CHEM12", color: "#D97706", icon: "flask-conical", description: "Class 12 Chemistry (Solutions, Electrochemistry, Kinetics, Organic)" },
    { name: "Chemistry", classGrade: "Class 12 NEET", code: "CHEM12_NEET", color: "#D97706", icon: "flask-conical", description: "Class 12 NEET Chemistry high-yield practice" },
    { name: "Chemistry", classGrade: "Class 12 JEE", code: "CHEM12_JEE", color: "#D97706", icon: "flask-conical", description: "Class 12 JEE Chemistry advanced mechanisms and physical problems" },
    { name: "Chemistry", classGrade: "JEE Dropper", code: "CHEM_JEE_DROP", color: "#D97706", icon: "flask-conical", description: "Target JEE Dropper Chemistry full syllabus revision" },

    // Biology
    { name: "Biology", classGrade: "Class 11", code: "BIO11", color: "#059669", icon: "dna", description: "Class 11 Biology (Diversity, Cell Biology, Plant & Human Physiology)" },
    { name: "Biology", classGrade: "Class 11 NEET", code: "BIO11_NEET", color: "#059669", icon: "dna", description: "Class 11 Medical Entrance NEET Biology" },
    { name: "Biology", classGrade: "NEET Dropper", code: "BIO_NEET_DROP", color: "#059669", icon: "dna", description: "NEET Dropper Target 360/360 Biology intensive syllabus mastery" },
    { name: "Biology", classGrade: "Class 12", code: "BIO12", color: "#059669", icon: "dna", description: "Class 12 Biology (Genetics, Evolution, Reproduction, Biotechnology, Ecology)" },
    { name: "Biology", classGrade: "Class 12 NEET", code: "BIO12_NEET", color: "#059669", icon: "dna", description: "Class 12 Medical Entrance NEET Biology mastery" },

    // Mathematics
    { name: "Mathematics", classGrade: "Class 11", code: "MATH11", color: "#4F46E5", icon: "calculator", description: "Class 11 Mathematics (Sets, Trigonometry, Coordinate Geometry, Calculus)" },
    { name: "Mathematics", classGrade: "Class 11 JEE", code: "MATH11_JEE", color: "#4F46E5", icon: "calculator", description: "Class 11 JEE Main & Advanced Mathematics rigorous problem solving" },
    { name: "Mathematics", classGrade: "Class 12", code: "MATH12", color: "#4F46E5", icon: "calculator", description: "Class 12 Mathematics (Calculus, Vectors, 3D, Probability)" },
    { name: "Mathematics", classGrade: "Class 12 JEE", code: "MATH12_JEE", color: "#4F46E5", icon: "calculator", description: "Class 12 JEE Main & Advanced Mathematics" },
    { name: "Mathematics", classGrade: "JEE Dropper", code: "MATH_JEE_DROP", color: "#4F46E5", icon: "calculator", description: "JEE Dropper Mathematics comprehensive advanced preparation" },
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
