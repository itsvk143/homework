"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Layers,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentBookProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: any;
  chapter: any;
  exercise: any | null; // null if chapter-level
  studentId: string;
  currentHw: any | null;
  onSaved: (updatedData: any) => void;
}

export function StudentBookProgressModal({
  isOpen,
  onClose,
  book,
  chapter,
  exercise,
  studentId,
  currentHw,
  onSaved,
}: StudentBookProgressModalProps) {
  if (!isOpen || !chapter) return null;

  // Selected mode: if exercise is provided, update that exercise
  // If exercise is null, chapter-level mode
  const [activeExercise, setActiveExercise] = useState<any | null>(exercise);

  const totalQuestions =
    activeExercise?.totalQuestions ||
    currentHw?.totalQuestions ||
    10;

  const initialCompleted = currentHw
    ? Math.min(currentHw.questionsCompleted || 0, totalQuestions)
    : 0;

  const [statusChoice, setStatusChoice] = useState<"COMPLETED" | "IN_PROGRESS" | "NOT_STARTED">(
    currentHw?.exerciseStatus === "COMPLETED" || initialCompleted === totalQuestions
      ? "COMPLETED"
      : initialCompleted > 0
      ? "IN_PROGRESS"
      : "NOT_STARTED"
  );

  const [questionsTill, setQuestionsTill] = useState<number>(initialCompleted);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever exercise or currentHw changes
  useEffect(() => {
    setActiveExercise(exercise);
    const totalQ = exercise?.totalQuestions || currentHw?.totalQuestions || 10;
    const initialQ = currentHw ? Math.min(currentHw.questionsCompleted || 0, totalQ) : 0;
    const initialStatus =
      currentHw?.exerciseStatus === "COMPLETED" || initialQ === totalQ
        ? "COMPLETED"
        : initialQ > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED";

    setStatusChoice(initialStatus);
    setQuestionsTill(initialStatus === "COMPLETED" ? totalQ : initialQ);
    setErrorMsg(null);
  }, [exercise, currentHw]);

  // Calculated progress
  const effectiveQuestions =
    statusChoice === "COMPLETED"
      ? totalQuestions
      : statusChoice === "NOT_STARTED"
      ? 0
      : questionsTill;

  const progressPct =
    totalQuestions > 0 ? Math.min(100, Math.round((effectiveQuestions / totalQuestions) * 100)) : 0;

  const handleStatusChange = (status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED") => {
    setStatusChoice(status);
    setErrorMsg(null);
    if (status === "COMPLETED") {
      setQuestionsTill(totalQuestions);
    } else if (status === "NOT_STARTED") {
      setQuestionsTill(0);
    } else {
      if (questionsTill === 0 || questionsTill >= totalQuestions) {
        setQuestionsTill(Math.max(1, Math.floor(totalQuestions / 2)));
      }
    }
  };

  const handleQuestionsTillChange = (val: number) => {
    setErrorMsg(null);
    const clamped = Math.max(0, Math.min(totalQuestions, isNaN(val) ? 0 : val));
    setQuestionsTill(clamped);

    if (clamped >= totalQuestions) {
      setStatusChoice("COMPLETED");
    } else if (clamped > 0) {
      setStatusChoice("IN_PROGRESS");
    } else {
      setStatusChoice("NOT_STARTED");
    }
  };

  // Submit exercise progress
  const handleSaveExercise = async () => {
    if (!activeExercise) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/student/exercise-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: activeExercise.id,
          studentId,
          questionsCompleted: effectiveQuestions,
          exerciseStatus: statusChoice,
          markCompleted: statusChoice === "COMPLETED",
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save progress");
      }

      if (progressPct === 100) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#4F46E5", "#F59E0B"],
        });
      }

      onSaved(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  // Submit whole chapter action
  const handleChapterAction = async (action: "COMPLETE_CHAPTER" | "RESET_CHAPTER") => {
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/student/exercise-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          studentId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update chapter");
      }

      if (action === "COMPLETE_CHAPTER") {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#10B981", "#6366F1", "#F59E0B"],
        });
      }

      onSaved(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update chapter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                style={{ backgroundColor: book?.subject?.color || "#4F46E5" }}
              >
                {book?.subject?.name || "Subject"}
              </span>
              <span className="text-xs font-bold text-slate-500 truncate max-w-[220px]">
                {book?.name}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Chapter {chapter.chapterNumber}: {chapter.name}
            </h2>
            {activeExercise && (
              <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>{activeExercise.name}</span>
                <span className="text-slate-400 font-normal">
                  ({activeExercise.totalQuestions || 10} Questions)
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* MODE 1: EXERCISE LEVEL PROGRESS */}
          {activeExercise ? (
            <div className="space-y-5">
              {/* Question 1: Is this exercise completed or not? */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  1. Is this exercise completed?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleStatusChange("COMPLETED")}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      statusChoice === "COMPLETED"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        statusChoice === "COMPLETED"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Yes, Completed</div>
                      <div className="text-[10px] text-slate-500">
                        All {totalQuestions} questions done
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      statusChoice === "IN_PROGRESS"
                        ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        statusChoice === "IN_PROGRESS"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">No, Partially Done</div>
                      <div className="text-[10px] text-slate-500">In progress / partial</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Question 2: If not, question completed till? */}
              {statusChoice === "IN_PROGRESS" && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-extrabold text-amber-950 uppercase tracking-wider block">
                        2. Question Completed Till:
                      </label>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Enter which question you have completed up to
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs font-extrabold text-amber-900 text-sm">
                      <span>Question</span>
                      <input
                        type="number"
                        min={0}
                        max={totalQuestions}
                        value={questionsTill}
                        onChange={(e) => handleQuestionsTillChange(parseInt(e.target.value) || 0)}
                        className="w-12 text-center font-black bg-amber-50/80 rounded-md border border-amber-300 py-0.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-xs text-amber-700 font-semibold">
                        / {totalQuestions}
                      </span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={totalQuestions}
                      value={questionsTill}
                      onChange={(e) => handleQuestionsTillChange(parseInt(e.target.value) || 0)}
                      className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-amber-800">
                      <span>Start (Q0)</span>
                      <span>Till Q{questionsTill} ({progressPct}%)</span>
                      <span>End (Q{totalQuestions})</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-amber-900 mr-1">Quick Select:</span>
                    {[
                      { label: "+1", add: 1 },
                      { label: "+5", add: 5 },
                      { label: "Q5", val: 5 },
                      { label: "Q10", val: 10 },
                      { label: "Q15", val: 15 },
                      { label: "Q20", val: 20 },
                    ].map((btn, idx) => {
                      const target =
                        btn.val !== undefined
                          ? Math.min(totalQuestions, btn.val)
                          : Math.min(totalQuestions, questionsTill + (btn.add || 0));

                      if (target > totalQuestions && btn.val !== undefined) return null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuestionsTillChange(target)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all shadow-2xs"
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reset to Not Started Option */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-[11px]">Or reset this exercise:</span>
                <button
                  type="button"
                  onClick={() => handleStatusChange("NOT_STARTED")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    statusChoice === "NOT_STARTED"
                      ? "bg-slate-100 text-slate-800 border-slate-300"
                      : "text-slate-400 hover:text-slate-600 border-transparent hover:border-slate-200"
                  }`}
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" />
                  Reset to Not Started (0 questions)
                </button>
              </div>

              {/* Progress Summary Pill */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      statusChoice === "COMPLETED"
                        ? "bg-emerald-500"
                        : statusChoice === "IN_PROGRESS"
                        ? "bg-amber-500"
                        : "bg-slate-300"
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Status:{" "}
                    {statusChoice === "COMPLETED"
                      ? "Completed (100%)"
                      : statusChoice === "IN_PROGRESS"
                      ? `Partially Done (${effectiveQuestions}/${totalQuestions} Questions)`
                      : "Not Started (0%)"}
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-600">{progressPct}%</span>
              </div>
            </div>
          ) : (
            /* MODE 2: WHOLE CHAPTER LEVEL PROGRESS */
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                      Chapter Status Actions
                    </h3>
                    <p className="text-[11px] text-indigo-800 font-medium">
                      Update the status for the entire chapter in one click
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white text-indigo-700 border border-indigo-200">
                    {chapter.exercises?.length || 0} Exercises
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleChapterAction("COMPLETE_CHAPTER")}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Whole Chapter Completed</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleChapterAction("RESET_CHAPTER")}
                    className="p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Reset Chapter to Not Started</span>
                  </button>
                </div>
              </div>

              {/* List of exercises inside chapter */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  Or select an exercise to update:
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {chapter.exercises?.map((ex: any, idx: number) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setActiveExercise(ex)}
                      className="w-full p-3 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 rounded-2xl border border-slate-200 text-left transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{ex.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {ex.totalQuestions || 10} Questions
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                        Update Status
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeExercise && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveExercise}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Progress</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
