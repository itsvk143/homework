import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import { GET as getStudents } from "../src/app/api/students/route";
import { GET as getStudentById } from "../src/app/api/students/[id]/route";
import { GET as getBooks } from "../src/app/api/books/route";
import {
  GET as getStudentBooks,
  POST as postStudentBooks,
  DELETE as deleteStudentBooks,
} from "../src/app/api/student-books/route";

function createAuthRequest(url: string, user: any, method = "GET", body?: any): NextRequest {
  const token = user ? createSessionToken(user) : "";
  const headers = new Headers();
  if (user) {
    headers.set(
      "cookie",
      `cb_user_id=${user.id}; cb_user_email=${user.email}; cb_user_role=${user.role}; cb_session=${token}`
    );
    headers.set("x-user-id", user.id);
    headers.set("x-user-email", user.email);
    headers.set("x-user-role", user.role);
    headers.set("x-session-token", token);
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function runTests() {
  console.log("\n============================================================");
  console.log("🚀 STARTING BOOK ASSIGNMENT WORKFLOW REGRESSION TEST SUITE");
  console.log("============================================================\n");

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // 1. Resolve actors
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
  });
  assert(!!admin, "Admin user exists in database");

  const laxmiKumari = await prisma.user.findUnique({
    where: { id: "user_teacher_laxmi_kumari" },
  });
  assert(!!laxmiKumari, "Laxmi Kumari teacher exists in database");

  const otherTeacher = await prisma.user.findUnique({
    where: { id: "user_teacher_vikash_kumar" },
  });
  assert(!!otherTeacher, "Other teacher (Vikash Kumar) exists in database");

  const subhashree = await prisma.user.findFirst({
    where: { email: "ssssssubhamaha2@gmail.com", role: "STUDENT" },
  });
  assert(!!subhashree, "Subhashree student exists in database");

  const otherStudent = await prisma.user.findFirst({
    where: {
      role: "STUDENT",
      id: { not: subhashree?.id },
      status: "ACTIVE",
    },
  });
  assert(!!otherStudent, "Other student exists in database");

  // Pick a test book: "Concepts and Problems in Organic Chemistry for NEET" (cmuphsnsh00h1ibing05s9hqi)
  const testBook = await prisma.book.findUnique({
    where: { id: "cmuphsnsh00h1ibing05s9hqi" },
  });
  assert(!!testBook, "Test book 'Concepts and Problems in Organic Chemistry' exists");

  // Cleanup any leftover test assignment for clean state
  await prisma.studentBook.deleteMany({
    where: {
      studentId: subhashree!.id,
      bookId: testBook!.id,
    },
  });

  // Record initial book assignment count
  const initialBookCountRes = await prisma.studentBook.count({
    where: { bookId: testBook!.id },
  });

  // Case 1: Unauthorized teacher cannot assign book to another teacher's student
  console.log("\n--- Case 1: Teacher Authorization Enforcement ---");
  const unauthReq = createAuthRequest(
    "/api/student-books",
    laxmiKumari,
    "POST",
    {
      studentIds: [otherStudent!.id],
      bookId: testBook!.id,
    }
  );
  const unauthRes = await postStudentBooks(unauthReq);
  assert(
    unauthRes.status === 403,
    "Unauthorized teacher assigning to other student returns HTTP 403",
    `Status: ${unauthRes.status}`
  );
  const unauthJson = await unauthRes.json();
  assert(
    unauthJson.success === false,
    "Unauthorized response contract returns success: false"
  );

  // Case 2: Invalid student ID rejected
  console.log("\n--- Case 2: Invalid Student ID Rejected ---");
  const invalidStudentReq = createAuthRequest(
    "/api/student-books",
    admin,
    "POST",
    {
      studentIds: ["non_existent_student_id_12345"],
      bookId: testBook!.id,
    }
  );
  const invalidStudentRes = await postStudentBooks(invalidStudentReq);
  assert(
    invalidStudentRes.status === 400,
    "Invalid student ID returns HTTP 400",
    `Status: ${invalidStudentRes.status}`
  );
  const invalidStudentJson = await invalidStudentRes.json();
  assert(
    invalidStudentJson.success === false,
    "Invalid student response returns success: false"
  );

  // Case 3: Invalid book ID rejected
  console.log("\n--- Case 3: Invalid Book ID Rejected ---");
  const invalidBookReq = createAuthRequest(
    "/api/student-books",
    admin,
    "POST",
    {
      studentIds: [subhashree!.id],
      bookId: "non_existent_book_id_99999",
    }
  );
  const invalidBookRes = await postStudentBooks(invalidBookReq);
  assert(
    invalidBookRes.status === 404,
    "Invalid book ID returns HTTP 404",
    `Status: ${invalidBookRes.status}`
  );
  const invalidBookJson = await invalidBookRes.json();
  assert(
    invalidBookJson.success === false,
    "Invalid book response returns success: false"
  );

  // Case 4: Authorized teacher (Laxmi Kumari) successfully assigns book to Subhashree
  console.log("\n--- Case 4: Authorized Teacher Book Assignment ---");
  const assignReq = createAuthRequest(
    "/api/student-books",
    laxmiKumari,
    "POST",
    {
      studentIds: [subhashree!.id],
      bookId: testBook!.id,
    }
  );
  const assignRes = await postStudentBooks(assignReq);
  assert(
    assignRes.status === 200,
    "Authorized teacher successfully assigns book (HTTP 200)",
    `Status: ${assignRes.status}`
  );
  const assignJson = await assignRes.json();
  assert(assignJson.success === true, "API response returns success: true");
  assert(assignJson.newlyAssignedCount === 1, "Response reports newlyAssignedCount === 1");
  assert(assignJson.alreadyAssignedCount === 0, "Response reports alreadyAssignedCount === 0");
  assert(
    assignJson.assignments.length === 1 && assignJson.assignments[0].bookId === testBook!.id,
    "Response includes structured assignment record matching book ID"
  );

  // Case 5: Verify persistence in database
  console.log("\n--- Case 5: Direct Database Record Verification ---");
  const persistedRecord = await prisma.studentBook.findUnique({
    where: {
      studentId_bookId: { studentId: subhashree!.id, bookId: testBook!.id },
    },
    include: { book: true, student: true, assignedBy: true },
  });
  assert(!!persistedRecord, "Assignment record genuinely exists in Prisma database");
  assert(
    persistedRecord?.assignedByTeacherId === laxmiKumari!.id,
    "Assignment record references Laxmi Kumari as assignedByTeacherId"
  );

  // Case 6: Student Profile Query retrieves the newly assigned book
  console.log("\n--- Case 6: Student Profile Query Verification ---");
  const profileReq = createAuthRequest(
    `/api/students/${subhashree!.id}`,
    laxmiKumari
  );
  const profileRes = await getStudentById(profileReq, {
    params: Promise.resolve({ id: subhashree!.id }),
  });
  assert(profileRes.status === 200, "Teacher fetches student profile returns HTTP 200");
  const profileJson = await profileRes.json();
  const profileBooks = profileJson.student.assignedBooksAsStudent || [];
  const hasAssignedBook = profileBooks.some(
    (ab: any) => (ab.book?.id || ab.bookId) === testBook!.id
  );
  assert(
    hasAssignedBook,
    "Student profile response contains newly assigned book in assignedBooksAsStudent"
  );

  // Case 7: Student books query /api/student-books returns the book
  console.log("\n--- Case 7: /api/student-books Query Verification ---");
  const sbReq = createAuthRequest(
    `/api/student-books?studentId=${subhashree!.id}`,
    laxmiKumari
  );
  const sbRes = await getStudentBooks(sbReq);
  assert(sbRes.status === 200, "Fetching student books returns HTTP 200");
  const sbJson = await sbRes.json();
  const studentBooksList = sbJson.studentBooks || [];
  const foundSb = studentBooksList.some(
    (sb: any) => sb.bookId === testBook!.id
  );
  assert(
    foundSb,
    "Newly assigned book is returned in /api/student-books query"
  );

  // Case 8: Master Book Library assignment count reflects persisted record
  console.log("\n--- Case 8: Master Book Library Count Audit ---");
  const booksReq = createAuthRequest("/api/books", laxmiKumari);
  const booksRes = await getBooks(booksReq);
  assert(booksRes.status === 200, "Fetching books library returns HTTP 200");
  const booksJson = await booksRes.json();
  const libraryBook = booksJson.books?.find((b: any) => b.id === testBook!.id);
  assert(!!libraryBook, "Target book found in books library response");
  assert(
    libraryBook._count?.studentBooks === initialBookCountRes + 1,
    `Library _count.studentBooks incremented accurately (${initialBookCountRes + 1})`
  );

  // Case 9: Repeated assignment is idempotent and does not create duplicates
  console.log("\n--- Case 9: Duplicate Assignment Idempotence ---");
  const repeatReq = createAuthRequest(
    "/api/student-books",
    laxmiKumari,
    "POST",
    {
      studentIds: [subhashree!.id],
      bookId: testBook!.id,
    }
  );
  const repeatRes = await postStudentBooks(repeatReq);
  assert(repeatRes.status === 200, "Repeated assignment returns HTTP 200");
  const repeatJson = await repeatRes.json();
  assert(repeatJson.success === true, "Repeated assignment succeeds cleanly");
  assert(repeatJson.newlyAssignedCount === 0, "Repeated assignment reports newlyAssignedCount === 0");
  assert(repeatJson.alreadyAssignedCount === 1, "Repeated assignment reports alreadyAssignedCount === 1");
  assert(
    repeatJson.assignments[0].isNew === false,
    "Assignment marked with isNew: false"
  );

  // Total records for this student and book in database remains exactly 1
  const countInDb = await prisma.studentBook.count({
    where: {
      studentId: subhashree!.id,
      bookId: testBook!.id,
    },
  });
  assert(countInDb === 1, "Database contains exactly 1 unique record (no duplicate)");

  // Case 10: Removing the book (DELETE) works correctly
  console.log("\n--- Case 10: Unassign Book Workflow ---");
  const deleteReq = createAuthRequest(
    `/api/student-books?studentId=${subhashree!.id}&bookId=${testBook!.id}`,
    laxmiKumari,
    "DELETE"
  );
  const deleteRes = await deleteStudentBooks(deleteReq);
  assert(deleteRes.status === 200, "Authorized teacher unassigns book returns HTTP 200");
  const deleteJson = await deleteRes.json();
  assert(deleteJson.success === true, "Unassign returns success: true");
  assert(deleteJson.count === 1, "Unassign reports deleted count === 1");

  // Verify deletion in database
  const afterDeleteInDb = await prisma.studentBook.findUnique({
    where: {
      studentId_bookId: { studentId: subhashree!.id, bookId: testBook!.id },
    },
  });
  assert(afterDeleteInDb === null, "Assignment record removed from database");

  // Verify assignment count decremented back
  const countAfterDelete = await prisma.studentBook.count({
    where: { bookId: testBook!.id },
  });
  assert(
    countAfterDelete === initialBookCountRes,
    `Library count decremented back to initial value (${initialBookCountRes})`
  );

  // Case 11: Admin can assign book
  console.log("\n--- Case 11: Admin Assignment Workflow ---");
  const adminAssignReq = createAuthRequest(
    "/api/student-books",
    admin,
    "POST",
    {
      studentIds: [subhashree!.id],
      bookId: testBook!.id,
    }
  );
  const adminAssignRes = await postStudentBooks(adminAssignReq);
  assert(adminAssignRes.status === 200, "Admin assigns book returns HTTP 200");
  const adminAssignJson = await adminAssignRes.json();
  assert(adminAssignJson.success === true, "Admin assignment reports success: true");

  // Clean up test assignment so test leaves DB in pristine state
  await prisma.studentBook.deleteMany({
    where: {
      studentId: subhashree!.id,
      bookId: testBook!.id,
    },
  });

  console.log("\n============================================================");
  console.log(`🎉 ALL ${passedCount}/${totalCount} REGRESSION TESTS PASSED SUCCESSFULLY!`);
  console.log("============================================================\n");
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
