export interface SeedBook {
  bookCode: string;
  name: string;
  curriculumType: "NCERT" | "JEE" | "NEET" | "CBSE" | "OTHER";
  bookType: "NCERT" | "REFERENCE" | "COMPETITIVE" | "SCHOOL";
  exam?: string | null;
  branch?: string | null;
  subjectName: string;
  subjectCode: string;
  classGrade: string;
  author: string;
  publisher: string;
  edition: string;
  language: string;
  coverUrl?: string;
  description: string;
  chapters: Array<{
    chapterNumber: number;
    name: string;
    exercises: Array<{
      name: string;
      exerciseNumber: string;
      totalQuestions: number;
      questionRange?: string;
      pageNumber?: number;
    }>;
  }>;
}

export const MASTER_BOOKS: SeedBook[] = [
  // ==========================================
  // CLASS 4 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_4_MATHEMATICS",
    name: "Math-Magic Book 4",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH4",
    classGrade: "Class 4",
    author: "NCERT Editorial Board",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    coverUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=200&auto=format&fit=crop&q=80",
    description: "Official NCERT Class 4 Mathematics textbook introducing geometry, numbers, and measurement.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Building with Bricks",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10, questionRange: "1–10" },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 8, questionRange: "1–8" },
        ],
      },
      {
        chapterNumber: 2,
        name: "Long and Short",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12, questionRange: "1–12" },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 10, questionRange: "1–10" },
        ],
      },
      {
        chapterNumber: 3,
        name: "A Trip to Bhopal",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 15, questionRange: "1–15" }],
      },
      {
        chapterNumber: 4,
        name: "Tick-Tick-Tick",
        exercises: [
          { name: "Exercise 4.1", exerciseNumber: "4.1", totalQuestions: 12, questionRange: "1–12" },
          { name: "Exercise 4.2", exerciseNumber: "4.2", totalQuestions: 10, questionRange: "1–10" },
        ],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_4_EVS",
    name: "Looking Around (Class 4 EVS)",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Environmental Studies",
    subjectCode: "EVS4",
    classGrade: "Class 4",
    author: "NCERT Department of Elementary Education",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Environmental Studies textbook for Class 4.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Going to School",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 8 }],
      },
      {
        chapterNumber: 2,
        name: "Ear to Ear",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 3,
        name: "A Day with Nandu",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 8 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_4_ENGLISH",
    name: "Marigold Book 4",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "English",
    subjectCode: "ENG4",
    classGrade: "Class 4",
    author: "NCERT Language Team",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 4 English textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Wake Up! & Neha's Alarm Clock",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 2,
        name: "Noses & The Little Fir Tree",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_4_HINDI",
    name: "Rimjhim Bhag 4",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Hindi",
    subjectCode: "HIN4",
    classGrade: "Class 4",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "Hindi",
    description: "Official NCERT Class 4 Hindi textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Man Ke Bhole-Bhale Badal",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 8 }],
      },
      {
        chapterNumber: 2,
        name: "Jaisa Sawal Waisa Jawab",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 8 }],
      },
    ],
  },

  // ==========================================
  // CLASS 5 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_5_MATHEMATICS",
    name: "Math-Magic Book 5",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH5",
    classGrade: "Class 5",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 5 Mathematics textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "The Fish Tale",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 12, questionRange: "1–12" },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 10, questionRange: "1–10" },
        ],
      },
      {
        chapterNumber: 2,
        name: "Shapes and Angles",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10, questionRange: "1–10" }],
      },
      {
        chapterNumber: 3,
        name: "How Many Squares?",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 12, questionRange: "1–12" }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_5_EVS",
    name: "Looking Around (Class 5 EVS)",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Environmental Studies",
    subjectCode: "EVS5",
    classGrade: "Class 5",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 5 Environmental Studies.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Super Senses",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 2,
        name: "A Snake Charmer's Story",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 8 }],
      },
    ],
  },

  // ==========================================
  // CLASS 6 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_6_MATHEMATICS",
    name: "Mathematics Class 6 (Ganita Prakash)",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH6",
    classGrade: "Class 6",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 6 Mathematics textbook aligned with NCF-SE.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Patterns in Mathematics",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 12 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Lines and Angles",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 8 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Number Play",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 14 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_6_SCIENCE",
    name: "Science Class 6 (Curiosity)",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Science",
    subjectCode: "SCI6",
    classGrade: "Class 6",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 6 Science textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "The Wonderful World of Science",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 8 }],
      },
      {
        chapterNumber: 2,
        name: "Diversity in the Living World",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 3,
        name: "Mindful Eating: A Path to a Healthy Body",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 10 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_6_SOCIAL_SCIENCE",
    name: "Exploring Society: India and Beyond (Class 6 Social Science)",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Social Science",
    subjectCode: "SST6",
    classGrade: "Class 6",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official combined NCERT Social Science textbook for Class 6 covering History, Geography, and Civics.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Locating Places on the Earth",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 8 }],
      },
      {
        chapterNumber: 2,
        name: "Oceans and Continents",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 8 }],
      },
      {
        chapterNumber: 3,
        name: "Landforms and Life",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 4,
        name: "Timeline and Sources of History",
        exercises: [{ name: "Exercise 4.1", exerciseNumber: "4.1", totalQuestions: 8 }],
      },
    ],
  },

  // ==========================================
  // CLASS 7 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_7_MATHEMATICS",
    name: "Mathematics Class 7",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH7",
    classGrade: "Class 7",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 7 Mathematics textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Integers",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 10 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Fractions and Decimals",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 10 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Data Handling",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 10 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_7_SCIENCE",
    name: "Science Class 7",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Science",
    subjectCode: "SCI7",
    classGrade: "Class 7",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 7 Science textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Nutrition in Plants",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 2,
        name: "Nutrition in Animals",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12 }],
      },
      {
        chapterNumber: 3,
        name: "Heat",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 10 }],
      },
    ],
  },

  // ==========================================
  // CLASS 8 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_8_MATHEMATICS",
    name: "NCERT Mathematics Class 8",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH8",
    classGrade: "Class 8",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Mathematics Class 8 textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Rational Numbers",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10, pageNumber: 14, questionRange: "1–10" },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 8, pageNumber: 20, questionRange: "1–8" },
        ],
      },
      {
        chapterNumber: 2,
        name: "Linear Equations in One Variable",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12, pageNumber: 32, questionRange: "1–12" },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 16, pageNumber: 38, questionRange: "1–16" },
        ],
      },
      {
        chapterNumber: 3,
        name: "Understanding Quadrilaterals",
        exercises: [
          { name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 8, pageNumber: 52, questionRange: "1–8" },
          { name: "Exercise 3.2", exerciseNumber: "3.2", totalQuestions: 6, pageNumber: 60, questionRange: "1–6" },
        ],
      },
      {
        chapterNumber: 4,
        name: "Data Handling",
        exercises: [
          { name: "Exercise 4.1", exerciseNumber: "4.1", totalQuestions: 15, pageNumber: 70, questionRange: "1–15" },
          { name: "Exercise 4.2", exerciseNumber: "4.2", totalQuestions: 20, pageNumber: 75, questionRange: "1–20" },
          { name: "Exercise 4.3", exerciseNumber: "4.3", totalQuestions: 12, pageNumber: 82, questionRange: "1–12" },
        ],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_8_SCIENCE",
    name: "NCERT Science Class 8",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Science",
    subjectCode: "SCI8",
    classGrade: "Class 8",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Science Class 8 textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Crop Production and Management",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 10, pageNumber: 12, questionRange: "1–10" },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 8, pageNumber: 16, questionRange: "1–8" },
        ],
      },
      {
        chapterNumber: 2,
        name: "Microorganisms: Friend and Foe",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 12, pageNumber: 28, questionRange: "1–12" },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 10, pageNumber: 34, questionRange: "1–10" },
        ],
      },
    ],
  },

  // ==========================================
  // CLASS 9 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_9_MATHEMATICS",
    name: "Mathematics Class 9",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH9",
    classGrade: "Class 9",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 9 Mathematics textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Number Systems",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 4 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 4 },
          { name: "Exercise 1.3", exerciseNumber: "1.3", totalQuestions: 9 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Polynomials",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 5 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 4 },
          { name: "Exercise 2.3", exerciseNumber: "2.3", totalQuestions: 5 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Coordinate Geometry",
        exercises: [
          { name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 2 },
          { name: "Exercise 3.2", exerciseNumber: "3.2", totalQuestions: 2 },
        ],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_9_SCIENCE",
    name: "Science Class 9",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Science",
    subjectCode: "SCI9",
    classGrade: "Class 9",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 9 Science textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Matter in Our Surroundings",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 9 }],
      },
      {
        chapterNumber: 2,
        name: "Is Matter Around Us Pure?",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 11 }],
      },
      {
        chapterNumber: 3,
        name: "Atoms and Molecules",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 11 }],
      },
    ],
  },

  // ==========================================
  // CLASS 10 NCERT
  // ==========================================
  {
    bookCode: "NCERT_CLASS_10_MATHEMATICS",
    name: "Mathematics Class 10",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH10",
    classGrade: "Class 10",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 10 Board Mathematics textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Real Numbers",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 7 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 3 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Polynomials",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 6 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 2 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Pair of Linear Equations in Two Variables",
        exercises: [
          { name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 3 },
          { name: "Exercise 3.2", exerciseNumber: "3.2", totalQuestions: 7 },
        ],
      },
      {
        chapterNumber: 4,
        name: "Quadratic Equations",
        exercises: [
          { name: "Exercise 4.1", exerciseNumber: "4.1", totalQuestions: 2 },
          { name: "Exercise 4.2", exerciseNumber: "4.2", totalQuestions: 6 },
        ],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_10_SCIENCE",
    name: "Science Class 10",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Science",
    subjectCode: "SCI10",
    classGrade: "Class 10",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 10 Board Science textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Chemical Reactions and Equations",
        exercises: [{ name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 20 }],
      },
      {
        chapterNumber: 2,
        name: "Acids, Bases and Salts",
        exercises: [{ name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 15 }],
      },
      {
        chapterNumber: 3,
        name: "Metals and Non-metals",
        exercises: [{ name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 16 }],
      },
      {
        chapterNumber: 4,
        name: "Life Processes",
        exercises: [{ name: "Exercise 4.1", exerciseNumber: "4.1", totalQuestions: 13 }],
      },
    ],
  },

  // ==========================================
  // CLASS 11 NCERT (Senior Secondary)
  // ==========================================
  {
    bookCode: "NCERT_CLASS_11_PHYSICS_PART1",
    name: "Physics Part I Class 11",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Physics",
    subjectCode: "PHY11",
    classGrade: "Class 11",
    author: "NCERT Department of Education in Science and Mathematics",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 11 Physics Part 1 covering mechanics and measurements.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Units and Measurements",
        exercises: [{ name: "Exercises 1.1–1.24", exerciseNumber: "1.1", totalQuestions: 24 }],
      },
      {
        chapterNumber: 2,
        name: "Motion in a Straight Line",
        exercises: [{ name: "Exercises 2.1–2.18", exerciseNumber: "2.1", totalQuestions: 18 }],
      },
      {
        chapterNumber: 3,
        name: "Motion in a Plane",
        exercises: [{ name: "Exercises 3.1–3.22", exerciseNumber: "3.1", totalQuestions: 22 }],
      },
      {
        chapterNumber: 4,
        name: "Laws of Motion",
        exercises: [{ name: "Exercises 4.1–4.24", exerciseNumber: "4.1", totalQuestions: 24 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_11_CHEMISTRY_PART1",
    name: "Chemistry Part I Class 11",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Chemistry",
    subjectCode: "CHEM11",
    classGrade: "Class 11",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 11 Chemistry Part 1 covering foundational principles.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Some Basic Concepts of Chemistry",
        exercises: [{ name: "Exercises 1.1–1.36", exerciseNumber: "1.1", totalQuestions: 36 }],
      },
      {
        chapterNumber: 2,
        name: "Structure of Atom",
        exercises: [{ name: "Exercises 2.1–2.40", exerciseNumber: "2.1", totalQuestions: 40 }],
      },
      {
        chapterNumber: 3,
        name: "Classification of Elements and Periodicity in Properties",
        exercises: [{ name: "Exercises 3.1–3.25", exerciseNumber: "3.1", totalQuestions: 25 }],
      },
      {
        chapterNumber: 4,
        name: "Chemical Bonding and Molecular Structure",
        exercises: [{ name: "Exercises 4.1–4.35", exerciseNumber: "4.1", totalQuestions: 35 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_11_BIOLOGY",
    name: "Biology Class 11",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Biology",
    subjectCode: "BIO11",
    classGrade: "Class 11",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 11 Biology textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "The Living World",
        exercises: [{ name: "Review Exercises", exerciseNumber: "1.1", totalQuestions: 10 }],
      },
      {
        chapterNumber: 2,
        name: "Biological Classification",
        exercises: [{ name: "Review Exercises", exerciseNumber: "2.1", totalQuestions: 12 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_11_MATHEMATICS",
    name: "Mathematics Class 11",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH11",
    classGrade: "Class 11",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 11 Mathematics textbook.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Sets",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 6 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 6 },
          { name: "Exercise 1.3", exerciseNumber: "1.3", totalQuestions: 9 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Relations and Functions",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 10 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 9 },
        ],
      },
    ],
  },

  // ==========================================
  // CLASS 12 NCERT (Senior Secondary)
  // ==========================================
  {
    bookCode: "NCERT_CLASS_12_PHYSICS_PART1",
    name: "Physics Part I Class 12",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Physics",
    subjectCode: "PHY12",
    classGrade: "Class 12",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 12 Physics Part 1 covering electrostatics and magnetism.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Electric Charges and Fields",
        exercises: [{ name: "Exercises 1.1–1.24", exerciseNumber: "1.1", totalQuestions: 24 }],
      },
      {
        chapterNumber: 2,
        name: "Electrostatic Potential and Capacitance",
        exercises: [{ name: "Exercises 2.1–2.22", exerciseNumber: "2.1", totalQuestions: 22 }],
      },
      {
        chapterNumber: 3,
        name: "Current Electricity",
        exercises: [{ name: "Exercises 3.1–3.20", exerciseNumber: "3.1", totalQuestions: 20 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_12_CHEMISTRY_PART1",
    name: "Chemistry Part I Class 12",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Chemistry",
    subjectCode: "CHEM12",
    classGrade: "Class 12",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 12 Chemistry Part 1 covering solutions and electrochemistry.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Solutions",
        exercises: [{ name: "Exercises 1.1–1.28", exerciseNumber: "1.1", totalQuestions: 28 }],
      },
      {
        chapterNumber: 2,
        name: "Electrochemistry",
        exercises: [{ name: "Exercises 2.1–2.25", exerciseNumber: "2.1", totalQuestions: 25 }],
      },
      {
        chapterNumber: 3,
        name: "Chemical Kinetics",
        exercises: [{ name: "Exercises 3.1–3.22", exerciseNumber: "3.1", totalQuestions: 22 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_12_BIOLOGY",
    name: "Biology Class 12",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Biology",
    subjectCode: "BIO12",
    classGrade: "Class 12",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 12 Biology covering genetics and biotechnology.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Sexual Reproduction in Flowering Plants",
        exercises: [{ name: "Review Exercises", exerciseNumber: "1.1", totalQuestions: 14 }],
      },
      {
        chapterNumber: 2,
        name: "Human Reproduction",
        exercises: [{ name: "Review Exercises", exerciseNumber: "2.1", totalQuestions: 15 }],
      },
      {
        chapterNumber: 3,
        name: "Principles of Inheritance and Variation",
        exercises: [{ name: "Review Exercises", exerciseNumber: "3.1", totalQuestions: 16 }],
      },
    ],
  },
  {
    bookCode: "NCERT_CLASS_12_MATHEMATICS_PART1",
    name: "Mathematics Part I Class 12",
    curriculumType: "NCERT",
    bookType: "NCERT",
    subjectName: "Mathematics",
    subjectCode: "MATH12",
    classGrade: "Class 12",
    author: "NCERT",
    publisher: "NCERT",
    edition: "2025–26 Edition",
    language: "English",
    description: "Official NCERT Class 12 Mathematics Part 1 covering calculus and algebra.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Relations and Functions",
        exercises: [
          { name: "Exercise 1.1", exerciseNumber: "1.1", totalQuestions: 16 },
          { name: "Exercise 1.2", exerciseNumber: "1.2", totalQuestions: 12 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Inverse Trigonometric Functions",
        exercises: [
          { name: "Exercise 2.1", exerciseNumber: "2.1", totalQuestions: 14 },
          { name: "Exercise 2.2", exerciseNumber: "2.2", totalQuestions: 21 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Matrices",
        exercises: [
          { name: "Exercise 3.1", exerciseNumber: "3.1", totalQuestions: 10 },
          { name: "Exercise 3.2", exerciseNumber: "3.2", totalQuestions: 22 },
        ],
      },
    ],
  },

  // ==========================================
  // COMPETITIVE EXAM: JEE (Sections 78 & 80)
  // ==========================================
  {
    bookCode: "JEE_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI",
    name: "Problems in Physical Chemistry for JEE (Main & Advanced)",
    curriculumType: "JEE",
    bookType: "COMPETITIVE",
    exam: "JEE",
    branch: "Physical Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_JEE",
    classGrade: "Class 11 & 12",
    author: "Narendra Avasthi",
    publisher: "Shri Balaji Publications",
    edition: "16th Edition",
    language: "English",
    coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=200&auto=format&fit=crop&q=80",
    description: "Benchmark problem-solving book for JEE Main and Advanced Physical Chemistry featuring Level 1, Level 2, and Passages.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Some Basic Concepts of Chemistry (Mole Concept)",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "1.1", totalQuestions: 50 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "1.2", totalQuestions: 30 },
          { name: "Passage & Matching Type", exerciseNumber: "1.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Structure of Atom",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "2.1", totalQuestions: 45 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "2.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "2.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Chemical Thermodynamics",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "3.1", totalQuestions: 50 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "3.2", totalQuestions: 30 },
          { name: "Passage & Matching Type", exerciseNumber: "3.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 4,
        name: "Chemical Equilibrium",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "4.1", totalQuestions: 40 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "4.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "4.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 5,
        name: "Ionic Equilibrium",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "5.1", totalQuestions: 50 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "5.2", totalQuestions: 30 },
          { name: "Passage & Matching Type", exerciseNumber: "5.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 6,
        name: "Redox Reactions",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "6.1", totalQuestions: 40 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "6.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "6.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 7,
        name: "Solutions",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "7.1", totalQuestions: 45 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "7.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "7.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 8,
        name: "Electrochemistry",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "8.1", totalQuestions: 45 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "8.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "8.3", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 9,
        name: "Chemical Kinetics",
        exercises: [
          { name: "Level 1: Objective Problems", exerciseNumber: "9.1", totalQuestions: 45 },
          { name: "Level 2: Advanced Problems", exerciseNumber: "9.2", totalQuestions: 25 },
          { name: "Passage & Matching Type", exerciseNumber: "9.3", totalQuestions: 15 },
        ],
      },
    ],
  },
  {
    bookCode: "JEE_CHEMISTRY_ORGANIC_MS_CHOUHAN",
    name: "Advanced Problems in Organic Chemistry for JEE (Main & Advanced)",
    curriculumType: "JEE",
    bookType: "COMPETITIVE",
    exam: "JEE",
    branch: "Organic Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_JEE",
    classGrade: "Class 11 & 12",
    author: "M. S. Chouhan",
    publisher: "Shri Balaji Publications",
    edition: "15th Edition",
    language: "English",
    coverUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=200&auto=format&fit=crop&q=80",
    description: "Standard reference for JEE Advanced Organic Chemistry with comprehensive conceptual mechanisms.",
    chapters: [
      {
        chapterNumber: 1,
        name: "General Organic Chemistry (GOC)",
        exercises: [
          { name: "Single Choice Questions", exerciseNumber: "1.1", totalQuestions: 40 },
          { name: "Multiple Choice Questions", exerciseNumber: "1.2", totalQuestions: 25 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Isomerism",
        exercises: [
          { name: "Single Choice Questions", exerciseNumber: "2.1", totalQuestions: 35 },
          { name: "Matrix Match & Numerical", exerciseNumber: "2.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Hydrocarbons (Alkanes, Alkenes, Alkynes)",
        exercises: [
          { name: "Single Choice Questions", exerciseNumber: "3.1", totalQuestions: 45 },
          { name: "Reaction Roadmaps & Multistep", exerciseNumber: "3.2", totalQuestions: 20 },
        ],
      },
      {
        chapterNumber: 4,
        name: "Alkyl Halides & Elimination Reactions",
        exercises: [
          { name: "Single Choice Questions", exerciseNumber: "4.1", totalQuestions: 40 },
          { name: "Advanced Multiple Choice", exerciseNumber: "4.2", totalQuestions: 20 },
        ],
      },
      {
        chapterNumber: 5,
        name: "Alcohols, Phenols & Ethers",
        exercises: [{ name: "Single Choice Questions", exerciseNumber: "5.1", totalQuestions: 35 }],
      },
      {
        chapterNumber: 6,
        name: "Aldehydes & Ketones",
        exercises: [
          { name: "Single Choice Questions", exerciseNumber: "6.1", totalQuestions: 45 },
          { name: "Named Reactions & Mechanisms", exerciseNumber: "6.2", totalQuestions: 25 },
        ],
      },
    ],
  },
  {
    bookCode: "JEE_CHEMISTRY_ORGANIC_HIMANSHU_PANDEY",
    name: "Advanced Problems in Organic Chemistry for JEE",
    curriculumType: "JEE",
    bookType: "COMPETITIVE",
    exam: "JEE",
    branch: "Organic Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_JEE",
    classGrade: "Class 11 & 12",
    author: "Himanshu Pandey",
    publisher: "GRB Publications",
    edition: "12th Edition",
    language: "English",
    description: "Highly acclaimed organic chemistry problem book for IIT-JEE aspirants.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Nomenclature & Basic Organic Chemistry",
        exercises: [{ name: "Exercise Level 1", exerciseNumber: "1.1", totalQuestions: 35 }],
      },
      {
        chapterNumber: 2,
        name: "Aromatic Compounds & Electrophilic Substitution",
        exercises: [{ name: "Exercise Level 1", exerciseNumber: "2.1", totalQuestions: 40 }],
      },
      {
        chapterNumber: 3,
        name: "Carbonyl Compounds & Carboxylic Acids",
        exercises: [{ name: "Exercise Level 1", exerciseNumber: "3.1", totalQuestions: 45 }],
      },
    ],
  },

  // ==========================================
  // COMPETITIVE EXAM: NEET (Sections 79 & 81)
  // ==========================================
  {
    bookCode: "NEET_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI",
    name: "Objective Physical Chemistry for NEET",
    curriculumType: "NEET",
    bookType: "COMPETITIVE",
    exam: "NEET",
    branch: "Physical Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_NEET",
    classGrade: "Class 11 & 12",
    author: "Narendra Avasthi",
    publisher: "Shri Balaji Publications",
    edition: "8th Edition",
    language: "English",
    coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=200&auto=format&fit=crop&q=80",
    description: "Targeted NEET Physical Chemistry reference book focused on high-yield NCERT-based objective questions.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Some Basic Concepts of Chemistry (Mole Concept)",
        exercises: [
          { name: "Exercise 1: Basic Principles & Mole Calculation", exerciseNumber: "1.1", totalQuestions: 20 },
          { name: "Exercise 2: Limiting Reagents & Stoichiometry", exerciseNumber: "1.2", totalQuestions: 20 },
          { name: "Exercise 3: Concentration Terms (M, m, N, ppm)", exerciseNumber: "1.3", totalQuestions: 15 },
          { name: "Exercise 4: Advanced Redox & Equivalent Concept", exerciseNumber: "1.4", totalQuestions: 20 },
          { name: "Exercise 5: Past 10 Years NEET Exam Questions", exerciseNumber: "1.5", totalQuestions: 12 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Structure of Atom",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "2.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "2.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Chemical Thermodynamics",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "3.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "3.2", totalQuestions: 20 },
        ],
      },
      {
        chapterNumber: 4,
        name: "Chemical Equilibrium",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "4.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "4.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 5,
        name: "Ionic Equilibrium",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "5.1", totalQuestions: 45 },
          { name: "Past Years NEET Questions", exerciseNumber: "5.2", totalQuestions: 20 },
        ],
      },
      {
        chapterNumber: 6,
        name: "Redox Reactions",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "6.1", totalQuestions: 35 },
          { name: "Past Years NEET Questions", exerciseNumber: "6.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 7,
        name: "Solutions",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "7.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "7.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 8,
        name: "Electrochemistry",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "8.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "8.2", totalQuestions: 15 },
        ],
      },
      {
        chapterNumber: 9,
        name: "Chemical Kinetics",
        exercises: [
          { name: "NCERT Based Objective Questions", exerciseNumber: "9.1", totalQuestions: 40 },
          { name: "Past Years NEET Questions", exerciseNumber: "9.2", totalQuestions: 15 },
        ],
      },
    ],
  },
  {
    bookCode: "NEET_CHEMISTRY_ORGANIC_MS_CHOUHAN",
    name: "Elementary Problems in Organic Chemistry for NEET",
    curriculumType: "NEET",
    bookType: "COMPETITIVE",
    exam: "NEET",
    branch: "Organic Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_NEET",
    classGrade: "Class 11 & 12",
    author: "M. S. Chouhan",
    publisher: "Shri Balaji Publications",
    edition: "10th Edition",
    language: "English",
    coverUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=200&auto=format&fit=crop&q=80",
    description: "Specially designed for Medical entrance (NEET) strictly adhering to NCERT lines and mechanisms.",
    chapters: [
      {
        chapterNumber: 1,
        name: "GOC & Reaction Intermediates",
        exercises: [
          { name: "Level 1: NCERT Line By Line", exerciseNumber: "1.1", totalQuestions: 40 },
          { name: "Level 2: NEET Pattern MCQs", exerciseNumber: "1.2", totalQuestions: 25 },
        ],
      },
      {
        chapterNumber: 2,
        name: "Hydrocarbons",
        exercises: [
          { name: "Level 1: NCERT Line By Line", exerciseNumber: "2.1", totalQuestions: 35 },
          { name: "Level 2: NEET Pattern MCQs", exerciseNumber: "2.2", totalQuestions: 20 },
        ],
      },
      {
        chapterNumber: 3,
        name: "Haloalkanes and Haloarenes",
        exercises: [{ name: "Level 1: NCERT Line By Line", exerciseNumber: "3.1", totalQuestions: 30 }],
      },
      {
        chapterNumber: 4,
        name: "Oxygen Containing Organic Compounds",
        exercises: [
          { name: "Level 1: NCERT Line By Line", exerciseNumber: "4.1", totalQuestions: 45 },
          { name: "Level 2: NEET Pattern MCQs", exerciseNumber: "4.2", totalQuestions: 25 },
        ],
      },
      {
        chapterNumber: 5,
        name: "Amines & Biomolecules",
        exercises: [{ name: "Level 1: NCERT Line By Line", exerciseNumber: "5.1", totalQuestions: 35 }],
      },
    ],
  },
  {
    bookCode: "NEET_CHEMISTRY_ORGANIC_HIMANSHU_PANDEY",
    name: "Concepts and Problems in Organic Chemistry for NEET",
    curriculumType: "NEET",
    bookType: "COMPETITIVE",
    exam: "NEET",
    branch: "Organic Chemistry",
    subjectName: "Chemistry",
    subjectCode: "CHEM_NEET",
    classGrade: "Class 11 & 12",
    author: "Himanshu Pandey",
    publisher: "GRB Publications",
    edition: "9th Edition",
    language: "English",
    description: "NEET edition focusing on high-accuracy concept building and NCERT exemplar alignment.",
    chapters: [
      {
        chapterNumber: 1,
        name: "Organic Chemistry Principles & Techniques",
        exercises: [{ name: "Objective MCQs", exerciseNumber: "1.1", totalQuestions: 30 }],
      },
      {
        chapterNumber: 2,
        name: "Alcohols, Phenols and Ethers for NEET",
        exercises: [{ name: "Objective MCQs", exerciseNumber: "2.1", totalQuestions: 35 }],
      },
      {
        chapterNumber: 3,
        name: "Aldehydes, Ketones and Carboxylic Acids for NEET",
        exercises: [{ name: "Objective MCQs", exerciseNumber: "3.1", totalQuestions: 40 }],
      },
    ],
  },
];
