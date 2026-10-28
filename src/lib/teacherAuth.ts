import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export interface StudentAuthCheckResult {
  authorized: boolean;
  status?: number;
  error?: string;
  unauthorizedStudentIds?: string[];
}

/**
 * Retrieves list of student user IDs assigned to the given teacher.
 * Fails closed by returning [] if teacherUserId is missing or has no active assignments.
 */
export async function getAuthorizedStudentIdsForTeacher(
  teacherUserId: string,
  subjectId?: string | null
): Promise<string[]> {
  if (!teacherUserId) return [];

  const assignments = await prisma.teacherStudentAssignment.findMany({
    where: {
      teacherId: teacherUserId,
      status: "ACTIVE",
      ...(subjectId ? { subjectId } : {}),
    },
    select: {
      studentId: true,
    },
  });

  const ids = Array.from(new Set(assignments.map((a) => a.studentId)));
  return ids;
}

/**
 * Checks if a specific student is actively assigned to the given teacher.
 */
export async function isStudentAssignedToTeacher(
  teacherUserId: string,
  studentId: string,
  subjectId?: string | null
): Promise<boolean> {
  if (!teacherUserId || !studentId) return false;

  const assignment = await prisma.teacherStudentAssignment.findFirst({
    where: {
      teacherId: teacherUserId,
      studentId,
      status: "ACTIVE",
      ...(subjectId ? { subjectId } : {}),
    },
    select: { id: true },
  });

  return Boolean(assignment);
}

/**
 * Server-side authorization check for accessing student data.
 * - ADMIN: authorized for all students.
 * - TEACHER: authorized ONLY if student is explicitly assigned to this teacher.
 * - Any other role: denied.
 */
export async function authorizeTeacherForStudent(
  user: { id: string; role: string } | null,
  studentId: string,
  subjectId?: string | null
): Promise<StudentAuthCheckResult> {
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please log in.",
    };
  }

  if (user.role === "ADMIN") {
    return { authorized: true };
  }

  if (user.role === "TEACHER") {
    const isAssigned = await isStudentAssignedToTeacher(user.id, studentId, subjectId);
    if (!isAssigned) {
      return {
        authorized: false,
        status: 403,
        error: "Forbidden. You are not assigned to this student.",
      };
    }
    return { authorized: true };
  }

  return {
    authorized: false,
    status: 403,
    error: "Forbidden. Insufficient permissions.",
  };
}

/**
 * Server-side authorization check for accessing or mutating multiple students.
 * - ADMIN: authorized for all students.
 * - TEACHER: authorized only if ALL target students are assigned to this teacher.
 */
export async function authorizeTeacherForStudents(
  user: { id: string; role: string } | null,
  studentIds: string[],
  subjectId?: string | null
): Promise<StudentAuthCheckResult> {
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please log in.",
    };
  }

  if (user.role === "ADMIN") {
    return { authorized: true };
  }

  if (user.role === "TEACHER") {
    const authorizedIds = await getAuthorizedStudentIdsForTeacher(user.id, subjectId);
    const authorizedSet = new Set(authorizedIds);

    const unauthorized = studentIds.filter((id) => !authorizedSet.has(id));
    if (unauthorized.length > 0) {
      return {
        authorized: false,
        status: 403,
        error: "Forbidden. One or more selected students are not assigned to you.",
        unauthorizedStudentIds: unauthorized,
      };
    }
    return { authorized: true };
  }

  return {
    authorized: false,
    status: 403,
    error: "Forbidden. Insufficient permissions.",
  };
}

/**
 * Fetches the authorized student list for a teacher.
 * Fail closed: if user is not TEACHER or ADMIN, or context is invalid, returns [].
 */
export async function getAuthorizedStudentsForTeacher(
  teacherUserId: string,
  options?: {
    search?: string;
    subjectId?: string | null;
  }
) {
  if (!teacherUserId) return [];

  const whereClause: any = {
    role: "STUDENT",
    status: "ACTIVE",
    assignedTeachersAsStudent: {
      some: {
        teacherId: teacherUserId,
        status: "ACTIVE",
        ...(options?.subjectId ? { subjectId: options.subjectId } : {}),
      },
    },
  };

  if (options?.search) {
    const search = options.search.toLowerCase().trim();
    whereClause.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { studentProfile: { classGrade: { contains: search } } },
    ];
  }

  return prisma.user.findMany({
    where: whereClause,
    include: {
      studentProfile: true,
      assignedTeachersAsStudent: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          teacherId: true,
          subjectId: true,
          teacher: {
            select: { id: true, name: true, teacherProfile: { select: { phone: true } } },
          },
          subject: {
            select: { id: true, name: true, classGrade: true },
          },
        },
      },
      assignedBooksAsStudent: {
        include: {
          book: {
            include: {
              subject: true,
              chapters: {
                include: {
                  exercises: { select: { id: true } },
                },
                orderBy: { chapterNumber: "asc" },
              },
            },
          },
        },
      },
      _count: {
        select: {
          studentAssignments: true,
          assignedTeachersAsStudent: true,
          assignedBooksAsStudent: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
