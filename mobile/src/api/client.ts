/**
 * Shared API Client for ClassBoard Mobile
 * Connects directly to Next.js Shared Backend API
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchStudentHomework(studentId: string) {
  const res = await fetch(`${API_BASE_URL}/homework?studentId=${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch homework");
  return res.json();
}

export async function updateHomeworkProgress({
  homeworkId,
  questionsCompleted,
  markCompleted,
  notes,
}: {
  homeworkId: string;
  questionsCompleted: number;
  markCompleted?: boolean;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/homework/${homeworkId}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionsCompleted, markCompleted, notes }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update progress");
  }
  return res.json();
}

export async function submitHomeworkProof({
  homeworkId,
  studentNotes,
  attachments,
}: {
  homeworkId: string;
  studentNotes?: string;
  attachments: any[];
}) {
  const res = await fetch(`${API_BASE_URL}/homework/${homeworkId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentNotes, attachments }),
  });
  if (!res.ok) throw new Error("Failed to submit proof");
  return res.json();
}
