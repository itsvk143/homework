"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  CheckSquare,
  Calendar,
  BarChart3,
  User,
  Users,
  PlusCircle,
  FileText,
  Wifi,
  WifiOff,
  Battery,
  Smartphone,
  Play,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Save,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";

interface MobileSimulatorProps {
  currentUser: any;
  onRefreshData?: () => void;
}

export function MobileSimulator({ currentUser, onRefreshData }: MobileSimulatorProps) {
  const isTeacher = currentUser?.role === "TEACHER" || currentUser?.role === "ADMIN";

  // Navigation tab
  const [studentTab, setStudentTab] = useState<"home" | "homework" | "calendar" | "progress" | "profile">("home");
  const [teacherTab, setTeacherTab] = useState<"dashboard" | "matrix" | "students" | "homework" | "reports" | "profile">("dashboard");

  // Mobile state
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("4:32 PM");

  // Mobile Chapter Matrix state (Section 155)
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Active quick update flow in mobile
  const [activeUpdateHw, setActiveUpdateHw] = useState<any | null>(null);
  const [mobileQuestionsCount, setMobileQuestionsCount] = useState<number>(0);
  const [mobileIsCompleted, setMobileIsCompleted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMatrixData = async () => {
    setLoadingMatrix(true);
    try {
      const res = await fetch("/api/teacher/chapter-progress");
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (isTeacher && teacherTab === "matrix") {
      fetchMatrixData();
    }
  }, [isTeacher, teacherTab]);

  const fetchMobileData = async () => {
    if (!currentUser) return;
    try {
      const url = isTeacher ? "/api/homework" : `/api/homework?studentId=${currentUser.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHomeworkList(data.assignments || []);
        const now = new Date();
        setLastSyncTime(
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMobileData();
  }, [currentUser?.id, isTeacher]);

  const handleOpenMobileUpdate = (hw: any) => {
    setActiveUpdateHw(hw);
    setMobileQuestionsCount(hw.questionsCompleted);
    setMobileIsCompleted(hw.exerciseStatus === "COMPLETED" || hw.questionsCompleted === hw.totalQuestions);
  };

  const handleSaveMobileProgress = async () => {
    if (!activeUpdateHw) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/homework/${activeUpdateHw.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionsCompleted: mobileIsCompleted ? activeUpdateHw.totalQuestions : mobileQuestionsCount,
          markCompleted: mobileIsCompleted,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.progressPercentage === 100) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.5 },
          });
        }
        setActiveUpdateHw(null);
        fetchMobileData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      {/* Phone Hardware Mockup Bezel */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-slate-900 rounded-[50px] p-3.5 shadow-2xl ring-1 ring-slate-800 flex flex-col">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
        </div>

        {/* Screen Canvas */}
        <div className="relative w-full h-full bg-slate-50 rounded-[40px] overflow-hidden flex flex-col">
          {/* Status Bar */}
          <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-bold text-slate-800 shrink-0">
            <span>9:41</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOffline(!isOffline)}
                title="Toggle offline state demonstration"
                className="flex items-center gap-1 text-[10px]"
              >
                {isOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
              <Battery className="w-4 h-4 text-slate-800" />
            </div>
          </div>

          {/* Offline Sync Banner (Requirement 62) */}
          {isOffline && (
            <div className="bg-amber-500 text-white text-[10px] font-bold px-4 py-1 text-center flex items-center justify-center gap-1 shrink-0">
              <WifiOff className="w-3 h-3" />
              <span>Offline • Last synced: {lastSyncTime}</span>
            </div>
          )}

          {/* SCREEN CONTENT */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            {/* IF IN QUICK UPDATE SUB-VIEW (< 10 seconds flow, Requirement 51) */}
            {activeUpdateHw ? (
              <div className="space-y-4 animate-in slide-in-from-right duration-150">
                <button
                  onClick={() => setActiveUpdateHw(null)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white inline-block"
                    style={{ backgroundColor: activeUpdateHw.subject.color }}
                  >
                    {activeUpdateHw.subject.name}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {activeUpdateHw.exercise.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeUpdateHw.book.name} • Total Questions: {activeUpdateHw.totalQuestions}
                    </p>
                  </div>

                  {/* Completion Choice */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMobileIsCompleted(false)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                        !mobileIsCompleted
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileIsCompleted(true);
                        setMobileQuestionsCount(activeUpdateHw.totalQuestions);
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                        mobileIsCompleted
                          ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Completed
                    </button>
                  </div>

                  {!mobileIsCompleted && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Questions Completed:</span>
                        <span className="text-indigo-600 font-extrabold text-base">
                          {mobileQuestionsCount}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={activeUpdateHw.totalQuestions}
                        value={mobileQuestionsCount}
                        onChange={(e) => setMobileQuestionsCount(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600"
                      />

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Remaining: {Math.max(0, activeUpdateHw.totalQuestions - mobileQuestionsCount)}</span>
                        <span>
                          {Math.round((mobileQuestionsCount / activeUpdateHw.totalQuestions) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveMobileProgress}
                      disabled={isSaving}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? "Saving..." : "SAVE PROGRESS"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : isTeacher ? (
              /* TEACHER MOBILE VIEW (Requirements 50 & 155) */
              teacherTab === "matrix" ? (
                /* HORIZONTAL CHAPTER PROGRESS MATRIX ON MOBILE (Section 155) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        {matrixData?.chapter?.name || "Chapter Matrix"}
                      </h2>
                      <p className="text-[10px] text-slate-500">
                        {matrixData?.book?.name} ({matrixData?.book?.exam || "NEET"})
                      </p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {matrixData?.students?.length || 0} Students
                    </span>
                  </div>

                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[10px] font-semibold text-indigo-800 flex items-center justify-between">
                    <span>← Swipe horizontally to view →</span>
                    <span>Avg: {matrixData?.stats?.averageProgress || 0}%</span>
                  </div>

                  {loadingMatrix ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading matrix...</div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
                      {matrixData?.students?.map((s: any) => (
                        <div
                          key={s.studentId}
                          className="w-[230px] shrink-0 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5 snap-center"
                        >
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <img
                              src={s.avatarUrl}
                              alt={s.studentName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">
                                {s.studentName}
                              </h4>
                              <div className="text-[10px] text-slate-400">
                                Roll #{s.rollNo} • Sec {s.section}
                              </div>
                            </div>
                          </div>

                          {/* Exercises rows */}
                          <div className="space-y-1.5 text-xs">
                            {s.exercises.map((cell: any) => (
                              <div
                                key={cell.exerciseId}
                                className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[11px]"
                              >
                                <span className="font-bold text-slate-700 truncate max-w-[100px]">
                                  {cell.exerciseNumber}
                                </span>
                                {cell.assigned ? (
                                  <div className="flex items-center gap-1 font-bold">
                                    <span
                                      className={
                                        cell.exerciseStatus === "COMPLETED"
                                          ? "text-emerald-700"
                                          : cell.isOverdue
                                          ? "text-rose-700"
                                          : "text-slate-800"
                                      }
                                    >
                                      {cell.questionsCompleted}/{cell.totalQuestions}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                                        cell.exerciseStatus === "COMPLETED"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : cell.isOverdue
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {cell.isOverdue ? "!" : `${cell.percentage}%`}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-semibold">
                                    Not Assigned
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Overall progress bar */}
                          <div className="pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-500">Overall</span>
                              <span className="text-indigo-600 font-black">{s.overallProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${s.overallProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Teacher Dashboard
                      </h2>
                      <p className="text-[11px] text-slate-500">{currentUser?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Teacher Mode
                    </span>
                  </div>

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned</span>
                      <span className="text-xl font-black text-slate-900">{homeworkList.length}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-emerald-600 text-[10px] uppercase font-bold block">Done</span>
                      <span className="text-xl font-black text-emerald-600">
                        {homeworkList.filter((h) => h.exerciseStatus === "COMPLETED").length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Live Student Submissions</h4>
                    {homeworkList.slice(0, 6).map((hw) => (
                      <div
                        key={hw.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{hw.student.name}</span>
                          <span className="text-indigo-600">
                            {hw.questionsCompleted}/{hw.totalQuestions} Qs
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {hw.exercise.name} • {hw.book.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* STUDENT MOBILE VIEW (Requirements 49 & 51) */
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Hi, {currentUser?.name?.split(" ")[0] || "Student"} 👋
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {currentUser?.studentProfile?.classGrade} • Delhi Public School
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {currentUser?.name?.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Priority Homework card */}
                {homeworkList.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl shadow-md space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        Today's Focus
                      </span>
                      <span className="text-indigo-200">
                        {homeworkList[0].questionsCompleted}/{homeworkList[0].totalQuestions} Questions
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base">
                        {homeworkList[0].exercise.name}
                      </h3>
                      <p className="text-xs text-indigo-100">
                        {homeworkList[0].book.name}
                      </p>
                    </div>

                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full"
                        style={{ width: `${homeworkList[0].progressPercentage}%` }}
                      />
                    </div>

                    <button
                      onClick={() => handleOpenMobileUpdate(homeworkList[0])}
                      className="w-full py-2 bg-white text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Update Progress (&lt; 10s)</span>
                    </button>
                  </div>
                )}

                {/* Homework List on Mobile */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-700">All Assigned Tasks</h4>
                  {homeworkList.map((hw) => (
                    <div
                      key={hw.id}
                      onClick={() => handleOpenMobileUpdate(hw)}
                      className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-400"
                    >
                      <div>
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white inline-block mb-1"
                          style={{ backgroundColor: hw.subject.color }}
                        >
                          {hw.subject.name}
                        </span>
                        <h5 className="font-bold text-slate-900">{hw.exercise.name}</h5>
                        <p className="text-[10px] text-slate-400">{hw.book.name}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-indigo-600 block">
                          {hw.progressPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {hw.questionsCompleted}/{hw.totalQuestions}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM TAB NAVIGATION (Requirements 49 & 50) */}
          <div className="h-16 bg-white border-t border-slate-200 px-4 flex items-center justify-around shrink-0">
            {isTeacher ? (
              <>
                <button
                  onClick={() => setTeacherTab("dashboard")}
                  className={`flex flex-col items-center gap-0.5 ${
                    teacherTab === "dashboard" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-[9px]">Home</span>
                </button>
                <button
                  onClick={() => setTeacherTab("matrix")}
                  className={`flex flex-col items-center gap-0.5 ${
                    teacherTab === "matrix" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[9px]">Matrix</span>
                </button>
                <button
                  onClick={() => setTeacherTab("students")}
                  className={`flex flex-col items-center gap-0.5 ${
                    teacherTab === "students" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-[9px]">Students</span>
                </button>
                <button
                  onClick={() => setTeacherTab("homework")}
                  className={`flex flex-col items-center gap-0.5 ${
                    teacherTab === "homework" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-[9px]">Homework</span>
                </button>
                <button
                  onClick={() => setTeacherTab("reports")}
                  className={`flex flex-col items-center gap-0.5 ${
                    teacherTab === "reports" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-[9px]">Reports</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStudentTab("home")}
                  className={`flex flex-col items-center gap-0.5 ${
                    studentTab === "home" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-[9px]">Home</span>
                </button>
                <button
                  onClick={() => setStudentTab("homework")}
                  className={`flex flex-col items-center gap-0.5 ${
                    studentTab === "homework" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-[9px]">Homework</span>
                </button>
                <button
                  onClick={() => setStudentTab("calendar")}
                  className={`flex flex-col items-center gap-0.5 ${
                    studentTab === "calendar" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-[9px]">Calendar</span>
                </button>
                <button
                  onClick={() => setStudentTab("progress")}
                  className={`flex flex-col items-center gap-0.5 ${
                    studentTab === "progress" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-[9px]">Progress</span>
                </button>
                <button
                  onClick={() => setStudentTab("profile")}
                  className={`flex flex-col items-center gap-0.5 ${
                    studentTab === "profile" ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-[9px]">Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
