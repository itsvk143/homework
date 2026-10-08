"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  FileCheck2,
  Filter,
  Download,
  Search,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  BarChart2,
  Send,
  X,
  BookOpen,
  Layers,
} from "lucide-react";
import { BookLibrary } from "./BookLibrary";
import { TeacherChapterProgress } from "./TeacherChapterProgress";

interface TeacherDashboardProps {
  currentUser: any;
}

export function TeacherDashboard({ currentUser }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "assign" | "chapterProgress" | "library" | "reviews" | "students">("overview");
  const [monitoringFilter, setMonitoringFilter] = useState<string>("ALL");
  const [searchStudent, setSearchStudent] = useState<string>("");

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Assignment Wizard state (3-5 clicks flow)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [wizardSubjectId, setWizardSubjectId] = useState<string>("");
  const [wizardBookId, setWizardBookId] = useState<string>("");
  const [wizardChapterId, setWizardChapterId] = useState<string>("");
  const [wizardExerciseId, setWizardExerciseId] = useState<string>("");
  const [wizardDueDate, setWizardDueDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [wizardInstructions, setWizardInstructions] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  // Review modal state
  const [reviewAssignment, setReviewAssignment] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Student Profile Drilldown state
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const teacherParam = currentUser?.role === "TEACHER" ? `?teacherId=${currentUser.id}` : "";
      const [stuRes, hwRes, hierRes] = await Promise.all([
        fetch(`/api/students${teacherParam}`),
        fetch(`/api/homework${teacherParam}`),
        fetch("/api/academic/hierarchy"),
      ]);

      if (stuRes.ok) {
        const sData = await stuRes.json();
        setStudents(sData.students || []);
      }
      if (hwRes.ok) {
        const hData = await hwRes.json();
        setHomeworkList(hData.assignments || []);
      }
      if (hierRes.ok) {
        const hiData = await hierRes.json();
        setHierarchy(hiData.subjects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Determine subjects assigned to this teacher or matching specialty
  const teacherAuthorizedSubjects = React.useMemo(() => {
    if (!currentUser || currentUser.role !== "TEACHER") return hierarchy;

    // Collect subjects from assigned students
    const subjectIdSet = new Set<string>();
    const specialty = (currentUser.teacherProfile?.subjectSpecialty || "").toLowerCase();

    students.forEach((stu) => {
      stu.assignedTeachersAsStudent?.forEach((a: any) => {
        if (a.teacherId === currentUser.id && a.subjectId) {
          subjectIdSet.add(a.subjectId);
        }
      });
    });

    // Also match by subject name against specialty string (e.g. "Mathematics & Science")
    hierarchy.forEach((sub) => {
      if (specialty && specialty.includes(sub.name.toLowerCase())) {
        subjectIdSet.add(sub.id);
      }
    });

    // If teacher has assigned subjects, filter hierarchy to those
    if (subjectIdSet.size > 0) {
      const filtered = hierarchy.filter((s) => subjectIdSet.has(s.id));
      if (filtered.length > 0) return filtered;
    }

    return hierarchy;
  }, [currentUser, hierarchy, students]);

  // Set default subject and book for wizard once teacherAuthorizedSubjects loads
  useEffect(() => {
    if (teacherAuthorizedSubjects.length > 0) {
      const isValidCurrent = teacherAuthorizedSubjects.some((s) => s.id === wizardSubjectId);
      if (!wizardSubjectId || !isValidCurrent) {
        const firstSub = teacherAuthorizedSubjects[0];
        setWizardSubjectId(firstSub.id);
        if (firstSub.books?.length > 0) {
          const firstBook = firstSub.books[0];
          setWizardBookId(firstBook.id);
          if (firstBook.chapters?.length > 0) {
            const firstChap = firstBook.chapters[0];
            setWizardChapterId(firstChap.id);
            if (firstChap.exercises?.length > 0) {
              setWizardExerciseId(firstChap.exercises[0].id);
            }
          }
        }
      }
    }
  }, [teacherAuthorizedSubjects]);

  // Dynamic filter helpers for wizard
  const currentSubjectObj = teacherAuthorizedSubjects.find((s) => s.id === wizardSubjectId) || hierarchy.find((s) => s.id === wizardSubjectId);
  const availableBooks = currentSubjectObj?.books || [];
  const currentBookObj = availableBooks.find((b: any) => b.id === wizardBookId);
  const availableChapters = currentBookObj?.chapters || [];
  const currentChapterObj = availableChapters.find((c: any) => c.id === wizardChapterId);
  const availableExercises = currentChapterObj?.exercises || [];
  const selectedExerciseObj = availableExercises.find((e: any) => e.id === wizardExerciseId);

  // Eligible students for the currently selected subject in the wizard
  const studentsForSelectedSubject = React.useMemo(() => {
    if (!currentUser || currentUser.role !== "TEACHER") return students;
    const subjectSpecific = students.filter((stu) =>
      stu.assignedTeachersAsStudent?.some(
        (a: any) => a.teacherId === currentUser.id && a.subjectId === wizardSubjectId
      )
    );
    return subjectSpecific.length > 0 ? subjectSpecific : students;
  }, [currentUser, students, wizardSubjectId]);

  // Derived Teacher Metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalStudents = students.length;

  const assignedTodayCount = homeworkList.filter(
    (h) => new Date(h.assignedDate) >= startOfToday
  ).length;

  const completedCount = homeworkList.filter((h) => h.exerciseStatus === "COMPLETED").length;
  const inProgressCount = homeworkList.filter((h) => h.exerciseStatus === "IN_PROGRESS").length;
  const overdueCount = homeworkList.filter(
    (h) => h.exerciseStatus !== "COMPLETED" && new Date(h.dueDate) < now
  ).length;

  const pendingVerificationCount = homeworkList.filter(
    (h) => h.homeworkStatus === "AWAITING_REVIEW"
  ).length;

  // Filtered monitoring homework table
  const filteredMonitoringList = homeworkList.filter((hw) => {
    if (monitoringFilter === "NOT_STARTED" && hw.exerciseStatus !== "NOT_STARTED") return false;
    if (monitoringFilter === "IN_PROGRESS" && hw.exerciseStatus !== "IN_PROGRESS") return false;
    if (monitoringFilter === "COMPLETED" && hw.exerciseStatus !== "COMPLETED") return false;
    if (monitoringFilter === "OVERDUE") {
      const isPast = new Date(hw.dueDate) < now;
      if (!isPast || hw.exerciseStatus === "COMPLETED") return false;
    }
    if (monitoringFilter === "NO_UPDATE") {
      if (hw.exerciseStatus === "COMPLETED") return false;
      if (hw.lastProgressUpdate) {
        const diffHours = (Date.now() - new Date(hw.lastProgressUpdate).getTime()) / (1000 * 3600);
        if (diffHours < 48) return false;
      }
    }
    if (searchStudent && !hw.student.name.toLowerCase().includes(searchStudent.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Bulk Assignment Handler
  const handleAssignHomework = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student.");
      return;
    }
    if (!wizardExerciseId) {
      alert("Please select an exercise to assign.");
      return;
    }

    setIsAssigning(true);
    setAssignSuccessMsg(null);

    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          subjectId: wizardSubjectId,
          bookId: wizardBookId,
          chapterId: wizardChapterId,
          exerciseId: wizardExerciseId,
          dueDate: wizardDueDate,
          instructions: wizardInstructions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAssignSuccessMsg(`Assigned homework successfully to ${data.count} student(s)!`);
        fetchData();
        setTimeout(() => {
          setAssignSuccessMsg(null);
          setActiveTab("overview");
        }, 2000);
      } else {
        alert(data.error || "Failed to assign homework");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning homework");
    } finally {
      setIsAssigning(false);
    }
  };

  // Review & Verification Handler
  const handleReviewAction = async (action: "VERIFY" | "SEND_BACK") => {
    if (!reviewAssignment) return;
    setIsReviewing(true);
    try {
      const res = await fetch(`/api/homework/${reviewAssignment.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          teacherComment: reviewComment,
        }),
      });

      if (res.ok) {
        setReviewAssignment(null);
        setReviewComment("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  // CSV Export
  const handleExportCSV = (type: "student" | "teacher" | "book") => {
    window.open(`/api/reports?type=${type}&format=csv`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview (Requirement 36) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalStudents}</div>
          <span className="text-[10px] text-slate-400">Class 8th Enrolled</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Today</span>
            <PlusCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{assignedTodayCount}</div>
          <span className="text-[10px] text-slate-400">Fresh tasks given</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{inProgressCount}</div>
          <span className="text-[10px] text-slate-400">Students actively solving</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{completedCount}</div>
          <span className="text-[10px] text-slate-400">100% finished exercises</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{overdueCount}</div>
          <span className="text-[10px] text-slate-400">Past deadline</span>
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Today's Homework & Monitoring
          </button>

          <button
            onClick={() => setActiveTab("chapterProgress")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "chapterProgress"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chapter Matrix Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "assign"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Fast Assign (3-5 Clicks)</span>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "library"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Master Book Library</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "reviews"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>
              Verifications & Reviews
              {pendingVerificationCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {pendingVerificationCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "students"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Student Profiles ({students.length})
          </button>
        </div>

        {/* Export Reports Buttons (Requirement 47) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV("student")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & PROGRESS MONITORING (Requirements 36, 38, 39) */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Progress Monitoring Filter Bar (Requirement 39) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Homework" },
                { id: "NOT_STARTED", label: "Not Started" },
                { id: "IN_PROGRESS", label: "In Progress" },
                { id: "COMPLETED", label: "Completed" },
                { id: "OVERDUE", label: "Overdue" },
                { id: "NO_UPDATE", label: "No Update Recently (>48h)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setMonitoringFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    monitoringFilter === f.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by student name..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Today's Homework Table (Requirement 36 & 38) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Subject & Book</th>
                    <th className="py-3 px-4">Chapter & Exercise</th>
                    <th className="py-3 px-4 text-center">Questions</th>
                    <th className="py-3 px-4">Progress Bar</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMonitoringList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No homework assignments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMonitoringList.map((hw) => {
                      const isOverdue =
                        hw.exerciseStatus !== "COMPLETED" && new Date(hw.dueDate) < now;
                      const isDone = hw.exerciseStatus === "COMPLETED";

                      return (
                        <tr key={hw.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setSelectedStudentProfile(hw.student)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                            >
                              {hw.student.name}
                            </button>
                            <span className="text-[10px] text-slate-400 block">
                              {hw.student.studentProfile?.classGrade} • Roll #{hw.student.studentProfile?.rollNo || "--"}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              {hw.subject.name} {hw.subject.classGrade ? `(${hw.subject.classGrade})` : ""}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                              {hw.book.name}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-700">{hw.exercise.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Ch {hw.chapter.chapterNumber}: {hw.chapter.name}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-900">
                              {hw.questionsCompleted}
                            </span>{" "}
                            <span className="text-slate-400">/ {hw.totalQuestions}</span>
                          </td>

                          <td className="py-3 px-4 w-36">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-indigo-600">
                                  {hw.progressPercentage}%
                                </span>
                                <span className="text-slate-400">
                                  {Math.max(0, hw.totalQuestions - hw.questionsCompleted)} left
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isDone ? "bg-emerald-500" : "bg-indigo-600"
                                  }`}
                                  style={{ width: `${hw.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isDone
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : hw.exerciseStatus === "IN_PROGRESS"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {isDone
                                ? "Completed"
                                : isOverdue
                                ? "Overdue"
                                : hw.exerciseStatus === "IN_PROGRESS"
                                ? "In Progress"
                                : "Not Started"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {hw.lastProgressUpdate
                              ? new Date(hw.lastProgressUpdate).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Never"}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setReviewAssignment(hw)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAST 3-5 CLICK BULK HOMEWORK ASSIGNMENT WIZARD (Requirements 13 & 14) */}
      {activeTab === "assign" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/60">
              Bulk Assignment Engine
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Assign Exercise Homework in 3–5 Clicks
            </h2>
            <p className="text-xs text-slate-500">
              Select multiple students, choose subject and predefined exercise, set the deadline, and dispatch.
            </p>
          </div>

          {assignSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{assignSuccessMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Student(s) (Requirement 14) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 1: Select Students ({selectedStudentIds.length} selected of {studentsForSelectedSubject.length} eligible)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedStudentIds.length === studentsForSelectedSubject.length) {
                    setSelectedStudentIds([]);
                  } else {
                    setSelectedStudentIds(studentsForSelectedSubject.map((s) => s.id));
                  }
                }}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
              >
                {selectedStudentIds.length === studentsForSelectedSubject.length ? "Deselect All" : "Select All Assigned"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {studentsForSelectedSubject.map((stu) => {
                const isChecked = selectedStudentIds.includes(stu.id);
                return (
                  <div
                    key={stu.id}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedStudentIds((prev) => prev.filter((id) => id !== stu.id));
                      } else {
                        setSelectedStudentIds((prev) => [...prev, stu.id]);
                      }
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2 ${
                      isChecked
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <div className="truncate text-xs">
                      <p className="truncate">{stu.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Roll #{stu.studentProfile?.rollNo || "--"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEPS 2-4: DYNAMIC CONTENT FILTERING (Requirement 12) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Subject</label>
              <select
                value={wizardSubjectId}
                onChange={(e) => {
                  setWizardSubjectId(e.target.value);
                  const sub = teacherAuthorizedSubjects.find((s) => s.id === e.target.value);
                  if (sub?.books?.length) {
                    setWizardBookId(sub.books[0].id);
                    if (sub.books[0].chapters?.length) {
                      setWizardChapterId(sub.books[0].chapters[0].id);
                      if (sub.books[0].chapters[0].exercises?.length) {
                        setWizardExerciseId(sub.books[0].chapters[0].exercises[0].id);
                      }
                    }
                  }
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
              >
                {teacherAuthorizedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.classGrade || "All Grades"})
                  </option>
                ))}
              </select>
            </div>

            {/* Book */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Book</label>
              <select
                value={wizardBookId}
                onChange={(e) => {
                  setWizardBookId(e.target.value);
                  const b = availableBooks.find((item: any) => item.id === e.target.value);
                  if (b?.chapters?.length) {
                    setWizardChapterId(b.chapters[0].id);
                    if (b.chapters[0].exercises?.length) {
                      setWizardExerciseId(b.chapters[0].exercises[0].id);
                    }
                  }
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
              >
                {availableBooks.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.curriculumType && b.curriculumType !== "NCERT"
                      ? `[${b.exam || b.curriculumType}${b.branch ? " • " + b.branch : ""}] ${b.name}`
                      : `[${b.classGrade || "NCERT"}] ${b.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chapter</label>
              <select
                value={wizardChapterId}
                onChange={(e) => {
                  setWizardChapterId(e.target.value);
                  const ch = availableChapters.find((item: any) => item.id === e.target.value);
                  if (ch?.exercises?.length) {
                    setWizardExerciseId(ch.exercises[0].id);
                  }
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
              >
                {availableChapters.map((ch: any) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapterNumber}: {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Predefined Exercise</label>
              <select
                value={wizardExerciseId}
                onChange={(e) => setWizardExerciseId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-700"
              >
                {availableExercises.map((ex: any) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.totalQuestions} Questions)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercise Info Card */}
          {selectedExerciseObj && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-indigo-900">
                <span>Selected: {selectedExerciseObj.name}</span>
                <span>Total Questions: {selectedExerciseObj.totalQuestions}</span>
              </div>
              <p className="text-slate-600">
                Question Range: {selectedExerciseObj.questionRange || "1-" + selectedExerciseObj.totalQuestions} • Page: {selectedExerciseObj.pageNumber || "--"}
              </p>
              {selectedExerciseObj.teacherNotes && (
                <p className="text-indigo-700 italic">Teacher note: "{selectedExerciseObj.teacherNotes}"</p>
              )}
            </div>
          )}

          {/* STEP 5: Due Date & Teacher Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Due Date</label>
              <input
                type="date"
                value={wizardDueDate}
                onChange={(e) => setWizardDueDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Teacher Instructions (Optional)</label>
              <input
                type="text"
                value={wizardInstructions}
                onChange={(e) => setWizardInstructions(e.target.value)}
                placeholder="e.g., Complete in your school notebook. Draw diagrams neatly."
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
              />
            </div>
          </div>

          {/* Dispatch Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAssignHomework}
              disabled={isAssigning || selectedStudentIds.length === 0}
              className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isAssigning ? "Assigning..." : `ASSIGN HOMEWORK TO ${selectedStudentIds.length} STUDENT(S)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: CHAPTER-WISE STUDENT TRACKING DASHBOARD (Requirements 131–166) */}
      {activeTab === "chapterProgress" && (
        <TeacherChapterProgress currentUser={currentUser} />
      )}

      {/* TAB: MASTER BOOK LIBRARY */}
      {activeTab === "library" && (
        <BookLibrary currentUser={currentUser} />
      )}

      {/* TAB 3: HOMEWORK REVIEW & VERIFICATION QUEUE (Requirements 34 & 35) */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Homework Submissions & Verifications</h3>
            <p className="text-xs text-slate-500">
              Review completed exercises, check student proof uploads, and verify or send back with guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworkList
              .filter(
                (hw) =>
                  hw.homeworkStatus === "AWAITING_REVIEW" ||
                  hw.homeworkStatus === "SUBMITTED" ||
                  hw.exerciseStatus === "COMPLETED" ||
                  hw.attachments?.length > 0
              )
              .map((hw) => (
                <div
                  key={hw.id}
                  className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">
                          {hw.student.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {hw.student.studentProfile?.classGrade} • Roll #{hw.student.studentProfile?.rollNo || "--"}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          hw.homeworkStatus === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {hw.homeworkStatus}
                      </span>
                    </div>

                    <div className="mt-3 text-xs space-y-1">
                      <p className="font-bold text-indigo-700">{hw.exercise.name}</p>
                      <p className="text-slate-600">{hw.book.name}</p>
                      <p className="font-semibold text-slate-800">
                        {hw.questionsCompleted} / {hw.totalQuestions} Questions Completed ({hw.progressPercentage}%)
                      </p>
                    </div>

                    {/* Attachments preview */}
                    {hw.attachments?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Proof Attachments ({hw.attachments.length}):
                        </label>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {hw.attachments.map((att: any) => (
                            <img
                              key={att.id}
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setReviewAssignment(hw)}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs text-center"
                    >
                      Open Verification Review
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT PROFILES & DRILLDOWNS (Requirements 37 & 38) */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((stu) => {
            const stuHomework = homeworkList.filter((h) => h.studentId === stu.id);
            const total = stuHomework.length;
            const completed = stuHomework.filter((h) => h.exerciseStatus === "COMPLETED").length;
            const inProg = stuHomework.filter((h) => h.exerciseStatus === "IN_PROGRESS").length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={stu.id}
                onClick={() => setSelectedStudentProfile(stu)}
                className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all space-y-4"
              >
                <div className="flex items-center gap-3">
                  {stu.avatarUrl ? (
                    <img
                      src={stu.avatarUrl}
                      alt={stu.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {stu.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{stu.name}</h3>
                    <p className="text-xs text-slate-500">
                      {stu.studentProfile?.classGrade} • Roll #{stu.studentProfile?.rollNo || "--"}
                    </p>
                    <p className="text-[10px] text-slate-400">{stu.email}</p>
                    {stu.assignedTeachersAsStudent && stu.assignedTeachersAsStudent.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stu.assignedTeachersAsStudent
                          .filter((a: any) => !currentUser || currentUser.role !== "TEACHER" || a.teacherId === currentUser.id)
                          .map((a: any) => (
                            <span
                              key={a.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              Subject: {a.subject?.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span className="text-sm font-extrabold text-slate-800">{total}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-[10px] text-emerald-600 block">Done</span>
                    <span className="text-sm font-extrabold text-emerald-700">{completed}</span>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <span className="text-[10px] text-indigo-600 block">Rate</span>
                    <span className="text-sm font-extrabold text-indigo-700">{completionRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW & VERIFICATION MODAL (Requirements 34 & 35) */}
      {reviewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600">Review Homework Submission</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {reviewAssignment.student.name} — {reviewAssignment.exercise.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {reviewAssignment.book.name} • {reviewAssignment.chapter.name}
                </p>
              </div>
              <button
                onClick={() => setReviewAssignment(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Questions Completed</span>
                  <span className="font-extrabold text-base text-slate-900">
                    {reviewAssignment.questionsCompleted} / {reviewAssignment.totalQuestions}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Progress</span>
                  <span className="font-extrabold text-base text-indigo-700">
                    {reviewAssignment.progressPercentage}%
                  </span>
                </div>
              </div>

              {/* Attachments gallery */}
              {reviewAssignment.attachments?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Submitted Proof Photos ({reviewAssignment.attachments.length}):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {reviewAssignment.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-slate-200 block"
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] bg-black/60 text-white rounded">
                          Click to enlarge
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback comment input (Requirement 35) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Teacher Feedback / Send Back Comment:
                </label>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g., Please complete questions 18–20 and resubmit."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleReviewAction("SEND_BACK")}
                disabled={isReviewing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Send Back for Revision</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewAction("VERIFY")}
                disabled={isReviewing}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✓ Verify & Mark Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE DRILLDOWN MODAL (Requirements 37 & 38) */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {selectedStudentProfile.avatarUrl ? (
                  <img
                    src={selectedStudentProfile.avatarUrl}
                    alt={selectedStudentProfile.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    {selectedStudentProfile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedStudentProfile.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentProfile.studentProfile?.classGrade} • Roll #{selectedStudentProfile.studentProfile?.rollNo || "--"} • {selectedStudentProfile.studentProfile?.schoolName || "LV INSTITUTE"}
                  </p>
                  {selectedStudentProfile.assignedTeachersAsStudent && selectedStudentProfile.assignedTeachersAsStudent.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedStudentProfile.assignedTeachersAsStudent
                        .filter((a: any) => !currentUser || currentUser.role !== "TEACHER" || a.teacherId === currentUser.id)
                        .map((a: any) => (
                          <span
                            key={a.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            Assigned Subject: {a.subject?.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Exercise Progress Table:
              </label>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Exercise</th>
                      <th className="p-3 text-center">Total Qs</th>
                      <th className="p-3 text-center">Completed</th>
                      <th className="p-3 text-center">Remaining</th>
                      <th className="p-3 text-center">Progress</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {homeworkList
                      .filter((h) => h.studentId === selectedStudentProfile.id)
                      .map((hw) => (
                        <tr key={hw.id}>
                          <td className="p-3 font-bold text-slate-900">
                            {hw.exercise.name}
                            <span className="text-[10px] font-normal text-slate-500 block">
                              {hw.book.name}
                            </span>
                          </td>
                          <td className="p-3 text-center">{hw.totalQuestions}</td>
                          <td className="p-3 text-center font-bold text-indigo-600">
                            {hw.questionsCompleted}
                          </td>
                          <td className="p-3 text-center">
                            {Math.max(0, hw.totalQuestions - hw.questionsCompleted)}
                          </td>
                          <td className="p-3 text-center font-bold">{hw.progressPercentage}%</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                hw.exerciseStatus === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {hw.exerciseStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
