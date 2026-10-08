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
} from "lucide-react";
import { QuickProgressModal } from "./QuickProgressModal";
import { ProofUploadModal } from "./ProofUploadModal";
import { StudentBookProgressModal } from "./StudentBookProgressModal";

interface StudentDashboardProps {
  currentUser: any;
}

export function StudentDashboard({ currentUser }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"homework" | "books" | "calendar">("homework");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [studentBooks, setStudentBooks] = useState<any[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Filtered list
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

  // Distinct subjects from assigned books
  const subjects = Array.from(
    new Set(studentBooks.map((sb) => JSON.stringify(sb.book.subject)))
  ).map((s) => JSON.parse(s));

  // Student academic placement details
  const studentGrade = currentUser?.studentProfile?.classGrade || "NEET Dropper";
  const studentSection = currentUser?.studentProfile?.section || "A";
  const studentRoll = currentUser?.studentProfile?.rollNo || "--";

  // Determine subjects for student's academic track according to rules:
  // Physics & Chemistry: Class 11, Class 11 NEET, Class 11 JEE, NEET Dropper, Class 12, Class 12 NEET, Class 12 JEE, JEE Dropper
  // Biology: Class 11, Class 11 NEET, NEET Dropper, Class 12, Class 12 NEET
  // Mathematics: Class 11, Class 11 JEE, Class 12, Class 12 JEE, JEE Dropper
  const isNEETTrack = studentGrade.toLowerCase().includes("neet") || (!studentGrade.toLowerCase().includes("jee") && !studentGrade.includes("Class 4") && !studentGrade.includes("Class 5") && !studentGrade.includes("Class 6") && !studentGrade.includes("Class 7") && !studentGrade.includes("Class 8") && !studentGrade.includes("Class 9") && !studentGrade.includes("Class 10"));
  const isJEETrack = studentGrade.toLowerCase().includes("jee");

  const streamSubjects: Array<{ name: string; classGrade: string; color: string; icon: string; badge: string }> = [
    { name: "Physics", classGrade: studentGrade, color: "#2563EB", icon: "atom", badge: "Core Science" },
    { name: "Chemistry", classGrade: studentGrade, color: "#D97706", icon: "flask-conical", badge: "Core Science" },
  ];

  if (isNEETTrack || (!isJEETrack && (studentGrade.includes("11") || studentGrade.includes("12") || studentGrade.toLowerCase().includes("dropper")))) {
    streamSubjects.push({ name: "Biology", classGrade: studentGrade, color: "#059669", icon: "dna", badge: "Medical Track" });
  }
  if (isJEETrack || (!isNEETTrack && (studentGrade.includes("11") || studentGrade.includes("12")))) {
    streamSubjects.push({ name: "Mathematics", classGrade: studentGrade, color: "#4F46E5", icon: "calculator", badge: "Engineering Track" });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {currentUser?.studentProfile?.schoolName || "LV INSTITUTE"} • {studentGrade} • Section {studentSection} • Roll #{studentRoll}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {currentUser?.name?.split(" ")[0] || "Student"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
              Track your exercises, update completed questions in seconds, and stay ahead of your due dates.
            </p>
          </div>

          {/* Quick Overall Metric Pill */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{overallProgressPercentage}%</div>
              <div className="text-[10px] uppercase font-semibold text-indigo-200">
                Completed
              </div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between gap-3 text-white/90">
                <span>Total:</span>
                <span className="font-bold">{totalHomework}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-300">
                <span>Done:</span>
                <span className="font-bold">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-amber-300">
                <span>Pending:</span>
                <span className="font-bold">{totalHomework - completedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MY ACADEMIC CLASS & FACULTY PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Enrolled Class: <span className="text-indigo-600">{studentGrade}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Section {studentSection}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Roll #{studentRoll}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Academic Curriculum & Assigned Faculty for {studentGrade}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <School className="w-4 h-4 text-slate-400" />
            <span>{currentUser?.studentProfile?.schoolName || "LV INSTITUTE"}</span>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {streamSubjects.map((sub) => {
            const assignment = facultyAssignments.find(
              (a) => a.subject?.name?.toLowerCase() === sub.name.toLowerCase()
            );

            return (
              <div
                key={sub.name}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold shadow-2xs"
                      style={{ backgroundColor: sub.color }}
                    >
                      {sub.name === "Physics" ? (
                        <Atom className="w-4 h-4" />
                      ) : sub.name === "Chemistry" ? (
                        <FlaskConical className="w-4 h-4" />
                      ) : sub.name === "Biology" ? (
                        <Dna className="w-4 h-4" />
                      ) : (
                        <Calculator className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{sub.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {studentGrade}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-2xs">
                    {sub.badge}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Faculty:</span>
                  {assignment ? (
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{assignment.teacher?.name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      In Assignment
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overdue Warning Alert (if any) */}
      {overdueHomework.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {overdueHomework.length} Overdue Homework Assignment{overdueHomework.length > 1 ? "s" : ""}
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Please prioritize: {overdueHomework[0].exercise.name} ({overdueHomework[0].book.name}) was due on{" "}
                {new Date(overdueHomework[0].dueDate).toLocaleDateString()}.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenProgress(overdueHomework[0])}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}

      {/* TODAY'S PRIORITY HOMEWORK CARD (Requirement 25) */}
      {todayHomework.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Today's Homework
            </h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Due Today
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayHomework.map((hw) => (
              <div
                key={hw.id}
                className="p-5 bg-white rounded-3xl border-2 border-indigo-500/40 shadow-md shadow-indigo-500/5 hover:border-indigo-600 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                        style={{ backgroundColor: hw.subject.color }}
                      >
                        {hw.subject.name} {hw.subject.classGrade ? `• ${hw.subject.classGrade}` : ""}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {hw.book.name} — Chapter {hw.chapter.chapterNumber}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-700">
                        {hw.exercise.name} ({hw.totalQuestions} Questions)
                      </p>
                    </div>

                    <span className="px-2 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      Due Today
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>
                        {hw.questionsCompleted} / {hw.totalQuestions} Questions Completed
                      </span>
                      <span className="text-indigo-600">{hw.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${hw.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenProgress(hw)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>UPDATE PROGRESS</span>
                  </button>

                  <button
                    onClick={() => handleOpenProof(hw)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                    title="Upload Proof / Solution Photo"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs (Homework List, Academic Books, Calendar) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("homework")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "homework"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Homework ({homeworkList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "books"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Books ({studentBooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "calendar"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: HOMEWORK LIST */}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                          style={{ backgroundColor: hw.subject.color }}
                        >
                          {hw.subject.name} {hw.subject.classGrade ? `• ${hw.subject.classGrade}` : ""}
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
                        {hw.book.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ch {hw.chapter.chapterNumber} — {hw.chapter.name}
                      </p>
                      <p className="text-xs font-bold text-indigo-700 mt-1">
                        {hw.exercise.name} ({hw.totalQuestions} Questions)
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
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
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
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
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

      {/* TAB 2: MY BOOKS & CHAPTERS EXPLORER (Requirements 27-29) */}
      {activeTab === "books" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {studentBooks.map((sb) => {
              const b = sb.book;
              const totalExercises = b.chapters?.reduce(
                (sum: number, ch: any) => sum + (ch.exercises?.length || 0),
                0
              ) || 0;

              return (
                <div
                  key={sb.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-14 h-16 rounded-2xl text-white font-bold flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: b.subject.color }}
                      >
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold text-white inline-block"
                            style={{ backgroundColor: b.subject.color }}
                          >
                            {b.subject.name} {b.classGrade ? `• ${b.classGrade}` : ""}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {b.curriculumType || "NEET"}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1">{b.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {b.chapters?.length || 0} Chapters • {totalExercises} Exercises • Author: {b.author || "Narendra Avasthi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70 self-start sm:self-center">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span>Interactive Question & Status Tracking</span>
                    </div>
                  </div>

                  {/* Chapter-wise progress list with exact Completed/Partially Completed & Question Completed Till */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Chapters & Exercises:
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Click on any exercise to update questions completed till
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {b.chapters?.map((ch: any) => {
                        const exercises = ch.exercises || [];
                        const completedExCount = exercises.filter((ex: any) => {
                          const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                          return hw?.exerciseStatus === "COMPLETED";
                        }).length;

                        const totalExCount = exercises.length;
                        const inProgressExCount = exercises.filter((ex: any) => {
                          const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                          return hw?.exerciseStatus === "IN_PROGRESS";
                        }).length;

                        const isChapterCompleted = totalExCount > 0 && completedExCount === totalExCount;
                        const isChapterPartial = (completedExCount > 0 && completedExCount < totalExCount) || inProgressExCount > 0;

                        return (
                          <div
                            key={ch.id}
                            className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3.5 transition-all hover:border-slate-300"
                          >
                            {/* Chapter Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-extrabold text-slate-900">
                                    Chapter {ch.chapterNumber}: {ch.name}
                                  </h4>

                                  {/* Chapter Status Badge */}
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                      isChapterCompleted
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : isChapterPartial
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {isChapterCompleted
                                      ? "✅ Completed (100%)"
                                      : isChapterPartial
                                      ? `⏳ Partially Completed (${completedExCount}/${totalExCount} Done)`
                                      : "⚪ Not Started"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {totalExCount} Exercises • {completedExCount} Completed
                                </p>
                              </div>

                              {/* Chapter-Level Action Button */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenBookExerciseProgress(b, ch, null)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200 transition-all shadow-2xs flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Update Chapter Status</span>
                                </button>
                              </div>
                            </div>

                            {/* Exercises in this chapter */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {exercises.map((ex: any, idx: number) => {
                                const hw = homeworkList.find((h) => h.exerciseId === ex.id);
                                const isDone = hw?.exerciseStatus === "COMPLETED";
                                const isInProgress = hw?.exerciseStatus === "IN_PROGRESS";
                                const totalQ = ex.totalQuestions || hw?.totalQuestions || 10;
                                const doneQ = hw?.questionsCompleted || 0;

                                return (
                                  <div
                                    key={ex.id}
                                    onClick={() => handleOpenBookExerciseProgress(b, ch, ex)}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                                      isDone
                                        ? "bg-emerald-50/70 border-emerald-200 hover:border-emerald-300"
                                        : isInProgress
                                        ? "bg-amber-50/70 border-amber-200 hover:border-amber-300"
                                        : "bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-xs"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      {/* Quick Click Toggle */}
                                      <button
                                        type="button"
                                        title={isDone ? "Click to reset" : "Click to mark completed"}
                                        onClick={(e) => handleQuickToggleExercise(e, b, ch, ex)}
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 border ${
                                          isDone
                                            ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                            : isInProgress
                                            ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                            : "bg-slate-50 border-slate-300 text-transparent hover:text-slate-400"
                                        }`}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>

                                      <div className="min-w-0">
                                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                          {ex.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span
                                            className={`text-[10px] font-extrabold ${
                                              isDone
                                                ? "text-emerald-700"
                                                : isInProgress
                                                ? "text-amber-700"
                                                : "text-slate-500"
                                            }`}
                                          >
                                            {isDone
                                              ? `Completed (${totalQ}/${totalQ})`
                                              : isInProgress
                                              ? `Till Q${doneQ} of ${totalQ}`
                                              : `Not Started (0/${totalQ})`}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenBookExerciseProgress(b, ch, ex);
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-2xs shrink-0"
                                    >
                                      Update
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR VIEW (Requirement 40) */}
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
                      {hw.subject.name} — {hw.exercise.name}
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
