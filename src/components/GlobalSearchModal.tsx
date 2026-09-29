"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  User,
  BookOpen,
  Folder,
  FileSpreadsheet,
  CheckSquare,
  GraduationCap,
} from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssignment?: (assignmentId: string) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onSelectAssignment }: GlobalSearchModalProps) {
  if (!isOpen) return null;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({
    students: [],
    teachers: [],
    subjects: [],
    books: [],
    chapters: [],
    exercises: [],
    homework: [],
  });

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({
        students: [],
        teachers: [],
        subjects: [],
        books: [],
        chapters: [],
        exercises: [],
        homework: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    (results.students?.length || 0) +
      (results.teachers?.length || 0) +
      (results.subjects?.length || 0) +
      (results.books?.length || 0) +
      (results.chapters?.length || 0) +
      (results.exercises?.length || 0) +
      (results.homework?.length || 0) >
    0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search students, teachers, books, exercises, homework..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Searching academic repository...
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across the platform.
            </div>
          )}

          {/* Students */}
          {results.students?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Students
              </div>
              <div className="space-y-1">
                {results.students.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                      <span className="text-slate-500 ml-2">
                        {s.studentProfile?.classGrade} • Roll #{s.studentProfile?.rollNo || "--"}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                      {s._count?.studentAssignments || 0} homeworks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises */}
          {results.exercises?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Exercises
              </div>
              <div className="space-y-1">
                {results.exercises.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{e.name}</span>
                      <span className="text-slate-500 ml-2">
                        {e.chapter?.name} • {e.chapter?.book?.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {e.totalQuestions} Questions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Books */}
          {results.books?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Books
              </div>
              <div className="space-y-1">
                {results.books.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{b.name}</span>
                      <span className="text-slate-500 ml-2">{b.subject?.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{b.author || b.publisher}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homework Assignments */}
          {results.homework?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Homework Assignments
              </div>
              <div className="space-y-1">
                {results.homework.map((hw: any) => (
                  <div
                    key={hw.id}
                    onClick={() => {
                      if (onSelectAssignment) onSelectAssignment(hw.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-indigo-50/60 border border-transparent hover:border-indigo-200 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-indigo-900">{hw.exercise?.name}</span>
                      <span className="text-slate-500 ml-2">
                        Assigned to {hw.student?.name} • {hw.book?.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
                      {hw.questionsCompleted} / {hw.totalQuestions} Qs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
