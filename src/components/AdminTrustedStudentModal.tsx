"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Sliders,
  Save,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";

interface AdminTrustedStudentModalProps {
  student: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedData: any) => void;
}

export function AdminTrustedStudentModal({
  student,
  isOpen,
  onClose,
  onSaved,
}: AdminTrustedStudentModalProps) {
  const [isTrustedMaster, setIsTrustedMaster] = useState<boolean>(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [minQuestions, setMinQuestions] = useState<number>(1);
  const [maxQuestions, setMaxQuestions] = useState<number>(500);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      const assignedBooks = student.assignedBooksAsStudent || [];
      const trustedBooks = assignedBooks
        .filter((sb: any) => sb.isTrustedForConfig)
        .map((sb: any) => sb.bookId || sb.book?.id);

      const hasTrusted = Boolean(student.studentProfile?.isTrustedStudent || trustedBooks.length > 0);
      setIsTrustedMaster(hasTrusted);
      setSelectedBookIds(trustedBooks);

      // Check min/max from first trusted book or defaults
      const firstTrusted = assignedBooks.find((sb: any) => sb.isTrustedForConfig);
      setMinQuestions(firstTrusted?.minQuestions || 1);
      setMaxQuestions(firstTrusted?.maxQuestions || 500);
      setErrorMsg(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const assignedBooks = student.assignedBooksAsStudent || [];

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAllBooks = () => {
    setSelectedBookIds(assignedBooks.map((sb: any) => sb.bookId || sb.book?.id));
  };

  const handleDeselectAllBooks = () => {
    setSelectedBookIds([]);
  };

  const handleSave = async () => {
    if (minQuestions < 1) {
      setErrorMsg("Minimum questions limit must be at least 1.");
      return;
    }
    if (maxQuestions <= minQuestions) {
      setErrorMsg("Maximum questions limit must be greater than minimum questions.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/trusted-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          isTrustedStudent: isTrustedMaster,
          authorizedBookIds: isTrustedMaster ? selectedBookIds : [],
          minQuestions,
          maxQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update trusted student permissions.");
      } else {
        onSaved({
          studentId: student.id,
          isTrustedStudent: isTrustedMaster,
          authorizedBookIds: isTrustedMaster ? selectedBookIds : [],
          minQuestions,
          maxQuestions,
        });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Network error saving trusted student permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Trusted Student Permissions</h3>
              <p className="text-xs text-indigo-200">
                Exercise configuration capabilities for {student.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Student Summary Pill */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                {student.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900">{student.name}</div>
                <div className="text-[11px] text-slate-500">{student.email}</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-bold text-slate-700">
              {student.studentProfile?.classGrade || "Class 12"} • Sec {student.studentProfile?.section || "A"}
            </span>
          </div>

          {/* Master Permission Toggle */}
          <div className="p-4 rounded-2xl border-2 transition-all flex items-start justify-between gap-4 border-slate-200 bg-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Trusted Student — Exercise Configuration
                </span>
                {isTrustedMaster && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Authorizes this student to edit question counts for selected books. Changes update the canonical
                configuration for everyone assigned to the book.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isTrustedMaster}
                onChange={(e) => setIsTrustedMaster(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Scope: Book Checklist (Only enabled if master permission is active) */}
          {isTrustedMaster && (
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Authorized Books Scope ({selectedBookIds.length}/{assignedBooks.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select the specific books this student is authorized to configure:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllBooks}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllBooks}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {assignedBooks.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                  This student has no assigned books yet. Assign books before configuring permissions.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assignedBooks.map((sb: any) => {
                    const book = sb.book;
                    const bookId = sb.bookId || book?.id;
                    const isChecked = selectedBookIds.includes(bookId);

                    return (
                      <label
                        key={bookId}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-indigo-50/80 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBook(bookId)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate text-xs">{book?.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {book?.subject?.name} • {book?.classGrade || "Class 12"} • {book?.curriculumType || "JEE"}
                            </div>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                            Authorized
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Question Count Guardrails */}
              <div className="pt-3 border-t border-slate-200/60 mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Min Questions Allowed:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={minQuestions}
                    onChange={(e) => setMinQuestions(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Max Questions Allowed:
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(parseInt(e.target.value, 10) || 500)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-indigo-900">
            <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
            <span>
              All question count changes are strictly audited with timestamp, author, previous count, and single-click
              rollback capabilities in the Admin Audit History.
            </span>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Permissions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
