"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Upload,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Filter,
  Sparkles,
  Layers,
  Award,
  BarChart3,
  Search,
  GraduationCap,
  UserCheck,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  School,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Minus,
  Plus,
  Loader2,
  Info,
} from "lucide-react";
import { QuickProgressModal } from "./QuickProgressModal";
import { ProofUploadModal } from "./ProofUploadModal";
import { StudentBookProgressModal } from "./StudentBookProgressModal";

interface StudentDashboardProps {
  currentUser: any;
}

export function StudentDashboard({ currentUser }: StudentDashboardProps) {
  // Requirement: "My Books is the first tab and the default selected tab."
  const [activeTab, setActiveTab] = useState<"books" | "homework" | "calendar">("books");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [studentBooks, setStudentBooks] = useState<any[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Requirement: Everything remains compressed / collapsed by default!
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [showFacultySection, setShowFacultySection] = useState<boolean>(false);

  // Trusted Student Question Count Editing State
  const [editingExerciseCount, setEditingExerciseCount] = useState<Record<string, number>>({});
  const [isSavingQuestionCount, setIsSavingQuestionCount] = useState<Record<string, boolean>>({});
  const [countFeedback, setCountFeedback] = useState<{
    exerciseId: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [bookProgressModalState, setBookProgressModalState] = useState<{
    isOpen: boolean;
    book: any | null;
    chapter: any | null;
    exercise: any | null;
    currentHw: any | null;
  }>({
    isOpen: false,
    book: null,
    chapter: null,
    exercise: null,
    currentHw: null,
  });

  // Fetch homework, books and assigned faculty
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [hwRes, booksRes, assignRes] = await Promise.all([
        fetch(`/api/homework?studentId=${currentUser.id}`),
        fetch(`/api/student-books?studentId=${currentUser.id}`),
        fetch(`/api/admin/teacher-student-assignments?studentId=${currentUser.id}`),
      ]);

      if (hwRes.ok) {
        const hwData = await hwRes.json();
        setHomeworkList(hwData.assignments || []);
      }
      if (booksRes.ok) {
        const bData = await booksRes.json();
        setStudentBooks(bData.studentBooks || []);
      }
      if (assignRes.ok) {
        const aData = await assignRes.json();
        setFacultyAssignments(aData.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  // Derived metrics
  const totalHomework = homeworkList.length;
  const completedCount = homeworkList.filter((h) => h.exerciseStatus === "COMPLETED").length;
  const inProgressCount = homeworkList.filter((h) => h.exerciseStatus === "IN_PROGRESS").length;
  const notStartedCount = homeworkList.filter((h) => h.exerciseStatus === "NOT_STARTED").length;

  const now = new Date();
  const overdueHomework = homeworkList.filter(
    (h) => h.exerciseStatus !== "COMPLETED" && new Date(h.dueDate) < now
  );

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todayHomework = homeworkList.filter((h) => {
    const d = new Date(h.dueDate);
    return d >= startOfToday && d <= endOfToday && h.exerciseStatus !== "COMPLETED";
  });

  const overallProgressPercentage =
    totalHomework > 0 ? Math.round((completedCount / totalHomework) * 100) : 0;

  // Filtered homework list
  const filteredHomework = homeworkList.filter((hw) => {
    if (statusFilter === "IN_PROGRESS" && hw.exerciseStatus !== "IN_PROGRESS") return false;
    if (statusFilter === "COMPLETED" && hw.exerciseStatus !== "COMPLETED") return false;
    if (statusFilter === "NOT_STARTED" && hw.exerciseStatus !== "NOT_STARTED") return false;
    if (statusFilter === "OVERDUE") {
      const isPast = new Date(hw.dueDate) < now;
      if (!isPast || hw.exerciseStatus === "COMPLETED") return false;
    }
    if (subjectFilter !== "ALL" && hw.subjectId !== subjectFilter) return false;
    return true;
  });

  // Book & Chapter Expansion Helpers
  const toggleBookExpansion = (bookId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const expandAllBooks = () => {
    const next: Record<string, boolean> = {};
    studentBooks.forEach((sb) => {
      next[sb.id] = true;
    });
    setExpandedBooks(next);
  };

  const compressAllBooks = () => {
    setExpandedBooks({});
    setExpandedChapters({});
  };

  const toggleChapterExpansion = (chId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  // Modals handlers
  const handleOpenProgress = (hw: any) => {
    setSelectedAssignment(hw);
    setIsProgressModalOpen(true);
  };

  const handleOpenProof = (hw: any) => {
    setSelectedAssignment(hw);
    setIsProofModalOpen(true);
  };

  const handleProgressSaved = (updatedAssignment: any) => {
    setHomeworkList((prev) =>
      prev.map((item) => (item.id === updatedAssignment.id ? { ...item, ...updatedAssignment } : item))
    );
  };

  const handleOpenBookExerciseProgress = (book: any, chapter: any, exercise: any | null) => {
    const hw = exercise ? homeworkList.find((h) => h.exerciseId === exercise.id) : null;
    setBookProgressModalState({
      isOpen: true,
      book,
      chapter,
      exercise,
      currentHw: hw || null,
    });
  };

  const handleBookProgressSaved = (data: any) => {
    if (data.updatedAssignments && Array.isArray(data.updatedAssignments)) {
      setHomeworkList((prev) => {
        const updatedMap = new Map(data.updatedAssignments.map((a: any) => [a.exerciseId, a]));
        const filtered = prev.filter((p) => !updatedMap.has(p.exerciseId));
        return [...filtered, ...data.updatedAssignments];
      });
    } else if (data.assignment) {
      setHomeworkList((prev) => {
        const exists = prev.some((p) => p.id === data.assignment.id || p.exerciseId === data.assignment.exerciseId);
        if (exists) {
          return prev.map((p) =>
            p.id === data.assignment.id || p.exerciseId === data.assignment.exerciseId
              ? { ...p, ...data.assignment }
              : p
          );
        }
        return [...prev, data.assignment];
      });
    }
  };

  const handleQuickToggleExercise = async (e: React.MouseEvent, book: any, chapter: any, exercise: any) => {
    e.stopPropagation();
    const hw = homeworkList.find((h) => h.exerciseId === exercise.id);
    const isDone = hw?.exerciseStatus === "COMPLETED";
    const newStatus = isDone ? "NOT_STARTED" : "COMPLETED";
    const newQuestions = isDone ? 0 : exercise.totalQuestions || 10;

    try {
      const res = await fetch("/api/student/exercise-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          studentId: currentUser.id,
          questionsCompleted: newQuestions,
          exerciseStatus: newStatus,
          markCompleted: !isDone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        handleBookProgressSaved(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trusted Student Question Count Handlers
  const handleStartEditCount = (exercise: any) => {
    setEditingExerciseCount((prev) => ({
      ...prev,
      [exercise.id]: exercise.totalQuestions || 10,
    }));
  };

  const handleCancelEditCount = (exerciseId: string) => {
    setEditingExerciseCount((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setCountFeedback((prev) => (prev?.exerciseId === exerciseId ? null : prev));
  };

  const handleChangeCountValue = (exerciseId: string, val: number, min = 1, max = 500) => {
    const clamped = Math.max(min, Math.min(max, val));
    setEditingExerciseCount((prev) => ({
      ...prev,
      [exerciseId]: clamped,
    }));
  };

  const handleSaveExerciseQuestionCount = async (
    exercise: any,
    book: any,
    min = 1,
    max = 500
  ) => {
    const newCount = editingExerciseCount[exercise.id];
    if (newCount === undefined || newCount < min || newCount > max) {
      setCountFeedback({
        exerciseId: exercise.id,
        type: "error",
        text: `Count must be between ${min} and ${max}`,
      });
      return;
    }

    const hw = homeworkList.find((h) => h.exerciseId === exercise.id);
    const completedNow = hw?.questionsCompleted || 0;
    if (newCount < completedNow) {
      const confirmReduce = confirm(
        `Warning: You have completed ${completedNow} questions in this exercise. Reducing the question count to ${newCount} will update the exercise configuration for ALL students assigned to "${book.name}". Do you want to proceed?`
      );
      if (!confirmReduce) return;
    }

    setIsSavingQuestionCount((prev) => ({ ...prev, [exercise.id]: true }));
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/question-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCount, bookId: book.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCountFeedback({
          exerciseId: exercise.id,
          type: "error",
          text: data.error || "Failed to update question count",
        });
      } else {
        setCountFeedback({
          exerciseId: exercise.id,
          type: "success",
          text: `Updated to ${newCount} questions for all students!`,
        });

        // Update local studentBooks state with canonical question count
        setStudentBooks((prev) =>
          prev.map((sb) => {
            if (sb.book.id !== book.id) return sb;
            return {
              ...sb,
              book: {
                ...sb.book,
                chapters: sb.book.chapters?.map((ch: any) => ({
                  ...ch,
                  exercises: ch.exercises?.map((ex: any) =>
                    ex.id === exercise.id ? { ...ex, totalQuestions: newCount } : ex
                  ),
                })),
              },
            };
          })
        );

        // Update local homeworkList state
        setHomeworkList((prev) =>
          prev.map((h) => {
            if (h.exerciseId !== exercise.id) return h;
            const qDone = h.questionsCompleted;
            const isCompleted = qDone >= newCount;
            const newPct = newCount > 0 ? Math.min(100, Math.round((qDone / newCount) * 100)) : 0;
            return {
              ...h,
              totalQuestions: newCount,
              progressPercentage: newPct,
              exerciseStatus: isCompleted ? "COMPLETED" : qDone > 0 ? "IN_PROGRESS" : "NOT_STARTED",
            };
          })
        );

        // Close editor after short delay
        setTimeout(() => {
          handleCancelEditCount(exercise.id);
        }, 1500);

        setTimeout(() => {
          setCountFeedback((current) => (current?.exerciseId === exercise.id ? null : current));
        }, 4000);
      }
    } catch (err: any) {
      console.error("Error saving exercise question count:", err);
      setCountFeedback({
        exerciseId: exercise.id,
        type: "error",
        text: "Network error saving question count",
      });
    } finally {
      setIsSavingQuestionCount((prev) => ({ ...prev, [exercise.id]: false }));
    }
  };

  // Distinct subjects from assigned books
  const subjects = Array.from(
    new Set(studentBooks.map((sb) => JSON.stringify(sb.book.subject)))
  ).map((s) => JSON.parse(s));

  // Student academic placement details
  const studentGrade = currentUser?.studentProfile?.classGrade || "NEET Dropper";
  const studentSection = currentUser?.studentProfile?.section || "A";
  const studentRoll = currentUser?.studentProfile?.rollNo || "--";

  const isNEETTrack =
    studentGrade.toLowerCase().includes("neet") ||
    (!studentGrade.toLowerCase().includes("jee") &&
      !studentGrade.includes("Class 4") &&
      !studentGrade.includes("Class 5") &&
      !studentGrade.includes("Class 6") &&
      !studentGrade.includes("Class 7") &&
      !studentGrade.includes("Class 8") &&
      !studentGrade.includes("Class 9") &&
      !studentGrade.includes("Class 10"));
  const isJEETrack = studentGrade.toLowerCase().includes("jee");

  const streamSubjects: Array<{ name: string; classGrade: string; color: string; icon: string; badge: string }> = [
    { name: "Physics", classGrade: studentGrade, color: "#2563EB", icon: "atom", badge: "Core Science" },
    { name: "Chemistry", classGrade: studentGrade, color: "#D97706", icon: "flask-conical", badge: "Core Science" },
  ];

  if (
    isNEETTrack ||
    (!isJEETrack &&
      (studentGrade.includes("11") || studentGrade.includes("12") || studentGrade.toLowerCase().includes("dropper")))
  ) {
    streamSubjects.push({ name: "Biology", classGrade: studentGrade, color: "#059669", icon: "dna", badge: "Medical Track" });
  }
  if (isJEETrack || (!isNEETTrack && (studentGrade.includes("11") || studentGrade.includes("12")))) {
    streamSubjects.push({ name: "Mathematics", classGrade: studentGrade, color: "#4F46E5", icon: "calculator", badge: "Engineering Track" });
  }

  return (
    <div className="space-y-4">
      {/* COMPACT & STREAMLINED TOP HEADER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || "ST"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Good day, {currentUser?.name?.split(" ")[0] || "Student"}! 👋
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {studentGrade}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Sec {studentSection} • #{studentRoll}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {currentUser?.studentProfile?.schoolName || "LV INSTITUTE"} • Track your exercises & stay on schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            {/* Quick Overall Metric Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-black text-indigo-600 text-sm">{overallProgressPercentage}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Done</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-bold">{completedCount}/{totalHomework} HW</span>
            </div>

            {/* Toggle Class & Faculty Drawer Button */}
            <button
              onClick={() => setShowFacultySection((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-200/80 cursor-pointer"
              title="View enrolled class and assigned faculty"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty & Roster</span>
              {showFacultySection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Faculty & Class Info */}
        {showFacultySection && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in-50 duration-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Academic Curriculum & Assigned Faculty for {studentGrade}</span>
              <span className="text-indigo-600 font-bold">{streamSubjects.length} Core Subjects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {streamSubjects.map((sub) => {
                const assignment = facultyAssignments.find(
                  (a) => a.subject?.name?.toLowerCase() === sub.name.toLowerCase()
                );
                return (
                  <div
                    key={sub.name}
                    className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.name === "Physics" ? (
                          <Atom className="w-3.5 h-3.5" />
                        ) : sub.name === "Chemistry" ? (
                          <FlaskConical className="w-3.5 h-3.5" />
                        ) : sub.name === "Biology" ? (
                          <Dna className="w-3.5 h-3.5" />
                        ) : (
                          <Calculator className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{sub.name}</div>
                        <div className="text-[10px] text-slate-400">{sub.badge}</div>
                      </div>
                    </div>
                    <div>
                      {assignment ? (
                        <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{assignment.teacher?.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          In Assignment
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* OVERDUE HOMEWORK WARNING (if any) */}
      {overdueHomework.length > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-rose-900 truncate">
                {overdueHomework.length} Overdue Assignment{overdueHomework.length > 1 ? "s" : ""}
              </h4>
              <p className="text-[11px] text-rose-700 truncate">
                {overdueHomework[0].exercise.name} ({overdueHomework[0].book.name}) was due on{" "}
                {new Date(overdueHomework[0].dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenProgress(overdueHomework[0])}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 transition-colors cursor-pointer text-xs"
          >
            Update
          </button>
        </div>
      )}

      {/* TOP NAVIGATION: MY BOOKS FIRST */}
      {/* Order: 1. My Books, 2. Homework, 3. Calendar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* TAB 1: MY BOOKS (First & Default) */}
          <button
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "books"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Books ({studentBooks.length})</span>
          </button>

          {/* TAB 2: HOMEWORK */}
          <button
            onClick={() => setActiveTab("homework")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "homework"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Homework ({homeworkList.length})</span>
          </button>

          {/* TAB 3: CALENDAR */}
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendar</span>
          </button>
        </div>

        {activeTab === "books" && studentBooks.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={expandAllBooks}
              className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Expand all books"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={compressAllBooks}
              className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Compress all books"
            >
              Compress All
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MY BOOKS & PROGRESSIVE EXPANDABLE HIERARCHY */}
      {/* ============================================================== */}
      {activeTab === "books" && (
        <div className="space-y-3.5">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p>Loading assigned books...</p>
            </div>
          ) : studentBooks.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Books Assigned</h3>
              <p className="text-xs text-slate-500">
                You haven't been assigned any books yet. Your faculty will assign curriculum modules soon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentBooks.map((sb) => {
                const b = sb.book;
                // Requirement: All books collapsed by default!
                const isBookExpanded = Boolean(expandedBooks[sb.id]);
                const isTrustedForBook = Boolean(sb.isTrustedForConfig || currentUser?.role === "ADMIN");

                const totalExercises =
                  b.chapters?.reduce(
                    (sum: number, ch: any) => sum + (ch.exercises?.length || 0),
                    0
                  ) || 0;

                let completedExercisesInBook = 0;
                b.chapters?.forEach((ch: any) => {
                  ch.exercises?.forEach((ex: any) => {
                    const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                    if (hw?.exerciseStatus === "COMPLETED") completedExercisesInBook++;
                  });
                });

                const bookCompletionRate =
                  totalExercises > 0
                    ? Math.round((completedExercisesInBook / totalExercises) * 100)
                    : 0;

                return (
                  <div
                    key={sb.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* COLLAPSED BOOK HEADER ROW (Click to toggle expansion) */}
                    <div
                      onClick={() => toggleBookExpansion(sb.id)}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer transition-colors ${
                        isBookExpanded ? "bg-slate-50/70 border-b border-slate-200/80" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Subject Badge Icon */}
                        <div
                          className="w-11 h-12 rounded-2xl text-white font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: b.subject?.color || "#4F46E5" }}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                              style={{ backgroundColor: b.subject?.color || "#4F46E5" }}
                            >
                              {b.subject?.name || "Subject"} {b.classGrade ? `• ${b.classGrade}` : ""}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {b.curriculumType || b.exam || "Curriculum"}
                            </span>
                            {isTrustedForBook && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Trusted Config</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
                            {b.name}
                          </h3>

                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {b.publisher || b.author || "Publisher Module"} • {b.chapters?.length || 0} Chapters • {totalExercises} Exercises
                          </p>
                        </div>
                      </div>

                      {/* Right Status & Expand Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex flex-col items-start sm:items-end">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <span>{completedExercisesInBook}/{totalExercises} Done</span>
                            <span className="text-indigo-600">({bookCompletionRate}%)</span>
                          </div>
                          <div className="w-24 bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                bookCompletionRate === 100 ? "bg-emerald-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${bookCompletionRate}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                            isBookExpanded
                              ? "bg-slate-200/70 border-slate-300 text-slate-800"
                              : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          {isBookExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span className="text-[11px] hidden sm:inline">Collapse</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span className="text-[11px] hidden sm:inline">Chapters</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED CHAPTERS LIST */}
                    {isBookExpanded && (
                      <div className="p-4 sm:p-5 space-y-3 bg-white animate-in fade-in-50 duration-200">
                        <div className="flex items-center justify-between text-xs pb-1">
                          <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                            Chapters ({b.chapters?.length || 0})
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Tap chapter to view & update exercises
                          </span>
                        </div>

                        {b.chapters && b.chapters.length > 0 ? (
                          <div className="space-y-2.5">
                            {b.chapters.map((ch: any) => {
                              // Requirement: All chapters collapsed by default inside book!
                              const isChapterExpanded = Boolean(expandedChapters[ch.id]);
                              const exercises = ch.exercises || [];
                              const totalExCount = exercises.length;

                              const completedExCount = exercises.filter((ex: any) => {
                                const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                                return hw?.exerciseStatus === "COMPLETED";
                              }).length;

                              const inProgressExCount = exercises.filter((ex: any) => {
                                const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                                return hw?.exerciseStatus === "IN_PROGRESS";
                              }).length;

                              const isChapterCompleted = totalExCount > 0 && completedExCount === totalExCount;
                              const isChapterPartial = (completedExCount > 0 && completedExCount < totalExCount) || inProgressExCount > 0;

                              return (
                                <div
                                  key={ch.id}
                                  className={`rounded-2xl border transition-all ${
                                    isChapterExpanded
                                      ? "border-slate-300 bg-slate-50/50 shadow-2xs"
                                      : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80"
                                  }`}
                                >
                                  {/* CHAPTER HEADER (Click to toggle exercises) */}
                                  <div
                                    onClick={() => toggleChapterExpansion(ch.id)}
                                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-extrabold text-[11px] text-slate-700 shrink-0">
                                        {ch.chapterNumber}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-slate-900 truncate">
                                          {ch.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                          {totalExCount} Exercises • {completedExCount} Completed
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Chapter Status Badge */}
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                          isChapterCompleted
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : isChapterPartial
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}
                                      >
                                        {isChapterCompleted
                                          ? "Completed"
                                          : isChapterPartial
                                          ? `${completedExCount}/${totalExCount} Done`
                                          : "Not Started"}
                                      </span>

                                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                                        {isChapterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </div>
                                    </div>
                                  </div>

                                  {/* EXPANDED EXERCISES LIST */}
                                  {isChapterExpanded && (
                                    <div className="p-3.5 pt-0 border-t border-slate-200/60 mt-1 space-y-2 animate-in fade-in-50 duration-150">
                                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-2">
                                        <span>Available Exercises ({exercises.length})</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenBookExerciseProgress(b, ch, null);
                                          }}
                                          className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Batch Chapter Progress</span>
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {exercises.map((ex: any) => {
                                          const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                                          const isDone = hw?.exerciseStatus === "COMPLETED";
                                          const isInProgress = hw?.exerciseStatus === "IN_PROGRESS";
                                          const totalQ = ex.totalQuestions || hw?.totalQuestions || 10;
                                          const doneQ = hw?.questionsCompleted || 0;
                                          const remainingQ = Math.max(0, totalQ - doneQ);

                                          const isEditingThisCount = editingExerciseCount[ex.id] !== undefined;
                                          const isSavingThisCount = Boolean(isSavingQuestionCount[ex.id]);
                                          const currentEditVal = editingExerciseCount[ex.id] ?? totalQ;
                                          const feedback = countFeedback?.exerciseId === ex.id ? countFeedback : null;

                                          return (
                                            <div
                                              key={ex.id}
                                              className={`p-3 rounded-2xl border transition-all ${
                                                isDone
                                                  ? "bg-emerald-50/40 border-emerald-200/90"
                                                  : isInProgress
                                                  ? "bg-amber-50/40 border-amber-200/90"
                                                  : "bg-white border-slate-200 hover:border-slate-300"
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                  {/* Quick Toggle Done */}
                                                  <button
                                                    type="button"
                                                    title={isDone ? "Click to reset" : "Click to mark completed"}
                                                    onClick={(e) => handleQuickToggleExercise(e, b, ch, ex)}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors mt-0.5 border cursor-pointer ${
                                                      isDone
                                                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                                        : isInProgress
                                                        ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                                        : "bg-slate-50 border-slate-300 text-transparent hover:text-slate-400"
                                                    }`}
                                                  >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                  </button>

                                                  <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                      <h5 className="text-xs font-bold text-slate-900 truncate">
                                                        {ex.exerciseNumber ? `${ex.exerciseNumber} — ` : ""}{ex.name}
                                                      </h5>
                                                      <span
                                                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                                          isDone
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : isInProgress
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                      >
                                                        {isDone ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                                                      </span>
                                                    </div>

                                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                                                      <span className="font-bold text-slate-700">{totalQ} Questions</span>
                                                      <span>•</span>
                                                      <span className="text-emerald-700 font-semibold">{doneQ} Completed</span>
                                                      <span>•</span>
                                                      <span className="text-slate-500 font-semibold">{remainingQ} Remaining</span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                  {/* Trusted Student Edit Question Count Button */}
                                                  {isTrustedForBook && !isEditingThisCount && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleStartEditCount(ex)}
                                                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                                                      title="Edit Question Count (Trusted Student / Admin)"
                                                    >
                                                      <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}

                                                  {/* Update Progress Button */}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenBookExerciseProgress(b, ch, ex)}
                                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                                                  >
                                                    Update
                                                  </button>
                                                </div>
                                              </div>

                                              {/* TRUSTED STUDENT INLINE EDIT QUESTION COUNT CONTROL */}
                                              {isEditingThisCount && (
                                                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 animate-in fade-in-50 duration-150">
                                                  <div className="flex items-center justify-between text-[11px]">
                                                    <span className="font-extrabold text-indigo-950 flex items-center gap-1">
                                                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                                      Configure Total Questions:
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                      Applies to all students
                                                    </span>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      disabled={isSavingThisCount || currentEditVal <= (sb.minQuestions || 1)}
                                                      onClick={() =>
                                                        handleChangeCountValue(
                                                          ex.id,
                                                          currentEditVal - 1,
                                                          sb.minQuestions || 1,
                                                          sb.maxQuestions || 500
                                                        )
                                                      }
                                                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                                    >
                                                      <Minus className="w-3 h-3" />
                                                    </button>

                                                    <input
                                                      type="number"
                                                      min={sb.minQuestions || 1}
                                                      max={sb.maxQuestions || 500}
                                                      value={currentEditVal}
                                                      disabled={isSavingThisCount}
                                                      onChange={(e) =>
                                                        handleChangeCountValue(
                                                          ex.id,
                                                          parseInt(e.target.value, 10) || (sb.minQuestions || 1),
                                                          sb.minQuestions || 1,
                                                          sb.maxQuestions || 500
                                                        )
                                                      }
                                                      className="w-16 text-center text-xs font-black bg-white border border-slate-300 rounded-lg py-1 text-slate-900 focus:outline-hidden focus:border-indigo-600"
                                                    />

                                                    <button
                                                      type="button"
                                                      disabled={isSavingThisCount || currentEditVal >= (sb.maxQuestions || 500)}
                                                      onClick={() =>
                                                        handleChangeCountValue(
                                                          ex.id,
                                                          currentEditVal + 1,
                                                          sb.minQuestions || 1,
                                                          sb.maxQuestions || 500
                                                        )
                                                      }
                                                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                                    >
                                                      <Plus className="w-3 h-3" />
                                                    </button>

                                                    <button
                                                      type="button"
                                                      disabled={isSavingThisCount}
                                                      onClick={() =>
                                                        handleSaveExerciseQuestionCount(
                                                          ex,
                                                          b,
                                                          sb.minQuestions || 1,
                                                          sb.maxQuestions || 500
                                                        )
                                                      }
                                                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                                                    >
                                                      {isSavingThisCount ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                      ) : (
                                                        <Save className="w-3 h-3" />
                                                      )}
                                                      <span>Save</span>
                                                    </button>

                                                    <button
                                                      type="button"
                                                      disabled={isSavingThisCount}
                                                      onClick={() => handleCancelEditCount(ex.id)}
                                                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>

                                                  {feedback && (
                                                    <div
                                                      className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                        feedback.type === "success"
                                                          ? "bg-emerald-100 text-emerald-800"
                                                          : "bg-rose-100 text-rose-800"
                                                      }`}
                                                    >
                                                      {feedback.text}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No chapters registered for this book yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: HOMEWORK LIST */}
      {/* ============================================================== */}
      {activeTab === "homework" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All" },
                { id: "NOT_STARTED", label: "Not Started" },
                { id: "IN_PROGRESS", label: "In Progress" },
                { id: "COMPLETED", label: "Completed" },
                { id: "OVERDUE", label: "Overdue" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === s.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Subject:</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.classGrade ? `(${sub.classGrade})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Homework Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading homework...</div>
          ) : filteredHomework.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Homework in this view</h3>
              <p className="text-xs text-slate-500">
                You're all caught up or no homework matches the selected filter!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHomework.map((hw) => {
                const isOverdue =
                  hw.exerciseStatus !== "COMPLETED" && new Date(hw.dueDate) < now;
                const isCompleted = hw.exerciseStatus === "COMPLETED";

                return (
                  <div
                    key={hw.id}
                    className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: hw.subject?.color || "#4F46E5" }}
                        >
                          {hw.subject?.name} {hw.subject?.classGrade ? `• ${hw.subject.classGrade}` : ""}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : hw.exerciseStatus === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isCompleted
                            ? "✓ Completed"
                            : isOverdue
                            ? "Overdue"
                            : hw.exerciseStatus === "IN_PROGRESS"
                            ? "In Progress"
                            : "Not Started"}
                        </span>
                      </div>

                      {/* Content Titles */}
                      <h4 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1">
                        {hw.book?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ch {hw.chapter?.chapterNumber} — {hw.chapter?.name}
                      </p>
                      <p className="text-xs font-bold text-indigo-700 mt-1">
                        {hw.exercise?.name} ({hw.totalQuestions} Questions)
                      </p>

                      {/* Progress Bar & Details */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            {hw.questionsCompleted} / {hw.totalQuestions} Questions
                          </span>
                          <span className="font-bold text-indigo-600">
                            {hw.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted ? "bg-emerald-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${hw.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(hw.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                        {hw.attachments?.length > 0 && (
                          <span className="text-indigo-600 font-semibold">
                            {hw.attachments.length} attachment(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenProgress(hw)}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCompleted
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isCompleted ? "Review Progress" : "Update Progress"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenProof(hw)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="Upload Proof / Photos"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CALENDAR VIEW */}
      {/* ============================================================== */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Homework Calendar</h3>
              <p className="text-xs text-slate-500">
                Visual deadline tracking and completion status
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {homeworkList.map((hw) => {
              const d = new Date(hw.dueDate);
              const isOverdue = hw.exerciseStatus !== "COMPLETED" && d < now;
              const isDone = hw.exerciseStatus === "COMPLETED";

              return (
                <div
                  key={hw.id}
                  onClick={() => handleOpenProgress(hw)}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {d.toLocaleDateString([], { month: "short", day: "numeric", weekday: "short" })}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      {hw.subject?.name} — {hw.exercise?.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {hw.questionsCompleted} / {hw.totalQuestions} Questions Completed
                    </p>
                  </div>

                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isDone ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Progress Modal */}
      <QuickProgressModal
        assignment={selectedAssignment}
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        onProgressSaved={handleProgressSaved}
        onOpenProofUpload={handleOpenProof}
      />

      {/* Proof Upload Modal */}
      <ProofUploadModal
        assignment={selectedAssignment}
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onProofSubmitted={handleProgressSaved}
      />

      {/* Student Book Progress Modal (Chapter & Exercise Level) */}
      <StudentBookProgressModal
        isOpen={bookProgressModalState.isOpen}
        onClose={() => setBookProgressModalState((prev) => ({ ...prev, isOpen: false }))}
        book={bookProgressModalState.book}
        chapter={bookProgressModalState.chapter}
        exercise={bookProgressModalState.exercise}
        studentId={currentUser?.id}
        currentHw={bookProgressModalState.currentHw}
        onSaved={handleBookProgressSaved}
      />
    </div>
  );
}
