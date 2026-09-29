"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Printer,
  Star,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldAlert,
  ArrowUpDown,
  Calendar,
  FileSpreadsheet,
  Check,
  X,
  Info,
  RefreshCw,
} from "lucide-react";

interface TeacherChapterProgressProps {
  currentUser?: any;
  initialBookId?: string | null;
  initialChapterId?: string | null;
  onNavigateToStudent?: (studentId: string) => void;
}

export function TeacherChapterProgress({
  currentUser,
  initialBookId,
  initialChapterId,
  onNavigateToStudent,
}: TeacherChapterProgressProps) {
  // Books & Content metadata
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Dependent Filter Selectors
  const [selectedExam, setSelectedExam] = useState<string>("NEET");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // Matrix Data state
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Table Filters & Options
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [progressRange, setProgressRange] = useState("ALL");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [includeAllBookStudents, setIncludeAllBookStudents] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name"); // name, overall, lastUpdated, ex_<id>
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Drawers & Modals
  const [selectedStudentDrawer, setSelectedStudentDrawer] = useState<any | null>(null);
  const [selectedExerciseDrawer, setSelectedExerciseDrawer] = useState<{
    student: any;
    cell: any;
  } | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignExerciseId, setAssignExerciseId] = useState("");
  const [assignStudentIds, setAssignStudentIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [assignInstructions, setAssignInstructions] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Teacher Override State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideQuestions, setOverrideQuestions] = useState(0);
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);

  // Favorites / Bookmarks (Section 163)
  const [favorites, setFavorites] = useState<
    Array<{
      id: string;
      exam: string;
      subjectName: string;
      bookId: string;
      bookName: string;
      chapterId: string;
      chapterName: string;
    }>
  >([]);

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cb_favorite_chapters");
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        // Preload default bookmark matching prompt requirement 163
        setFavorites([
          {
            id: "fav-1",
            exam: "NEET",
            subjectName: "Chemistry",
            bookId: "",
            bookName: "Narendra Avasthi",
            chapterId: "",
            chapterName: "Some Basic Concepts of Chemistry (Mole Concept)",
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch all books for dropdown hierarchy
  useEffect(() => {
    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const res = await fetch("/api/books");
        if (res.ok) {
          const data = await res.json();
          const books = data.books || [];
          setAllBooks(books);

          // Find initial or default book
          let targetBook = null;
          if (initialBookId) {
            targetBook = books.find((b: any) => b.id === initialBookId);
          }
          if (!targetBook) {
            // Default to NEET Narendra Avasthi if available
            targetBook =
              books.find((b: any) => b.bookCode === "NEET_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI") ||
              books.find((b: any) => b.exam === "NEET") ||
              books[0];
          }

          if (targetBook) {
            const examVal = targetBook.exam || targetBook.curriculumType || "NEET";
            setSelectedExam(examVal);
            setSelectedSubjectId(targetBook.subjectId);
            setSelectedBookId(targetBook.id);

            const ch =
              (initialChapterId && targetBook.chapters?.find((c: any) => c.id === initialChapterId)) ||
              targetBook.chapters?.[0];
            if (ch) {
              setSelectedChapterId(ch.id);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [initialBookId, initialChapterId]);

  // Derived cascade lists
  const availableExams = useMemo(() => {
    const examsSet = new Set<string>();
    allBooks.forEach((b) => {
      if (b.exam) examsSet.add(b.exam);
      else if (b.curriculumType) examsSet.add(b.curriculumType);
    });
    return Array.from(examsSet);
  }, [allBooks]);

  const booksForExam = useMemo(() => {
    return allBooks.filter((b) => (b.exam || b.curriculumType) === selectedExam);
  }, [allBooks, selectedExam]);

  const availableSubjects = useMemo(() => {
    const map = new Map<string, any>();
    booksForExam.forEach((b) => {
      if (b.subject && !map.has(b.subjectId)) {
        map.set(b.subjectId, b.subject);
      }
    });
    return Array.from(map.values());
  }, [booksForExam]);

  const booksForSubject = useMemo(() => {
    return booksForExam.filter((b) => b.subjectId === selectedSubjectId);
  }, [booksForExam, selectedSubjectId]);

  const selectedBookObj = useMemo(() => {
    return allBooks.find((b) => b.id === selectedBookId) || null;
  }, [allBooks, selectedBookId]);

  const availableChapters = useMemo(() => {
    return selectedBookObj?.chapters || [];
  }, [selectedBookObj]);

  // Handle Exam Change
  const handleExamChange = (exam: string) => {
    setSelectedExam(exam);
    const filtered = allBooks.filter((b) => (b.exam || b.curriculumType) === exam);
    if (filtered.length > 0) {
      const firstBook = filtered[0];
      setSelectedSubjectId(firstBook.subjectId);
      setSelectedBookId(firstBook.id);
      if (firstBook.chapters?.length > 0) {
        setSelectedChapterId(firstBook.chapters[0].id);
      } else {
        setSelectedChapterId("");
      }
    } else {
      setSelectedSubjectId("");
      setSelectedBookId("");
      setSelectedChapterId("");
    }
  };

  // Handle Subject Change
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const filtered = booksForExam.filter((b) => b.subjectId === subjectId);
    if (filtered.length > 0) {
      const firstBook = filtered[0];
      setSelectedBookId(firstBook.id);
      if (firstBook.chapters?.length > 0) {
        setSelectedChapterId(firstBook.chapters[0].id);
      } else {
        setSelectedChapterId("");
      }
    } else {
      setSelectedBookId("");
      setSelectedChapterId("");
    }
  };

  // Handle Book Change
  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    const bk = allBooks.find((b) => b.id === bookId);
    if (bk?.chapters?.length > 0) {
      setSelectedChapterId(bk.chapters[0].id);
    } else {
      setSelectedChapterId("");
    }
  };

  // Load Chapter Progress Matrix Data
  const loadMatrix = async () => {
    if (!selectedBookId || !selectedChapterId) return;
    setLoadingMatrix(true);
    try {
      const params = new URLSearchParams({
        bookId: selectedBookId,
        chapterId: selectedChapterId,
        includeAllBookStudents: includeAllBookStudents ? "true" : "false",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (progressRange !== "ALL") params.set("progressRange", progressRange);
      if (needsAttentionOnly) params.set("needsAttention", "true");
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/teacher/chapter-progress?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      } else {
        console.error("Failed to fetch chapter progress");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Trigger matrix fetch on key selector changes or filters
  useEffect(() => {
    if (selectedBookId && selectedChapterId) {
      loadMatrix();
    }
  }, [
    selectedBookId,
    selectedChapterId,
    includeAllBookStudents,
    statusFilter,
    progressRange,
    needsAttentionOnly,
    sortBy,
    sortOrder,
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedBookId && selectedChapterId) {
        loadMatrix();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Bookmark Chapter
  const isCurrentBookmarked = useMemo(() => {
    return favorites.some((f) => f.bookId === selectedBookId && f.chapterId === selectedChapterId);
  }, [favorites, selectedBookId, selectedChapterId]);

  const toggleBookmark = () => {
    if (!selectedBookObj || !selectedChapterId) return;
    const currentChapter = availableChapters.find((c: any) => c.id === selectedChapterId);
    let updated;
    if (isCurrentBookmarked) {
      updated = favorites.filter(
        (f) => !(f.bookId === selectedBookId && f.chapterId === selectedChapterId)
      );
    } else {
      updated = [
        ...favorites,
        {
          id: `fav-${Date.now()}`,
          exam: selectedExam,
          subjectName: selectedBookObj.subject?.name || "Subject",
          bookId: selectedBookId,
          bookName: selectedBookObj.name,
          chapterId: selectedChapterId,
          chapterName: currentChapter?.name || "Chapter",
        },
      ];
    }
    setFavorites(updated);
    try {
      localStorage.setItem("cb_favorite_chapters", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectBookmark = (fav: any) => {
    if (fav.bookId) {
      const book = allBooks.find((b) => b.id === fav.bookId);
      if (book) {
        setSelectedExam(book.exam || book.curriculumType || "NEET");
        setSelectedSubjectId(book.subjectId);
        setSelectedBookId(book.id);
        setSelectedChapterId(fav.chapterId);
        return;
      }
    }
    // Fallback search by names
    const foundBook = allBooks.find(
      (b) =>
        b.name.toLowerCase().includes(fav.bookName.toLowerCase()) ||
        (fav.author && b.author?.toLowerCase().includes(fav.author.toLowerCase()))
    );
    if (foundBook) {
      setSelectedExam(foundBook.exam || foundBook.curriculumType || "NEET");
      setSelectedSubjectId(foundBook.subjectId);
      setSelectedBookId(foundBook.id);
      const foundChapter =
        foundBook.chapters?.find((c: any) =>
          c.name.toLowerCase().includes(fav.chapterName.toLowerCase())
        ) || foundBook.chapters?.[0];
      if (foundChapter) {
        setSelectedChapterId(foundChapter.id);
      }
    }
  };

  // Quick Assign from Dashboard (Requirement 146)
  const handleOpenAssignModal = (exerciseId?: string) => {
    if (exerciseId) {
      setAssignExerciseId(exerciseId);
    } else if (matrixData?.exercises?.length > 0) {
      setAssignExerciseId(matrixData.exercises[0].id);
    }
    // Pre-select all students currently in chapter matrix
    if (matrixData?.students) {
      setAssignStudentIds(matrixData.students.map((s: any) => s.studentId));
    }
    setIsAssignModalOpen(true);
  };

  const handleExecuteAssign = async () => {
    if (!assignExerciseId || assignStudentIds.length === 0) {
      alert("Please choose an exercise and at least one student.");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: assignStudentIds,
          subjectId: selectedSubjectId,
          bookId: selectedBookId,
          chapterId: selectedChapterId,
          exerciseId: assignExerciseId,
          dueDate: assignDueDate,
          instructions: assignInstructions,
        }),
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        setAssignInstructions("");
        loadMatrix();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to assign exercise.");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning exercise");
    } finally {
      setIsAssigning(false);
    }
  };

  // Teacher / Admin Override (Requirement 147)
  const handleOpenOverride = () => {
    if (!selectedExerciseDrawer?.cell?.assignmentId) return;
    setOverrideQuestions(selectedExerciseDrawer.cell.questionsCompleted);
    setOverrideReason("Verified from physical homework notebook during doubt clearing session.");
    setOverrideFeedback(null);
    setIsOverrideModalOpen(true);
  };

  const handleExecuteOverride = async () => {
    if (!selectedExerciseDrawer?.cell?.assignmentId) return;
    if (!overrideReason || overrideReason.trim().length < 5) {
      alert("A mandatory reason (minimum 5 characters) is required for teacher override.");
      return;
    }
    setIsSubmittingOverride(true);
    try {
      const res = await fetch("/api/teacher/chapter-progress/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedExerciseDrawer.cell.assignmentId,
          questionsCompleted: Number(overrideQuestions),
          reason: overrideReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOverrideFeedback(data.message);
        setTimeout(() => {
          setIsOverrideModalOpen(false);
          setSelectedExerciseDrawer(null);
          loadMatrix();
        }, 1200);
      } else {
        alert(data.error || "Failed to execute override");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting override");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Export Matrix (CSV) (Requirement 160)
  const handleExportCSV = () => {
    if (!matrixData || !matrixData.students) return;
    const headers = [
      "Student Name",
      "Class",
      "Section",
      "Roll No",
      ...matrixData.exercises.map((e: any) => `${e.exerciseNumber} (${e.totalQuestions} Q)`),
      "Questions Completed",
      "Total Questions",
      "Overall Progress %",
      "Status",
      "Last Updated",
    ];

    const rows = matrixData.students.map((s: any) => {
      const exValues = s.exercises.map((e: any) =>
        e.assigned ? `${e.questionsCompleted}/${e.totalQuestions} (${e.percentage}%)` : "Not Assigned"
      );
      return [
        `"${s.studentName}"`,
        `"${s.classGrade}"`,
        `"${s.section}"`,
        `"${s.rollNo}"`,
        ...exValues.map((v: string) => `"${v}"`),
        s.totalCompletedQuestions,
        s.totalAssignedQuestions,
        `${s.overallProgress}%`,
        `"${s.primaryStatus}"`,
        `"${s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : "—"}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Chapter_Progress_${matrixData.chapter?.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Teacher Report (Requirement 161)
  const handlePrint = () => {
    window.print();
  };

  // Dynamic sorting handler
  const handleHeaderSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Printable Report Header (visible only on print) */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="text-xl font-black text-slate-900">
          {matrixData?.book?.exam || "ACADEMIC"} PROGRESS REPORT — CHAPTER MATRIX
        </div>
        <div className="text-sm font-semibold text-slate-700 mt-1">
          {matrixData?.book?.name} • {matrixData?.book?.branch || matrixData?.book?.subject?.name}
        </div>
        <div className="text-base font-bold text-indigo-700 mt-1">
          Chapter: {matrixData?.chapter?.name}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>Teacher: {currentUser?.name || "Mrs. Sunita Sharma"}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SECTION 135: Dedicated Dependent Hierarchy Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Teacher Chapter-Wise Tracking Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Consolidated exercise matrix across all assigned students for a specific chapter
              </p>
            </div>
          </div>

          {/* Bookmarks / Favorites Quick Switch (Section 163) */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isCurrentBookmarked
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Bookmark this chapter view"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isCurrentBookmarked ? "text-amber-500 fill-amber-500" : "text-slate-400"
                }`}
              />
              <span>{isCurrentBookmarked ? "Bookmarked" : "Bookmark View"}</span>
            </button>

            <button
              onClick={loadMatrix}
              disabled={loadingMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMatrix ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Favorite shortcuts strip */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 pt-3 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Saved Views:
            </span>
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => handleSelectBookmark(fav)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all whitespace-nowrap font-medium text-[11px]"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  {fav.exam} → {fav.bookName} → {fav.chapterName.slice(0, 24)}...
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 4 Dependent Cascading Dropdowns (Section 135) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {/* 1. Exam / Curriculum */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              1. Exam / Curriculum
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full appearance-none bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-8"
              >
                {availableExams.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 2. Subject */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              2. Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={availableSubjects.length === 0}
                className="w-full appearance-none bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-8 disabled:opacity-50"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Book */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              3. Book
            </label>
            <div className="relative">
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                disabled={booksForSubject.length === 0}
                className="w-full appearance-none bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-8 disabled:opacity-50 truncate"
              >
                {booksForSubject.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.author ? `(${b.author})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Chapter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              4. Chapter
            </label>
            <div className="relative">
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                disabled={availableChapters.length === 0}
                className="w-full appearance-none bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-8 disabled:opacity-50 truncate"
              >
                {availableChapters.map((ch: any) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapterNumber}: {ch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 136 & 137: Summary Header & Chapter Progress Statistics */}
      {matrixData && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 print:bg-none print:text-black print:border-none print:p-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[11px] border border-indigo-400/20">
                  {matrixData.book?.exam || matrixData.book?.curriculumType}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-300">
                  {matrixData.book?.subject?.name}
                </span>
                {matrixData.book?.branch && (
                  <>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-amber-300">
                      {matrixData.book?.branch}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {matrixData.chapter?.name}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>Book:</span>
                <span className="font-semibold text-white">{matrixData.book?.name}</span>
                {selectedBookObj?.author && (
                  <span className="text-slate-400">by {selectedBookObj.author}</span>
                )}
              </p>
            </div>

            {/* Overall Chapter Progress Gauge (Section 137) */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Average Student Progress</span>
                <span className="text-emerald-400 text-sm font-black">
                  {matrixData.stats?.averageProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${matrixData.stats?.averageProgress || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span>
                  {matrixData.stats?.completedStudents} of {matrixData.stats?.totalAssignedStudents}{" "}
                  students completed
                </span>
                <span>{matrixData.exercises?.length} Exercises</span>
              </div>
            </div>
          </div>

          {/* KPI Stat Cards (Section 136 & 153) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10 print:text-black">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Students
              </div>
              <div className="text-xl font-black text-white mt-1">
                {matrixData.stats?.totalAssignedStudents}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Exercises
              </div>
              <div className="text-xl font-black text-indigo-400 mt-1">
                {matrixData.exercises?.length}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ✓ Completed
              </div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {matrixData.stats?.completedStudents}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ● In Progress
              </div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {matrixData.stats?.inProgressStudents}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                — Not Started
              </div>
              <div className="text-xl font-black text-slate-400 mt-1">
                {matrixData.stats?.notStartedStudents}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ! Overdue
              </div>
              <div className="text-xl font-black text-rose-400 mt-1">
                {matrixData.stats?.overdueStudents}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 152: Exercise Performance Breakdown Strip */}
      {matrixData && matrixData.stats?.exercisePerformance?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 print:hidden">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Chapter Summary By Exercise</span>
            </h3>
            <button
              onClick={() => handleOpenAssignModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Exercise to Students</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {matrixData.stats.exercisePerformance.map((perf: any) => (
              <div
                key={perf.exerciseId}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer"
                onClick={() => handleOpenAssignModal(perf.exerciseId)}
                title="Click to assign this exercise"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate">{perf.exerciseNumber}</span>
                  <span className="text-indigo-600 font-black">{perf.completionRate}%</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {perf.exerciseName}
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${perf.completionRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-medium">
                  <span>
                    {perf.studentsCompleted}/{perf.studentsAssigned} completed
                  </span>
                  {perf.overdueCount > 0 && (
                    <span className="text-rose-600 font-bold">{perf.overdueCount} overdue</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 148 & 150: Matrix Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Search student */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student by name, roll no, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Needs Attention Quick Filter (Section 150) */}
            <button
              onClick={() => setNeedsAttentionOnly(!needsAttentionOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                needsAttentionOnly
                  ? "bg-rose-50 text-rose-700 border-rose-300 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${needsAttentionOnly ? "text-rose-600" : "text-amber-500"}`}
              />
              <span>Needs Attention</span>
              {matrixData?.stats?.needsAttentionStudents > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {matrixData.stats.needsAttentionStudents}
                </span>
              )}
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Status: All</option>
              <option value="COMPLETED">Completed (✓)</option>
              <option value="IN_PROGRESS">In Progress (●)</option>
              <option value="NOT_STARTED">Not Started (—)</option>
              <option value="OVERDUE">Overdue (!)</option>
            </select>

            {/* Progress Range Filter */}
            <select
              value={progressRange}
              onChange={(e) => setProgressRange(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Progress: All</option>
              <option value="0">0% (Not Started)</option>
              <option value="1-25">1% – 25%</option>
              <option value="26-50">26% – 50%</option>
              <option value="51-75">51% – 75%</option>
              <option value="76-99">76% – 99%</option>
              <option value="100">100% Completed</option>
            </select>

            {/* Show All Book Students Toggle (Section 145) */}
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={includeAllBookStudents}
                onChange={(e) => setIncludeAllBookStudents(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>All Book Students</span>
            </label>

            {/* Export and Print (Section 160 & 161) */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
              title="Print teacher report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 138, 139, 140: THE PRIMARY SPREADSHEET MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loadingMatrix ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Loading consolidated chapter matrix...
            </p>
          </div>
        ) : !matrixData || matrixData.students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No student records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No students are currently assigned to exercises under this chapter. Click "Assign
              Exercise" above to assign work to students, or enable "All Book Students".
            </p>
            <button
              onClick={() => handleOpenAssignModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Assign First Exercise</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              {/* Sticky Header Row */}
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider sticky top-0 z-20">
                  {/* Sticky First Column: Student Profile (Section 156) */}
                  <th
                    className="p-3.5 sticky left-0 bg-slate-50 z-30 border-r border-slate-200 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("name")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Student</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 min-w-[70px] text-center border-r border-slate-200">
                    Class
                  </th>

                  {/* Dynamic Exercise Columns (Section 143) */}
                  {matrixData.exercises.map((ex: any, idx: number) => (
                    <th
                      key={ex.id}
                      className="p-3.5 min-w-[130px] border-r border-slate-200 text-center cursor-pointer hover:bg-indigo-50/50 hover:text-indigo-700 transition-all"
                      onClick={() => handleHeaderSort(`ex_${ex.id}`)}
                      title={`Click to sort by ${ex.name}`}
                    >
                      <div className="font-black text-slate-800">
                        {ex.exerciseNumber || `Ex ${idx + 1}`}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold normal-case truncate max-w-[120px] mx-auto">
                        {ex.totalQuestions} Questions
                      </div>
                    </th>
                  ))}

                  {/* Question-Weighted Overall Column (Section 151) */}
                  <th
                    className="p-3.5 min-w-[120px] text-center border-r border-slate-200 cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("overall")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Overall</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Primary Status Column */}
                  <th className="p-3.5 min-w-[110px] text-center border-r border-slate-200">
                    Status
                  </th>

                  {/* Last Updated Column */}
                  <th
                    className="p-3.5 min-w-[110px] text-center cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("lastUpdated")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Updated</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 font-medium">
                {matrixData.students.map((student: any) => {
                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Sticky Student Column (Section 141) */}
                      <td
                        className="p-3.5 sticky left-0 bg-white group-hover:bg-indigo-50/40 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer"
                        onClick={() => setSelectedStudentDrawer(student)}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatarUrl}
                            alt={student.studentName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-xs flex items-center gap-1.5">
                              <span>{student.studentName}</span>
                              {student.needsAttention && (
                                <span
                                  className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                                  title={student.attentionReasons?.join(", ")}
                                />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              Roll: {student.rollNo} • {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="p-3.5 text-center text-slate-600 border-r border-slate-200 text-xs font-semibold">
                        {student.classGrade.replace("Class ", "")}-{student.section}
                      </td>

                      {/* Dynamic Exercise Cells (Section 139 & 140) */}
                      {student.exercises.map((cell: any) => {
                        const isNotAssigned = !cell.assigned;
                        const isCompleted = cell.exerciseStatus === "COMPLETED";
                        const isInProgress = cell.exerciseStatus === "IN_PROGRESS";
                        const isNotStarted = cell.exerciseStatus === "NOT_STARTED";
                        const isOverdue = cell.isOverdue;

                        return (
                          <td
                            key={cell.exerciseId}
                            className="p-2.5 border-r border-slate-200 text-center align-middle hover:bg-indigo-100/50 cursor-pointer transition-colors"
                            onClick={() =>
                              cell.assigned
                                ? setSelectedExerciseDrawer({ student, cell })
                                : handleOpenAssignModal(cell.exerciseId)
                            }
                            title={
                              cell.assigned
                                ? "Click to view exercise details or override progress"
                                : "Not assigned — Click to assign"
                            }
                          >
                            {isNotAssigned ? (
                              <div className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100/80">
                                Not Assigned
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {/* Questions fraction + status icon */}
                                <div className="flex items-center gap-1 text-xs font-black">
                                  <span
                                    className={
                                      isCompleted
                                        ? "text-emerald-700"
                                        : isInProgress
                                        ? "text-slate-800"
                                        : isOverdue
                                        ? "text-rose-700"
                                        : "text-slate-500"
                                    }
                                  >
                                    {cell.questionsCompleted}/{cell.totalQuestions}
                                  </span>

                                  {isCompleted && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  {isInProgress && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                  )}
                                  {isNotStarted && (
                                    <span className="text-slate-400 font-bold text-xs">—</span>
                                  )}
                                  {isOverdue && (
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  )}
                                </div>

                                {/* Percentage Badge */}
                                <div
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isInProgress
                                      ? "bg-amber-100 text-amber-800"
                                      : isOverdue
                                      ? "bg-rose-100 text-rose-800 font-extrabold"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {isOverdue ? "OVERDUE" : `${cell.percentage}%`}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Overall Progress Column (Section 151) */}
                      <td className="p-3.5 border-r border-slate-200 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="text-xs font-black text-slate-900">
                            {student.overallProgress}%
                          </div>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.overallProgress === 100
                                  ? "bg-emerald-500"
                                  : student.overallProgress >= 70
                                  ? "bg-indigo-600"
                                  : student.overallProgress >= 40
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${student.overallProgress}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">
                            {student.totalCompletedQuestions}/{student.totalAssignedQuestions} Qs
                          </div>
                        </div>
                      </td>

                      {/* Primary Status Column (Section 140) */}
                      <td className="p-3.5 border-r border-slate-200 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            student.primaryStatus === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : student.primaryStatus === "OVERDUE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : student.primaryStatus === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : student.primaryStatus === "NOT_STARTED"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-slate-50 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {student.primaryStatus === "COMPLETED" && (
                            <Check className="w-3 h-3 text-emerald-600" />
                          )}
                          {student.primaryStatus === "OVERDUE" && (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          )}
                          {student.primaryStatus.replace("_", " ")}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="p-3.5 text-center text-[10px] text-slate-500">
                        {student.lastUpdated
                          ? new Date(student.lastUpdated).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 141: STUDENT DETAIL DRAWER (Clicking a Student Row) */}
      {selectedStudentDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentDrawer.avatarUrl}
                  alt={selectedStudentDrawer.studentName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedStudentDrawer.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Class {selectedStudentDrawer.classGrade} • Sec {selectedStudentDrawer.section} •
                    Roll #{selectedStudentDrawer.rollNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDrawer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context breadcrumb */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Chapter:</span>{" "}
              <span className="text-indigo-700 font-bold">{matrixData.chapter?.name}</span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Book: {matrixData.book?.name} ({matrixData.book?.exam || matrixData.book?.curriculumType})
              </div>
            </div>

            {/* Student Progress Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-[10px] font-bold uppercase text-indigo-500">
                  Overall Progress
                </div>
                <div className="text-xl font-black text-indigo-700 mt-1">
                  {selectedStudentDrawer.overallProgress}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-400">Questions Solved</div>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {selectedStudentDrawer.totalCompletedQuestions}/
                  {selectedStudentDrawer.totalAssignedQuestions}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-400">Status</div>
                <div className="text-xs font-black text-slate-800 mt-2 uppercase">
                  {selectedStudentDrawer.primaryStatus.replace("_", " ")}
                </div>
              </div>
            </div>

            {/* Attention notices if any */}
            {selectedStudentDrawer.needsAttention && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800">
                  <div className="font-bold">Needs Attention:</div>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {selectedStudentDrawer.attentionReasons?.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Exercise Breakdown List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Exercises Under This Chapter
              </h4>
              <div className="space-y-2">
                {selectedStudentDrawer.exercises.map((cell: any) => (
                  <div
                    key={cell.exerciseId}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">
                        {cell.exerciseNumber} — {cell.exerciseName}
                      </div>
                      {cell.assigned ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cell.exerciseStatus === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : cell.isOverdue
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {cell.isOverdue ? "OVERDUE" : cell.exerciseStatus.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Not Assigned
                        </span>
                      )}
                    </div>

                    {cell.assigned && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>
                            Questions: {cell.questionsCompleted} / {cell.totalQuestions}
                          </span>
                          <span className="font-black text-indigo-600">{cell.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${cell.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Due: {cell.dueDate ? new Date(cell.dueDate).toLocaleDateString() : "—"}</span>
                          <button
                            onClick={() => {
                              setSelectedExerciseDrawer({ student: selectedStudentDrawer, cell });
                            }}
                            className="text-indigo-600 hover:underline font-bold"
                          >
                            Inspect & Override →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedStudentDrawer(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 142: EXERCISE CELL DETAIL & OVERRIDE DRAWER */}
      {selectedExerciseDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Exercise Details
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedExerciseDrawer.cell.exerciseName}
                </h3>
                <p className="text-xs text-slate-500">
                  Student:{" "}
                  <span className="font-bold text-slate-700">
                    {selectedExerciseDrawer.student.studentName}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedExerciseDrawer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions KPI Box */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Questions</div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {selectedExerciseDrawer.cell.totalQuestions}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="text-[10px] font-bold text-indigo-500 uppercase">Completed</div>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {selectedExerciseDrawer.cell.questionsCompleted}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining</div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {Math.max(
                    0,
                    selectedExerciseDrawer.cell.totalQuestions -
                      selectedExerciseDrawer.cell.questionsCompleted
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Calculated Progress</span>
                <span className="text-indigo-600 font-black text-sm">
                  {selectedExerciseDrawer.cell.percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${selectedExerciseDrawer.cell.percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500">
                <div>
                  <span className="font-semibold text-slate-400">Due Date: </span>
                  <span className="font-bold text-slate-700">
                    {selectedExerciseDrawer.cell.dueDate
                      ? new Date(selectedExerciseDrawer.cell.dueDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Last Update: </span>
                  <span className="font-bold text-slate-700">
                    {selectedExerciseDrawer.cell.lastUpdated
                      ? new Date(selectedExerciseDrawer.cell.lastUpdated).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Progress Attempt History
              </h4>
              {selectedExerciseDrawer.cell.history?.length > 0 ? (
                <div className="space-y-2 border-l-2 border-indigo-200 pl-3">
                  {selectedExerciseDrawer.cell.history.map((h: any) => (
                    <div key={h.id} className="text-xs text-slate-600">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>
                          {h.questionsCompleted} / {h.totalQuestions} questions ({h.percentage}%)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {h.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{h.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No historical updates recorded yet.</p>
              )}
            </div>

            {/* Administrative Override Action Button (Section 147) */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={handleOpenOverride}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Administrative Teacher Override</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Note: Modifications are strictly tracked in system audit logs with teacher attribution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 147: TEACHER / ADMIN OVERRIDE MODAL */}
      {isOverrideModalOpen && selectedExerciseDrawer && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Teacher Progress Override
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-amber-900">
                Student: {selectedExerciseDrawer.student.studentName}
              </div>
              <div className="text-[11px] text-amber-800">
                Exercise: {selectedExerciseDrawer.cell.exerciseName}
              </div>
              <div className="text-[11px] text-slate-500">
                Current in DB: {selectedExerciseDrawer.cell.questionsCompleted} /{" "}
                {selectedExerciseDrawer.cell.totalQuestions} questions (
                {selectedExerciseDrawer.cell.percentage}%)
              </div>
            </div>

            {/* Slider & Stepper */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>New Questions Completed:</span>
                <span className="text-base font-black text-indigo-600">
                  {overrideQuestions} / {selectedExerciseDrawer.cell.totalQuestions} (
                  {Math.round(
                    (overrideQuestions / selectedExerciseDrawer.cell.totalQuestions) * 100
                  )}
                  %)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={selectedExerciseDrawer.cell.totalQuestions}
                value={overrideQuestions}
                onChange={(e) => setOverrideQuestions(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Mandatory Reason Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Override Reason (Mandatory for Audit Logs):
              </label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Verified from physical notebook during class session..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {overrideFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{overrideFeedback}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteOverride}
                disabled={isSubmittingOverride}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingOverride ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm Override</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 146: QUICK ASSIGN EXERCISE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Quick Assign Exercise
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Exercise
              </label>
              <select
                value={assignExerciseId}
                onChange={(e) => setAssignExerciseId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {matrixData?.exercises?.map((ex: any) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exerciseNumber} — {ex.name} ({ex.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Students ({assignStudentIds.length} chosen)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (assignStudentIds.length === matrixData?.students?.length) {
                      setAssignStudentIds([]);
                    } else {
                      setAssignStudentIds(matrixData?.students?.map((s: any) => s.studentId) || []);
                    }
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  {assignStudentIds.length === matrixData?.students?.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {matrixData?.students?.map((stu: any) => {
                  const isChecked = assignStudentIds.includes(stu.studentId);
                  return (
                    <label
                      key={stu.studentId}
                      className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignStudentIds([...assignStudentIds, stu.studentId]);
                          } else {
                            setAssignStudentIds(
                              assignStudentIds.filter((id) => id !== stu.studentId)
                            );
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-slate-800">{stu.studentName}</span>
                      <span className="text-[10px] text-slate-400">
                        (Roll: {stu.rollNo} • Sec {stu.section})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teacher Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={assignInstructions}
                onChange={(e) => setAssignInstructions(e.target.value)}
                placeholder="e.g., Solve all problems in homework notebook..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAssign}
                disabled={isAssigning}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAssigning ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Assign to {assignStudentIds.length} Student(s)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
