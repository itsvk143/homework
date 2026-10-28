import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import { GET as getStudents } from "../src/app/api/students/route";
import { GET as getStudentById } from "../src/app/api/students/[id]/route";
import { GET as getHomework, POST as postHomework } from "../src/app/api/homework/route";
import { GET as getHomeworkById } from "../src/app/api/homework/[id]/route";
import { GET as getStudentBooks, POST as postStudentBooks } from "../src/app/api/student-books/route";
import { GET as getChapterProgress } from "../src/app/api/teacher/chapter-progress/route";

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
  console.log("🚀 STARTING TEACHER-STUDENT DATA ISOLATION TEST SUITE");
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

  // 1. Resolve test actors
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
  });
  const teacherA = await prisma.user.findUnique({
    where: { id: "user_teacher_vikash_kumar" },
  });
  const teacherB = await prisma.user.findUnique({
    where: { id: "user_teacher_laxmi_kumari" },
  });

  if (!adminUser || !teacherA || !teacherB) {
    throw new Error("Missing required seed users: adminUser, teacherA, or teacherB");
  }

  // Student 1: Assigned ONLY to Teacher A (Vikash Kumar)
  const student1 = await prisma.user.findUnique({
    where: { id: "cmuzmucst0000kx06sxrh4vbl" }, // Lolakshi (Chemistry only with Vikash)
  });

  // Student 3: Assigned to BOTH teachers (Subhashree)
  const student3 = await prisma.user.findUnique({
    where: { id: "cmuxyiff80000jm04xwlf7qxv" }, // Subhashree (Chemistry with Vikash, Biology with Laxmi)
  });

  // Student 4: Unassigned student
  const student4 = await prisma.user.findUnique({
    where: { id: "user_student_lv_tax_consultancy" }, // LV TAX CONSULTANCY
  });

  // Biology subject for test fixtures
  const biologySubject = await prisma.subject.findFirst({
    where: { name: { contains: "Biology" } },
  });

  // Setup temporary Student 2 (Assigned ONLY to Teacher B: Laxmi Kumari)
  const tempStudent2Id = "test_student_2_laxmi_only";
  let student2 = await prisma.user.findUnique({ where: { id: tempStudent2Id } });
  if (!student2) {
    student2 = await prisma.user.create({
      data: {
        id: tempStudent2Id,
        name: "Test Student 2 (Laxmi Only)",
        email: "test.student2.laxmi@test.com",
        role: "STUDENT",
        status: "ACTIVE",
        studentProfile: {
          create: {
            classGrade: "NEET Dropper",
            section: "B",
            schoolName: "LV INSTITUTE",
          },
        },
      },
    });
  }

  // Ensure Student 2 is assigned ONLY to Teacher B
  await prisma.teacherStudentAssignment.upsert({
    where: {
      teacherId_studentId_subjectId: {
        teacherId: teacherB.id,
        studentId: student2.id,
        subjectId: biologySubject?.id || "cmuxy_dummy_sub",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      teacherId: teacherB.id,
      studentId: student2.id,
      subjectId: biologySubject?.id || "cmuxy_dummy_sub",
      status: "ACTIVE",
      academicYear: "2026-2027",
    },
  });

  // Setup Teacher C (Zero assignments)
  const tempTeacherZeroId = "test_teacher_zero_assignments";
  let teacherZero = await prisma.user.findUnique({ where: { id: tempTeacherZeroId } });
  if (!teacherZero) {
    teacherZero = await prisma.user.create({
      data: {
        id: tempTeacherZeroId,
        name: "Teacher With Zero Assignments",
        email: "teacher.zero@test.com",
        role: "TEACHER",
        status: "ACTIVE",
        teacherProfile: {
          create: {
            subjectSpecialty: "Physics",
          },
        },
      },
    });
  }
  // Guarantee zero assignments for teacherZero
  await prisma.teacherStudentAssignment.deleteMany({
    where: { teacherId: teacherZero.id },
  });

  try {
    // ------------------------------------------------------------------------
    // CASE 1: Admin fetches student list -> All authorized students are returned
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", adminUser);
      const res = await getStudents(req);
      const data = await res.json();
      assert(res.status === 200, "Case 1: Admin fetches student list returns HTTP 200");
      assert(
        Array.isArray(data.students) && data.students.length >= 7,
        "Case 1: Admin receives full student list across all teachers and classes",
        `Returned count: ${data.students?.length}`
      );
    }

    // ------------------------------------------------------------------------
    // CASE 2: Teacher A fetches student list -> Only students assigned to Teacher A
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", teacherA);
      const res = await getStudents(req);
      const data = await res.json();
      assert(res.status === 200, "Case 2: Teacher A fetches student list returns HTTP 200");
      const returnedIds: string[] = (data.students || []).map((s: any) => s.id);

      assert(
        returnedIds.includes(student1!.id),
        "Case 2: Teacher A sees Student 1 (assigned to Teacher A)"
      );
      assert(
        returnedIds.includes(student3!.id),
        "Case 2: Teacher A sees Student 3 (assigned to both teachers)"
      );
      assert(
        !returnedIds.includes(student2!.id),
        "Case 2: Teacher A CANNOT see Student 2 (assigned only to Teacher B)"
      );
      assert(
        !returnedIds.includes(student4!.id),
        "Case 2: Teacher A CANNOT see Student 4 (unassigned student)"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 3: Teacher B fetches student list -> Only students assigned to Teacher B
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", teacherB);
      const res = await getStudents(req);
      const data = await res.json();
      assert(res.status === 200, "Case 3: Teacher B fetches student list returns HTTP 200");
      const returnedIds: string[] = (data.students || []).map((s: any) => s.id);

      assert(
        returnedIds.includes(student2!.id),
        "Case 3: Teacher B sees Student 2 (assigned to Teacher B)"
      );
      assert(
        returnedIds.includes(student3!.id),
        "Case 3: Teacher B sees Student 3 (assigned to both teachers)"
      );
      assert(
        !returnedIds.includes(student1!.id),
        "Case 3: Teacher B CANNOT see Student 1 (assigned only to Teacher A)"
      );
      assert(
        !returnedIds.includes(student4!.id),
        "Case 3: Teacher B CANNOT see Student 4 (unassigned student)"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 4: Teacher B requests Student 1 directly -> Access denied (403)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest(
        `http://localhost:3000/api/students/${student1!.id}`,
        teacherB
      );
      const res = await getStudentById(req, { params: Promise.resolve({ id: student1!.id }) });
      assert(
        res.status === 403,
        "Case 4: Teacher B requesting Student 1 directly is denied with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 5: Teacher A requests Student 2 directly -> Access denied (403)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest(
        `http://localhost:3000/api/students/${student2!.id}`,
        teacherA
      );
      const res = await getStudentById(req, { params: Promise.resolve({ id: student2!.id }) });
      assert(
        res.status === 403,
        "Case 5: Teacher A requesting Student 2 directly is denied with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 6: Either teacher requests Student 3 -> Allowed (HTTP 200)
    // ------------------------------------------------------------------------
    {
      const reqA = createAuthRequest(
        `http://localhost:3000/api/students/${student3!.id}`,
        teacherA
      );
      const resA = await getStudentById(reqA, { params: Promise.resolve({ id: student3!.id }) });
      assert(
        resA.status === 200,
        "Case 6: Teacher A requesting Student 3 (shared student) is allowed with HTTP 200"
      );

      const reqB = createAuthRequest(
        `http://localhost:3000/api/students/${student3!.id}`,
        teacherB
      );
      const resB = await getStudentById(reqB, { params: Promise.resolve({ id: student3!.id }) });
      assert(
        resB.status === 200,
        "Case 6: Teacher B requesting Student 3 (shared student) is allowed with HTTP 200"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 7: Teacher requests an unassigned student -> Access denied (403)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest(
        `http://localhost:3000/api/students/${student4!.id}`,
        teacherB
      );
      const res = await getStudentById(req, { params: Promise.resolve({ id: student4!.id }) });
      assert(
        res.status === 403,
        "Case 7: Teacher requesting unassigned Student 4 directly is denied with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 8: Teacher has zero assignments -> Empty list, not the global student list
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", teacherZero);
      const res = await getStudents(req);
      const data = await res.json();
      assert(res.status === 200, "Case 8: Teacher with 0 assignments receives HTTP 200");
      assert(
        Array.isArray(data.students) && data.students.length === 0,
        "Case 8: Teacher with 0 assignments receives empty array [], NEVER global student list",
        `Returned count: ${data.students?.length}`
      );
    }

    // ------------------------------------------------------------------------
    // CASE 9: Unauthenticated request -> Rejected (401)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", null);
      const res = await getStudents(req);
      assert(
        res.status === 401,
        "Case 9: Unauthenticated request to /api/students is rejected with HTTP 401"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 10: Student or unauthorized role requests teacher data -> Rejected (403)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest(
        "http://localhost:3000/api/teacher/chapter-progress",
        student1
      );
      const res = await getChapterProgress(req);
      assert(
        res.status === 403,
        "Case 10: Student requesting /api/teacher/chapter-progress is rejected with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 11: Teacher changes teacherId in request -> Authorization enforced (403)
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest(
        `http://localhost:3000/api/students?teacherId=${teacherA.id}`,
        teacherB // Teacher B attempts to query Teacher A's students
      );
      const res = await getStudents(req);
      assert(
        res.status === 403,
        "Case 11: Teacher B attempting to pass Teacher A's ID is rejected with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 12: Teacher requests another student's homework or progress -> Access denied
    // ------------------------------------------------------------------------
    {
      // Teacher B attempts to query Student 1's homework
      const req = createAuthRequest(
        `http://localhost:3000/api/homework?studentId=${student1!.id}`,
        teacherB
      );
      const res = await getHomework(req);
      assert(
        res.status === 403,
        "Case 12: Teacher B querying homework for Student 1 is denied with HTTP 403"
      );

      // Teacher B attempts to query Student 1's assigned books
      const reqBooks = createAuthRequest(
        `http://localhost:3000/api/student-books?studentId=${student1!.id}`,
        teacherB
      );
      const resBooks = await getStudentBooks(reqBooks);
      assert(
        resBooks.status === 403,
        "Case 12: Teacher B querying student books for Student 1 is denied with HTTP 403"
      );

      // Teacher B attempts to assign a book to Student 1
      const reqAssignBook = createAuthRequest(
        "http://localhost:3000/api/student-books",
        teacherB,
        "POST",
        {
          studentIds: [student1!.id],
          bookId: "any_book_id",
        }
      );
      const resAssignBook = await postStudentBooks(reqAssignBook);
      assert(
        resAssignBook.status === 403,
        "Case 12: Teacher B attempting to assign book to unauthorized Student 1 is denied with HTTP 403"
      );
    }

    // ------------------------------------------------------------------------
    // CASE 13: Teacher dashboard statistics include only authorized students
    // ------------------------------------------------------------------------
    {
      const req = createAuthRequest("http://localhost:3000/api/students", teacherB);
      const res = await getStudents(req);
      const data = await res.json();
      assert(
        res.status === 200,
        "Case 13: Teacher B receives HTTP 200 for student statistics calculation"
      );
      const count = data.students?.length || 0;
      assert(
        count === 2, // Subhashree + Test Student 2
        `Case 13: Teacher B dashboard statistics reflect exactly authorized students (${count} students, no unauthorized leaks)`
      );
    }

    // ------------------------------------------------------------------------
    // CASE 14: Tampered or invalid session token fails closed
    // ------------------------------------------------------------------------
    {
      const forgedToken = "eyJhbGciOiJIUzI1NiJ9.forged_tampered_signature";
      const headers = new Headers();
      headers.set("cookie", `cb_session=${forgedToken}`);
      headers.set("x-session-token", forgedToken);
      const req = new NextRequest("http://localhost:3000/api/students", { headers });
      const res = await getStudents(req);
      assert(
        res.status === 401,
        "Case 14: Tampered session token fails closed with HTTP 401 Unauthorized"
      );
    }

    console.log("\n============================================================");
    console.log(`🎉 ALL ${passedCount}/${totalCount} TEST CASES PASSED SUCCESSFULLY!`);
    console.log("============================================================\n");
  } finally {
    // Teardown temporary test fixtures
    await prisma.teacherStudentAssignment.deleteMany({
      where: {
        OR: [{ teacherId: tempTeacherZeroId }, { studentId: tempStudent2Id }],
      },
    });
    await prisma.studentProfile.deleteMany({ where: { userId: tempStudent2Id } });
    await prisma.teacherProfile.deleteMany({ where: { userId: tempTeacherZeroId } });
    await prisma.user.deleteMany({
      where: { id: { in: [tempStudent2Id, tempTeacherZeroId] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  });
