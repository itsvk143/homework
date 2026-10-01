// mobile/src/types/index.ts

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export type ThemeMode = "DARK" | "LIGHT";

export type PerformanceMode = "HIGH" | "NORMAL" | "BATTERY_SAVER";

export interface StudentProgress {
  studentId: string;
  studentName: string;
  rollNo?: string;
  avatarUrl?: string;
  exerciseScores: {
    exerciseNumber: number;
    exerciseName: string;
    completed: number;
    total: number;
    status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  }[];
  overallPercentage: number;
}

export interface HomeworkItem {
  id: string;
  subject: string;
  bookName: string;
  chapterName: string;
  exerciseName: string;
  dueDate: string;
  totalQuestions: number;
  completedQuestions: number;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "HOMEWORK" | "REVIEW" | "SYSTEM";
  read: boolean;
}
