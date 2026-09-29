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
  Plus,
  PlusCircle,
  Check,
  Trash2,
} from "lucide-react";

interface BookLibraryProps {
  onAssignBook?: (book: any) => void;
  currentUser?: any;
}

export function BookLibrary({ onAssignBook, currentUser }: BookLibraryProps) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);

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

  // Add New Book modal state
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    name: "",
    subjectId: "",
    createNewSubject: false,
    newSubjectName: "",
    curriculumType: "JEE",
    bookType: "COMPETITIVE",
    exam: "JEE",
    branch: "Physical Chemistry",
    classGrade: "Class 11 & 12",
    author: "",
    publisher: "",
    edition: "2025–26 Edition",
    language: "English",
    description: "",
    chapters: [
      { name: "Chapter 1: Mole Concept & Stoichiometry", chapterNumber: 1, totalExercises: 2, questionsPerEx: 20 },
    ],
  });
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

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

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        const subs = data.subjects || [];
        setSubjects(subs);
        if (subs.length > 0 && !newBook.subjectId) {
          setNewBook((prev) => ({ ...prev, subjectId: subs[0].id }));
        }
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
    fetchSubjects();
  }, []);

  const handleAddChapterRow = () => {
    const nextNum = newBook.chapters.length + 1;
    setNewBook((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          name: `Chapter ${nextNum}: Topic Name`,
          chapterNumber: nextNum,
          totalExercises: 2,
          questionsPerEx: 20,
        },
      ],
    }));
  };

  const handleRemoveChapterRow = (index: number) => {
    setNewBook((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.name.trim()) {
      setCreateError("Book title is required.");
      return;
    }

    setIsCreatingBook(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      let finalSubjectId = newBook.subjectId;

      if (newBook.createNewSubject || !finalSubjectId) {
        const subName = (newBook.newSubjectName || (newBook.createNewSubject ? "" : "General")).trim();
        if (!subName) {
          setCreateError("Please select or enter a subject name.");
          setIsCreatingBook(false);
          return;
        }

        const subRes = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subName,
            classGrade: newBook.classGrade,
            color: "#4F46E5",
          }),
        });
        if (!subRes.ok) {
          const err = await subRes.json();
          throw new Error(err.error || "Failed to create subject");
        }
        const subData = await subRes.json();
        finalSubjectId = subData.subject.id;
      }

      const formattedChapters = newBook.chapters
        .filter((ch) => ch.name.trim().length > 0)
        .map((ch, idx) => {
          const chNum = idx + 1;
          const exCount = Math.max(1, Number(ch.totalExercises) || 1);
          const qCount = Math.max(1, Number(ch.questionsPerEx) || 10);
          return {
            name: ch.name.trim(),
            chapterNumber: chNum,
            exercises: Array.from({ length: exCount }, (_, exIdx) => ({
              name: `Exercise ${chNum}.${exIdx + 1}`,
              exerciseNumber: `${chNum}.${exIdx + 1}`,
              totalQuestions: qCount,
            })),
          };
        });

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: finalSubjectId,
          name: newBook.name.trim(),
          curriculumType: newBook.curriculumType,
          bookType: newBook.bookType,
          exam: newBook.exam || null,
          branch: newBook.branch || null,
          classGrade: newBook.classGrade,
          author: newBook.author.trim() || null,
          publisher: newBook.publisher.trim() || null,
          edition: newBook.edition.trim() || "2025–26 Edition",
          language: newBook.language.trim() || "English",
          description: newBook.description.trim() || null,
          chapters: formattedChapters,
        }),
      });

      if (res.ok) {
        setCreateSuccess(
          `"${newBook.name}" created successfully with ${formattedChapters.length} chapter(s)!`
        );
        fetchBooks();
        fetchSubjects();
        setTimeout(() => {
          setIsAddBookModalOpen(false);
          setCreateSuccess(null);
          setNewBook({
            name: "",
            subjectId: subjects[0]?.id || "",
            createNewSubject: false,
            newSubjectName: "",
            curriculumType: "JEE",
            bookType: "COMPETITIVE",
            exam: "JEE",
            branch: "Physical Chemistry",
            classGrade: "Class 11 & 12",
            author: "",
            publisher: "",
            edition: "2025–26 Edition",
            language: "English",
            description: "",
            chapters: [
              { name: "Chapter 1: Mole Concept & Stoichiometry", chapterNumber: 1, totalExercises: 2, questionsPerEx: 20 },
            ],
          });
        }, 1200);
      } else {
        const data = await res.json();
        setCreateError(data.error || "Failed to create book");
      }
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || "Error creating book");
    } finally {
      setIsCreatingBook(false);
    }
  };

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

        {/* Quick Curriculum Switcher Tabs + Add Book Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
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

          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
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
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No books found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or add a new book to the library.</p>
          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
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

      {/* ADD NEW BOOK MODAL */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Master Content Catalog
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Preloaded Curriculum
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Add New Book to Library
                </h3>
                <p className="text-xs text-slate-500">
                  Register a textbook or competitive book with curriculum classification and optional chapter outlines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateBook} className="flex-1 overflow-y-auto p-6 space-y-6">
              {createError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Book Details
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Problems in Physical Chemistry for JEE (Main & Advanced)"
                    value={newBook.name}
                    onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Subject Selection / Creation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Subject *</label>
                      <button
                        type="button"
                        onClick={() =>
                          setNewBook({ ...newBook, createNewSubject: !newBook.createNewSubject })
                        }
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        {newBook.createNewSubject ? "Select Existing" : "+ New Subject"}
                      </button>
                    </div>
                    {newBook.createNewSubject ? (
                      <input
                        type="text"
                        placeholder="Enter new subject name..."
                        value={newBook.newSubjectName}
                        onChange={(e) =>
                          setNewBook({ ...newBook, newSubjectName: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-indigo-300 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                      />
                    ) : (
                      <select
                        value={newBook.subjectId}
                        onChange={(e) => setNewBook({ ...newBook, subjectId: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                      >
                        {subjects.length === 0 && <option value="">No subjects yet</option>}
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.classGrade || "All"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Class Grade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Class / Target Grade *
                    </label>
                    <select
                      value={newBook.classGrade}
                      onChange={(e) => setNewBook({ ...newBook, classGrade: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="Class 11 & 12">Class 11 & 12 (Target/Competitive)</option>
                      {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                        <option key={c} value={`Class ${c}`}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Curriculum */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Curriculum
                    </label>
                    <select
                      value={newBook.curriculumType}
                      onChange={(e) => {
                        const curr = e.target.value;
                        setNewBook({
                          ...newBook,
                          curriculumType: curr,
                          exam: curr === "JEE" || curr === "NEET" ? curr : "ALL",
                          bookType: curr === "NCERT" ? "TEXTBOOK" : "COMPETITIVE",
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="JEE">JEE (Main & Advanced)</option>
                      <option value="NEET">NEET (UG Medical)</option>
                      <option value="NCERT">NCERT National Curriculum</option>
                      <option value="CBSE">CBSE Board</option>
                      <option value="ICSE">ICSE Board</option>
                      <option value="OTHER">Other / Foundation</option>
                    </select>
                  </div>

                  {/* Exam */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exam Target
                    </label>
                    <select
                      value={newBook.exam}
                      onChange={(e) => setNewBook({ ...newBook, exam: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="">None / General</option>
                      <option value="JEE">JEE Main & Advanced</option>
                      <option value="NEET">NEET Medical</option>
                      <option value="CBSE">CBSE Board</option>
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Branch / Domain
                    </label>
                    <select
                      value={newBook.branch}
                      onChange={(e) => setNewBook({ ...newBook, branch: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="">General / Core</option>
                      <option value="Physical Chemistry">Physical Chemistry</option>
                      <option value="Organic Chemistry">Organic Chemistry</option>
                      <option value="Inorganic Chemistry">Inorganic Chemistry</option>
                      <option value="Mechanics">Mechanics (Physics)</option>
                      <option value="Electrodynamics">Electrodynamics (Physics)</option>
                      <option value="Calculus">Calculus (Math)</option>
                      <option value="Algebra">Algebra (Math)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Author</label>
                    <input
                      type="text"
                      placeholder="e.g. Narendra Avasthi"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shri Balaji Publications"
                      value={newBook.publisher}
                      onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Edition</label>
                    <input
                      type="text"
                      placeholder="e.g. 16th Edition (2025–26)"
                      value={newBook.edition}
                      onChange={(e) => setNewBook({ ...newBook, edition: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book Description / Syllabus Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of this book's focus, difficulty level, or pedagogical approach..."
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Initial Chapter Outlines */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Chapters & Exercises Outline
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pre-generate initial chapter modules and their exercise counts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChapterRow}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {newBook.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Chapter Title"
                          value={ch.name}
                          onChange={(e) => {
                            const updated = [...newBook.chapters];
                            updated[idx].name = e.target.value;
                            setNewBook({ ...newBook, chapters: updated });
                          }}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="block text-[9px] text-slate-400 font-bold mb-0.5">
                          Exercises
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={ch.totalExercises}
                          onChange={(e) => {
                            const updated = [...newBook.chapters];
                            updated[idx].totalExercises = Number(e.target.value);
                            setNewBook({ ...newBook, chapters: updated });
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="block text-[9px] text-slate-400 font-bold mb-0.5">
                          Qs / Ex
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={150}
                          value={ch.questionsPerEx}
                          onChange={(e) => {
                            const updated = [...newBook.chapters];
                            updated[idx].questionsPerEx = Number(e.target.value);
                            setNewBook({ ...newBook, chapters: updated });
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      {newBook.chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChapterRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBook}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isCreatingBook ? (
                    <span>Creating Book...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save & Preload Book</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
