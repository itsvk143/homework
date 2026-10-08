// scripts/migrate-to-mongo.js
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseDates(obj) {
  const dateKeys = [
    "createdAt",
    "updatedAt",
    "assignedDate",
    "dueDate",
    "startedAt",
    "submittedAt",
    "completedAt",
    "lastProgressUpdate",
    "reviewedAt",
    "uploadedAt",
    "timestamp",
  ];
  const newObj = { ...obj };
  for (const key of dateKeys) {
    if (newObj[key]) {
      newObj[key] = new Date(newObj[key]);
    }
  }
  return newObj;
}

function cleanUpdate(obj) {
  const copy = { ...obj };
  delete copy.id;
  return copy;
}

async function migrate() {
  const backupPath = path.join(__dirname, "sqlite-backup.json");
  if (!fs.existsSync(backupPath)) {
    console.error("Backup file not found at", backupPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  console.log("Beginning migration of SQLite records to MongoDB Atlas...");

  // 1. System Settings
  if (data.systemSettings && data.systemSettings.length > 0) {
    for (const item of data.systemSettings) {
      const parsed = parseDates(item);
      await prisma.systemSetting.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ SystemSettings migrated: ${data.systemSettings.length}`);
  }

  // 2. Users
  if (data.users && data.users.length > 0) {
    for (const item of data.users) {
      const parsed = parseDates(item);
      await prisma.user.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ Users migrated: ${data.users.length}`);
  }

  // 3. Student Profiles
  if (data.studentProfiles && data.studentProfiles.length > 0) {
    for (const item of data.studentProfiles) {
      const parsed = parseDates(item);
      await prisma.studentProfile.upsert({
        where: { userId: item.userId },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ StudentProfiles migrated: ${data.studentProfiles.length}`);
  }

  // 4. Teacher Profiles
  if (data.teacherProfiles && data.teacherProfiles.length > 0) {
    for (const item of data.teacherProfiles) {
      const parsed = parseDates(item);
      await prisma.teacherProfile.upsert({
        where: { userId: item.userId },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ TeacherProfiles migrated: ${data.teacherProfiles.length}`);
  }

  // 5. Subjects
  if (data.subjects && data.subjects.length > 0) {
    for (const item of data.subjects) {
      const parsed = parseDates(item);
      await prisma.subject.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ Subjects migrated: ${data.subjects.length}`);
  }

  // 6. Books
  if (data.books && data.books.length > 0) {
    for (const item of data.books) {
      const parsed = parseDates(item);
      await prisma.book.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ Books migrated: ${data.books.length}`);
  }

  // 7. Chapters
  if (data.chapters && data.chapters.length > 0) {
    for (const item of data.chapters) {
      const parsed = parseDates(item);
      await prisma.chapter.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ Chapters migrated: ${data.chapters.length}`);
  }

  // 8. Exercises
  if (data.exercises && data.exercises.length > 0) {
    for (const item of data.exercises) {
      const parsed = parseDates(item);
      await prisma.exercise.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ Exercises migrated: ${data.exercises.length}`);
  }

  // 9. StudentBooks
  if (data.studentBooks && data.studentBooks.length > 0) {
    for (const item of data.studentBooks) {
      const parsed = parseDates(item);
      await prisma.studentBook.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ StudentBooks migrated: ${data.studentBooks.length}`);
  }

  // 10. TeacherStudentAssignments
  if (data.teacherStudentAssignments && data.teacherStudentAssignments.length > 0) {
    for (const item of data.teacherStudentAssignments) {
      const parsed = parseDates(item);
      await prisma.teacherStudentAssignment.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ TeacherStudentAssignments migrated: ${data.teacherStudentAssignments.length}`);
  }

  // 11. HomeworkAssignments
  if (data.homeworkAssignments && data.homeworkAssignments.length > 0) {
    for (const item of data.homeworkAssignments) {
      const parsed = parseDates(item);
      await prisma.homeworkAssignment.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ HomeworkAssignments migrated: ${data.homeworkAssignments.length}`);
  }

  // 12. AuditLogs
  if (data.auditLogs && data.auditLogs.length > 0) {
    for (const item of data.auditLogs) {
      const parsed = parseDates(item);
      await prisma.auditLog.upsert({
        where: { id: item.id },
        update: cleanUpdate(parsed),
        create: parsed,
      });
    }
    console.log(`✅ AuditLogs migrated: ${data.auditLogs.length}`);
  }

  console.log("🎉 Complete migration to MongoDB Atlas finished successfully!");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
