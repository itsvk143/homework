"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Atom,
  X,
} from "lucide-react";

interface BookLibraryProps {
  onAssignBook?: (book: any) => void;
  currentUser?: any;
}

export function BookLibrary({ onAssignBook, currentUser }: BookLibraryProps) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [curriculumFilter, setCurriculumFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [examFilter, setExamFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect book chapters modal
  const [inspectBook, setInspectBook] = useState<any | null>(null);

  // Assign modal state
  const [assigningBook, setAssigningBook] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (curriculumFilter !== "ALL") params.append("curriculumType", curriculumFilter);
      if (classFilter !== "ALL") params.append("classGrade", classFilter);
      if (examFilter !== "ALL") params.append("exam", examFilter);
      if (branchFilter !== "ALL") params.append("branch", branchFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/books?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [curriculumFilter, classFilter, examFilter, branchFilter, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenAssign = (book: any) => {
    setAssigningBook(book);
    setSelectedStudentIds([]);
    setAssignSuccess(null);
  };

  const handleConfirmAssign = async () => {
    if (!assigningBook || selectedStudentIds.length === 0) return;
    setIsAssigning(true);
    setAssignSuccess(null);

    try {
      const res = await fetch("/api/student-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          bookId: assigningBook.id,
        }),
      });

      if (res.ok) {
        setAssignSuccess(
          `"${assigningBook.name}" assigned successfully to ${selectedStudentIds.length} student(s)!`
        );
        setTimeout(() => {
          setAssigningBook(null);
          setAssignSuccess(null);
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master Academic Content
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {books.length} Books Available
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
            Master Book & Reference Library
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Explore authentic preloaded curriculum from <strong>NCERT Classes 4–12</strong> and dedicated <strong>JEE & NEET Competitive Exam Books</strong> categorized by subject and chemistry branch.
          </p>
        </div>

        {/* Quick Curriculum Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          {[
            { id: "ALL", label: "All Library" },
            { id: "NCERT", label: "NCERT (4–12)" },
            { id: "JEE", label: "JEE Main & Adv" },
            { id: "NEET", label: "NEET Medical" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCurriculumFilter(c.id);
                if (c.id === "JEE" || c.id === "NEET") {
                  setExamFilter(c.id);
                } else if (c.id === "NCERT") {
                  setExamFilter("ALL");
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                curriculumFilter === c.id
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar (Requirements 85 & 86) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">Class:</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold"
            >
              <option value="ALL">All Classes</option>
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                <option key={c} value={`Class ${c}`}>
                  Class {c}
                </option>
              ))}
              <option value="Class 11 & 12">Class 11 & 12 (Target)</option>
            </select>
          </div>

          {/* Exam Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">Exam:</label>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold"
            >
              <option value="ALL">All Exams</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">Branch:</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold"
            >
              <option value="ALL">All Branches</option>
              <option value="Physical Chemistry">Physical Chemistry</option>
              <option value="Organic Chemistry">Organic Chemistry</option>
              <option value="Inorganic Chemistry">Inorganic Chemistry</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search title, author, publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading Master Book Library...
        </div>
      ) : books.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No books found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((b) => {
            const isCompetitive = b.bookType === "COMPETITIVE";
            const isJEE = b.exam === "JEE";
            const isNEET = b.exam === "NEET";

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Category badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                          isJEE
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : isNEET
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-indigo-50 text-indigo-800 border-indigo-200"
                        }`}
                      >
                        {b.curriculumType} {b.exam ? `• ${b.exam}` : ""}
                      </span>

                      {b.branch && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {b.branch}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {b.classGrade}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-2 leading-snug">
                    {b.name}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">Author:</span>{" "}
                    {b.author || "NCERT Committee"}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{b.publisher || "NCERT"}</span>
                    <span>{b.edition}</span>
                  </div>

                  {/* Description preview */}
                  {b.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                      "{b.description}"
                    </p>
                  )}

                  {/* Chapters count */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-indigo-700">
                      {b.chapters?.length || 0} Chapters Preloaded
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {b._count?.homeworks || 0} assignments active
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setInspectBook(b)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-center"
                  >
                    View Chapters
                  </button>

                  <button
                    onClick={() => handleOpenAssign(b)}
                    className="py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECT CHAPTERS MODAL */}
      {inspectBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
                  {inspectBook.curriculumType} {inspectBook.exam ? `• ${inspectBook.exam}` : ""} • {inspectBook.classGrade}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {inspectBook.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Author: {inspectBook.author} • {inspectBook.publisher}
                </p>
              </div>
              <button
                onClick={() => setInspectBook(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Predefined Chapters & Exercises ({inspectBook.chapters?.length || 0}):
              </label>

              {inspectBook.chapters?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No chapters defined yet.
                </p>
              ) : (
                inspectBook.chapters?.map((ch: any) => (
                  <div
                    key={ch.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>
                        Ch {ch.chapterNumber}: {ch.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ch.exercises?.length || 0} exercises
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ch.exercises?.map((ex: any) => (
                        <span
                          key={ex.id}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 text-slate-700"
                        >
                          {ex.name} ({ex.totalQuestions} Qs)
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectBook(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN BOOK TO STUDENTS MODAL (Requirement 87 & 88) */}
      {assigningBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  Assign Book to Student(s)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {assigningBook.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {assigningBook.curriculumType} • {assigningBook.classGrade}
                </p>
              </div>
              <button
                onClick={() => setAssigningBook(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {assignSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Select Students ({selectedStudentIds.length} selected):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentIds.length === students.length) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(students.map((s) => s.id));
                    }
                  }}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  {selectedStudentIds.length === students.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {students.map((stu) => {
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
                      className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-500 font-bold text-indigo-900"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 rounded text-indigo-600 pointer-events-none"
                        />
                        <div>
                          <p>{stu.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {stu.studentProfile?.classGrade} • Roll #{stu.studentProfile?.rollNo || "--"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{stu.email}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningBook(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={isAssigning || selectedStudentIds.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors shadow-xs"
              >
                {isAssigning ? "Assigning..." : `Assign to ${selectedStudentIds.length} Student(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
