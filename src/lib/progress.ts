/**
 * Authoritative Exercise & Homework Progress Calculation Engine
 */

export interface ProgressCalculationInput {
  totalQuestions: number;
  questionsCompleted: number;
  requireTeacherVerification?: boolean;
}

export interface ProgressCalculationResult {
  totalQuestions: number;
  questionsCompleted: number;
  questionsRemaining: number;
  progressPercentage: number;
  exerciseStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  homeworkStatus: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "AWAITING_REVIEW";
}

export function validateQuestionCount(questionsCompleted: unknown, totalQuestions: number): { valid: boolean; error?: string; count?: number } {
  if (questionsCompleted === null || questionsCompleted === undefined || questionsCompleted === "") {
    return { valid: false, error: "Questions completed value is required." };
  }

  const num = Number(questionsCompleted);

  if (isNaN(num)) {
    return { valid: false, error: "Questions completed must be a valid number." };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: "Questions completed must be an integer (no decimals)." };
  }

  if (num < 0) {
    return { valid: false, error: "Questions completed cannot be negative." };
  }

  if (num > totalQuestions) {
    return {
      valid: false,
      error: `Questions completed (${num}) cannot exceed the total number of questions (${totalQuestions}).`,
    };
  }

  return { valid: true, count: num };
}

export function calculateProgress({
  totalQuestions,
  questionsCompleted,
  requireTeacherVerification = false,
}: ProgressCalculationInput): ProgressCalculationResult {
  const safeTotal = Math.max(1, totalQuestions);
  const safeCompleted = Math.max(0, Math.min(questionsCompleted, safeTotal));
  const questionsRemaining = Math.max(0, safeTotal - safeCompleted);
  const rawPercentage = (safeCompleted / safeTotal) * 100;
  const progressPercentage = Math.round(rawPercentage * 10) / 10;

  let exerciseStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED";
  let homeworkStatus: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "AWAITING_REVIEW" = "ASSIGNED";

  if (safeCompleted === 0) {
    exerciseStatus = "NOT_STARTED";
    homeworkStatus = "ASSIGNED";
  } else if (safeCompleted < safeTotal) {
    exerciseStatus = "IN_PROGRESS";
    homeworkStatus = "IN_PROGRESS";
  } else {
    // safeCompleted === safeTotal
    exerciseStatus = "COMPLETED";
    homeworkStatus = requireTeacherVerification ? "AWAITING_REVIEW" : "COMPLETED";
  }

  return {
    totalQuestions: safeTotal,
    questionsCompleted: safeCompleted,
    questionsRemaining,
    progressPercentage,
    exerciseStatus,
    homeworkStatus,
  };
}
