"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  History,
  AlertCircle,
  Save,
  ArrowRight,
  TrendingUp,
  FileCheck2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface HomeworkAssignment {
  id: string;
  totalQuestions: number;
  questionsCompleted: number;
  progressPercentage: number;
  exerciseStatus: string;
  homeworkStatus: string;
  dueDate: string;
  instructions?: string | null;
  teacherComment?: string | null;
  exercise: {
    id: string;
    name: string;
    exerciseNumber: string;
    totalQuestions: number;
    questionRange?: string | null;
    pageNumber?: number | null;
    teacherNotes?: string | null;
  };
  chapter: {
    name: string;
    chapterNumber: number;
  };
  book: {
    name: string;
  };
  subject: {
    name: string;
    color: string;
  };
  progressHistory?: Array<{
    id: string;
    questionsCompleted: number;
    totalQuestions: number;
    progressPercentage: number;
    createdAt: string;
    notes?: string | null;
  }>;
}

interface QuickProgressModalProps {
  assignment: HomeworkAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onProgressSaved: (updatedAssignment: any) => void;
  onOpenProofUpload?: (assignment: HomeworkAssignment) => void;
}

export function QuickProgressModal({
  assignment,
  isOpen,
  onClose,
  onProgressSaved,
  onOpenProofUpload,
}: QuickProgressModalProps) {
  if (!isOpen || !assignment) return null;

  const totalQuestions = assignment.totalQuestions || assignment.exercise.totalQuestions || 10;
  const initialCompleted = Math.min(assignment.questionsCompleted, totalQuestions);

  const [isCompletedChoice, setIsCompletedChoice] = useState<boolean>(
    assignment.exerciseStatus === "COMPLETED" || initialCompleted === totalQuestions
  );
  const [questionsCount, setQuestionsCount] = useState<number>(initialCompleted);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Live calculated stats
  const effectiveCompleted = isCompletedChoice ? totalQuestions : questionsCount;
  const questionsRemaining = Math.max(0, totalQuestions - effectiveCompleted);
  const progressPercentage = Math.min(100, Math.round((effectiveCompleted / totalQuestions) * 100));

  const handleChoiceChange = (completed: boolean) => {
    setIsCompletedChoice(completed);
    setErrorMsg(null);
    if (completed) {
      setQuestionsCount(totalQuestions);
    } else {
      if (questionsCount >= totalQuestions) {
        setQuestionsCount(Math.max(0, totalQuestions - 1));
      }
    }
  };

  const handleCountChange = (val: number) => {
    setErrorMsg(null);
    if (isNaN(val)) {
      setQuestionsCount(0);
      return;
    }
    if (val > totalQuestions) {
      setErrorMsg(`Questions completed cannot exceed the total number of questions (${totalQuestions}).`);
      setQuestionsCount(totalQuestions);
      setIsCompletedChoice(true);
      return;
    }
    if (val < 0) {
      setQuestionsCount(0);
      return;
    }

    setQuestionsCount(val);
    if (val === totalQuestions) {
      setIsCompletedChoice(true);
    } else {
      setIsCompletedChoice(false);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/homework/${assignment.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionsCompleted: effectiveCompleted,
          markCompleted: isCompletedChoice,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update progress");
        setSaving(false);
        return;
      }

      // Celebrate with confetti if completed!
      if (data.progressPercentage === 100) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4F46E5", "#10B981", "#F59E0B", "#EC4899"],
        });
      }

      onProgressSaved(data.assignment);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with subject badge */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: assignment.subject.color || "#4F46E5" }}
                >
                  {assignment.subject.name}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {assignment.book.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Chapter {assignment.chapter.chapterNumber} — {assignment.exercise.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                  Total Questions: {totalQuestions}
                </span>
                {assignment.exercise.questionRange && (
                  <span>Range: {assignment.exercise.questionRange}</span>
                )}
                {assignment.exercise.pageNumber && (
                  <span>Page: {assignment.exercise.pageNumber}</span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Comment alert if sent back */}
          {assignment.teacherComment && assignment.homeworkStatus === "REJECTED" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Teacher Feedback:</span> {assignment.teacherComment}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Completion Choice (Exercise Completed vs Not Completed) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              How much have you completed?
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Option A: Exercise Not Completed */}
              <button
                type="button"
                onClick={() => handleChoiceChange(false)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  !isCompletedChoice
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    In Progress
                  </span>
                  {!isCompletedChoice ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Partially finished questions
                </p>
              </button>

              {/* Option B: Exercise Completed */}
              <button
                type="button"
                onClick={() => handleChoiceChange(true)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  isCompletedChoice
                    ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    Completed
                  </span>
                  {isCompletedChoice ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  All {totalQuestions} questions finished
                </p>
              </button>
            </div>
          </div>

          {/* If Exercise Not Completed: Number Input & Quick Adjust buttons */}
          {!isCompletedChoice && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Questions Completed:
                </label>
                <span className="text-xs text-slate-500">
                  Max: {totalQuestions}
                </span>
              </div>

              {/* Stepper Input & Counter */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCountChange(Math.max(0, questionsCount - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-lg shadow-2xs"
                >
                  -
                </button>

                <div className="relative w-28">
                  <input
                    type="number"
                    min={0}
                    max={totalQuestions}
                    value={questionsCount}
                    onChange={(e) => handleCountChange(parseInt(e.target.value, 10))}
                    className="w-full text-center text-2xl font-extrabold text-slate-900 bg-white border-2 border-indigo-500 rounded-xl py-2 shadow-inner focus:outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCountChange(Math.min(totalQuestions, questionsCount + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-lg shadow-2xs"
                >
                  +
                </button>
              </div>

              {/* Slider for smooth dragging */}
              <input
                type="range"
                min={0}
                max={totalQuestions}
                value={questionsCount}
                onChange={(e) => handleCountChange(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              {/* Quick Jump Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {[0, Math.round(totalQuestions / 4), Math.round(totalQuestions / 2), Math.round((totalQuestions * 3) / 4), totalQuestions].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleCountChange(val)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      questionsCount === val
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {val === totalQuestions ? "All" : val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Calculation Summary Box (Requirements 17 & 18) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Live Progress Calculation:
              </span>
              <span className="text-indigo-600 font-extrabold text-sm">
                {progressPercentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercentage === 100
                    ? "bg-emerald-500 shadow-xs shadow-emerald-400"
                    : "bg-indigo-600 shadow-xs shadow-indigo-400"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-medium block">Completed</span>
                <span className="text-base font-extrabold text-indigo-700">
                  {effectiveCompleted}
                </span>
                <span className="text-[10px] text-slate-400 block">/ {totalQuestions}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-medium block">Remaining</span>
                <span className="text-base font-extrabold text-slate-700">
                  {questionsRemaining}
                </span>
                <span className="text-[10px] text-slate-400 block">questions</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-medium block">Status</span>
                <span
                  className={`text-xs font-bold block mt-1 ${
                    progressPercentage === 100 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {progressPercentage === 100 ? "✓ COMPLETED" : "IN PROGRESS"}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Update Note */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Progress Notes (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Finished problems 1-12, doubts on Q10"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* History Accordion toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showHistory ? "Hide Progress History" : "View Progress History"}</span>
            </button>

            {showHistory && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto space-y-2">
                {!assignment.progressHistory || assignment.progressHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No past progress history recorded yet.
                  </p>
                ) : (
                  assignment.progressHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-indigo-700">
                          {h.questionsCompleted} / {h.totalQuestions}
                        </span>{" "}
                        <span className="text-slate-500">({h.progressPercentage}%)</span>
                        {h.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            "{h.notes}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onOpenProofUpload && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProofUpload(assignment);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Attach Proof</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "SAVE PROGRESS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
