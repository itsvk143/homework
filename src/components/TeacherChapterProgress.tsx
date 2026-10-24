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
  FileText,
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

  // View Mode: "all" (All Chapters) vs "single" (Single Chapter)
  const [viewMode, setViewMode] = useState<"all" | "single">("all");

  // Dependent Filter Selectors
  const [selectedExam, setSelectedExam] = useState<string>("NEET");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // Matrix Data state (supports both single chapter and all-chapters modes)
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
  const [assignChapterId, setAssignChapterId] = useState("");
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

  // Favorites / Bookmarks
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
        setFavorites([
          {
            id: "fav-1",
            exam: "NEET",
            subjectName: "Chemistry",
            bookId: "",
            bookName: "Narendra Avasthi",
            chapterId: "",
            chapterName: "Some Basic Concepts of Chemistry and Concentration Terms",
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
            targetBook =
              books.find((b: any) => b.bookCode === "NEET_CHEMISTRY_PHYSICAL_NARENDRA_AVASTHI") ||
              books.find((b: any) => b.bookCode === "NEET_CHEMISTRY_ORGANIC_MS_CHOUHAN") ||
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

  const availableSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { id: string; name: string }>();
    allBooks
      .filter((b) => (b.exam || b.curriculumType) === selectedExam)
      .forEach((b) => {
        if (b.subject && !subjectsMap.has(b.subject.id)) {
          subjectsMap.set(b.subject.id, { id: b.subject.id, name: b.subject.name });
        }
      });
    return Array.from(subjectsMap.values());
  }, [allBooks, selectedExam]);

  const booksForSubject = useMemo(() => {
    return allBooks.filter(
      (b) =>
        (b.exam || b.curriculumType) === selectedExam &&
        (!selectedSubjectId || b.subjectId === selectedSubjectId)
    );
  }, [allBooks, selectedExam, selectedSubjectId]);

  const selectedBookObj = useMemo(() => {
    return allBooks.find((b) => b.id === selectedBookId) || null;
  }, [allBooks, selectedBookId]);

  const availableChapters = useMemo(() => {
    if (matrixData?.availableChapters?.length > 0) {
      return matrixData.availableChapters;
    }
    return selectedBookObj?.chapters || [];
  }, [selectedBookObj, matrixData]);

  // Cascade resets
  const handleExamChange = (newExam: string) => {
    setSelectedExam(newExam);
    const validBooks = allBooks.filter((b) => (b.exam || b.curriculumType) === newExam);
    if (validBooks.length > 0) {
      const firstBook = validBooks[0];
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

  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const validBooks = allBooks.filter(
      (b) => (b.exam || b.curriculumType) === selectedExam && b.subjectId === newSubId
    );
    if (validBooks.length > 0) {
      setSelectedBookId(validBooks[0].id);
      if (validBooks[0].chapters?.length > 0) {
        setSelectedChapterId(validBooks[0].chapters[0].id);
      } else {
        setSelectedChapterId("");
      }
    } else {
      setSelectedBookId("");
      setSelectedChapterId("");
    }
  };

  const handleBookChange = (newBookId: string) => {
    setSelectedBookId(newBookId);
    const book = allBooks.find((b) => b.id === newBookId);
    if (book && book.chapters?.length > 0) {
      setSelectedChapterId(book.chapters[0].id);
    } else {
      setSelectedChapterId("");
    }
  };

  // Main API data fetcher supporting both All Chapters and Single Chapter modes
  const loadMatrix = async () => {
    if (!selectedBookId) return;
    if (viewMode === "single" && !selectedChapterId) return;

    setLoadingMatrix(true);
    try {
      const params = new URLSearchParams({
        bookId: selectedBookId,
        mode: viewMode,
        includeAllBookStudents: includeAllBookStudents ? "true" : "false",
      });
      if (viewMode === "single" && selectedChapterId) {
        params.set("chapterId", selectedChapterId);
      }
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
        console.error("Failed to fetch chapter progress matrix");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Trigger matrix fetch on key selector changes or filters
  useEffect(() => {
    if (selectedBookId) {
      if (viewMode === "all" || (viewMode === "single" && selectedChapterId)) {
        loadMatrix();
      }
    }
  }, [
    selectedBookId,
    selectedChapterId,
    viewMode,
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
      if (selectedBookId) {
        if (viewMode === "all" || (viewMode === "single" && selectedChapterId)) {
          loadMatrix();
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Bookmark Chapter / View
  const isCurrentBookmarked = useMemo(() => {
    return favorites.some((f) => f.bookId === selectedBookId && (viewMode === "all" || f.chapterId === selectedChapterId));
  }, [favorites, selectedBookId, selectedChapterId, viewMode]);

  const toggleBookmark = () => {
    if (!selectedBookObj) return;
    const currentChapter = availableChapters.find((c: any) => c.id === selectedChapterId);
    let updated;
    if (isCurrentBookmarked) {
      updated = favorites.filter((f) => !(f.bookId === selectedBookId));
    } else {
      updated = [
        ...favorites,
        {
          id: `fav-${Date.now()}`,
          exam: selectedExam,
          subjectName: selectedBookObj.subject?.name || "Subject",
          bookId: selectedBookId,
          bookName: selectedBookObj.name,
          chapterId: selectedChapterId || "",
          chapterName: viewMode === "all" ? "All Chapters" : (currentChapter?.name || "Chapter"),
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
        if (fav.chapterId) {
          setSelectedChapterId(fav.chapterId);
          setViewMode("single");
        } else {
          setViewMode("all");
        }
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
        setViewMode("single");
      }
    }
  };

  // Quick Assign from Dashboard
  const handleOpenAssignModal = (chapterId?: string, exerciseId?: string) => {
    const chId = chapterId || selectedChapterId || availableChapters[0]?.id || "";
    setAssignChapterId(chId);

    if (exerciseId) {
      setAssignExerciseId(exerciseId);
    } else {
      const chObj = availableChapters.find((c: any) => c.id === chId);
      if (chObj?.exercises?.length > 0) {
        setAssignExerciseId(chObj.exercises[0].id);
      } else if (matrixData?.exercises?.length > 0) {
        setAssignExerciseId(matrixData.exercises[0].id);
      }
    }

    // Pre-select student IDs from matrix
    if (matrixData?.students) {
      setAssignStudentIds(matrixData.students.map((s: any) => s.studentId));
    } else if (matrixData?.chapters?.[0]?.students) {
      setAssignStudentIds(matrixData.chapters[0].students.map((s: any) => s.studentId));
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
          chapterId: assignChapterId || selectedChapterId,
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

  // Teacher / Admin Override
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

  // Export Matrix (CSV)
  const handleExportCSV = () => {
    if (!matrixData) return;

    if (matrixData.mode === "all" && matrixData.chapters) {
      const rows: string[] = [];
      const headers = [
        "Chapter",
        "Student Name",
        "Class",
        "Roll No",
        "Questions Completed",
        "Total Questions",
        "Chapter Progress %",
        "Status",
        "Last Updated",
      ];

      matrixData.chapters.forEach((chData: any) => {
        chData.students.forEach((s: any) => {
          rows.push(
            [
              `"Ch ${chData.chapter.chapterNumber}: ${chData.chapter.name}"`,
              `"${s.studentName}"`,
              `"${s.classGrade}-${s.section}"`,
              `"${s.rollNo}"`,
              s.totalCompletedQuestions,
              s.totalAssignedQuestions,
              `${s.overallProgress}%`,
              `"${s.primaryStatus}"`,
              `"${s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : "—"}"`,
            ].join(",")
          );
        });
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `All_Chapters_Progress_${(matrixData.book?.name || "Book").replace(/[^a-zA-Z0-9]/g, "_")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!matrixData.students) return;

    const headers = [
      "Student Name",
      "Class",
      "Section",
      "Roll No",
      ...(matrixData.exercises || []).map((e: any) => `${e.exerciseNumber} (${e.totalQuestions} Q)`),
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
      `Chapter_Progress_${(matrixData.chapter?.name || "Chapter").replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleHeaderSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  // =========================================================================
  // SUBCOMPONENT: Individual Chapter Matrix Table
  // =========================================================================
  const renderChapterTable = (
    chData: {
      chapter: any;
      exercises: any[];
      students: any[];
      stats: any;
    },
    isStacked: boolean = false
  ) => {
    const { chapter, exercises, students, stats } = chData;

    return (
      <div
        key={chapter.id}
        id={`chapter-table-${chapter.id}`}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all scroll-mt-24"
      >
        {/* Chapter Header Card (especially valuable in All Chapters mode) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] tracking-wide uppercase">
                Ch. {chapter.chapterNumber}
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {chapter.name}
              </h3>
            </div>
            {chapter.description && (
              <p className="text-[11px] text-slate-500 line-clamp-1">{chapter.description}</p>
            )}
          </div>

          {/* Compact chapter status metrics pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 text-[11px] shadow-2xs">
              <span className="text-indigo-600 font-black">{exercises?.length || 0}</span> Exercises
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 text-[11px] shadow-2xs">
              <span className="text-slate-900 font-black">{stats?.totalAssignedStudents || 0}</span> Students
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] shadow-2xs">
              <span className="font-black">{stats?.averageProgress || 0}%</span> Avg
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-700 font-bold text-[11px] hidden sm:inline-flex">
              ✓ {stats?.completedStudents || 0} Done
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-700 font-bold text-[11px] hidden sm:inline-flex">
              ● {stats?.inProgressStudents || 0} In Progress
            </div>

            {(stats?.overdueStudents || 0) > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-[11px] animate-pulse">
                ! {stats.overdueStudents} Overdue
              </div>
            )}

            <button
              onClick={() => handleOpenAssignModal(chapter.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 shadow-2xs transition-all ml-auto md:ml-0"
              title="Assign exercise from this chapter"
            >
              <Plus className="w-3 h-3" />
              <span>Assign</span>
            </button>
          </div>
        </div>

        {/* Dynamic Exercise Columns Table */}
        {!students || students.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No students found for this chapter</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No students matching "${searchQuery}" in this chapter.`
                : "No students are currently assigned exercises in this chapter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider sticky top-0 z-20">
                  {/* Sticky First Column: Student Profile */}
                  <th
                    className="p-3.5 sticky left-0 bg-slate-50 z-30 border-r border-slate-200 min-w-[190px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("name")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Student Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 min-w-[65px] text-center border-r border-slate-200">
                    Class
                  </th>

                  {/* Dynamically Generated Exercise Columns */}
                  {exercises.map((ex: any, idx: number) => (
                    <th
                      key={ex.id}
                      className="p-3 min-w-[125px] border-r border-slate-200 text-center cursor-pointer hover:bg-indigo-50/50 hover:text-indigo-700 transition-all"
                      onClick={() => handleHeaderSort(`ex_${ex.id}`)}
                      title={`Click to sort by ${ex.name}`}
                    >
                      <div className="font-black text-slate-800 truncate">
                        {ex.exerciseNumber || `Ex ${idx + 1}`}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold normal-case truncate max-w-[120px] mx-auto">
                        {ex.name}
                      </div>
                      <div className="text-[9px] text-indigo-600 font-bold mt-0.5">
                        {ex.totalQuestions} Qs
                      </div>
                    </th>
                  ))}

                  {/* Overall Column */}
                  <th
                    className="p-3.5 min-w-[110px] text-center border-r border-slate-200 cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("overall")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Overall</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* Status Column */}
                  <th className="p-3.5 min-w-[100px] text-center border-r border-slate-200">
                    Status
                  </th>

                  {/* Last Updated Column */}
                  <th
                    className="p-3.5 min-w-[95px] text-center cursor-pointer hover:text-indigo-600"
                    onClick={() => handleHeaderSort("lastUpdated")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Updated</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((student: any) => {
                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Sticky Student Column */}
                      <td
                        className="p-3 sticky left-0 bg-white group-hover:bg-indigo-50/40 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer"
                        onClick={() => setSelectedStudentDrawer(student)}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={student.avatarUrl}
                            alt={student.studentName}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-xs flex items-center gap-1">
                              <span>{student.studentName}</span>
                              {student.needsAttention && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                                  title={student.attentionReasons?.join(", ")}
                                />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              Roll: {student.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="p-3 text-center text-slate-600 border-r border-slate-200 text-xs font-semibold whitespace-nowrap">
                        {student.classGrade.replace("Class ", "")}-{student.section}
                      </td>

                      {/* Dynamic Exercise Cells */}
                      {student.exercises.map((cell: any) => {
                        const isNotAssigned = !cell.assigned;
                        const isCompleted = cell.exerciseStatus === "COMPLETED";
                        const isInProgress = cell.exerciseStatus === "IN_PROGRESS";
                        const isNotStarted = cell.exerciseStatus === "NOT_STARTED";
                        const isOverdue = cell.isOverdue;
                        const isNeedsReview = cell.needsReview;
                        const completedLate = cell.completedLate;

                        let statusBadgeText = "Pending";
                        let statusBadgeClass = "bg-slate-100 text-slate-600 border border-slate-200";

                        if (isOverdue) {
                          statusBadgeText = "Overdue";
                          statusBadgeClass = "bg-rose-50 text-rose-700 border border-rose-200 font-bold";
                        } else if (isNeedsReview) {
                          statusBadgeText = "Needs Review";
                          statusBadgeClass = "bg-sky-50 text-sky-700 border border-sky-200 font-bold";
                        } else if (isCompleted) {
                          statusBadgeText = completedLate ? "Completed (Late)" : "Completed";
                          statusBadgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold";
                        } else if (isInProgress) {
                          statusBadgeText = `In Progress (${cell.percentage}%)`;
                          statusBadgeClass = "bg-amber-50 text-amber-700 border border-amber-200 font-bold";
                        } else if (isNotStarted) {
                          statusBadgeText = "Pending";
                          statusBadgeClass = "bg-slate-100 text-slate-600 border border-slate-200 font-semibold";
                        }

                        return (
                          <td
                            key={cell.exerciseId}
                            className="p-2 border-r border-slate-200 text-center align-middle hover:bg-indigo-100/50 cursor-pointer transition-colors"
                            onClick={() =>
                              cell.assigned
                                ? setSelectedExerciseDrawer({ student, cell })
                                : handleOpenAssignModal(chapter.id, cell.exerciseId)
                            }
                            title={
                              cell.assigned
                                ? `Click to view ${student.studentName}'s details for ${cell.exerciseNumber}`
                                : "Not assigned — Click to assign"
                            }
                          >
                            {isNotAssigned ? (
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 bg-slate-100/80 border border-slate-200/50">
                                Not Assigned
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
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
                                  {isNeedsReview && !isCompleted && (
                                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                                  )}
                                  {isNotStarted && (
                                    <span className="text-slate-400 font-bold text-xs">—</span>
                                  )}
                                  {isOverdue && (
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  )}
                                </div>

                                <div
                                  className={`px-1.5 py-0.5 rounded text-[9px] ${statusBadgeClass}`}
                                >
                                  {statusBadgeText}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Overall Progress Column */}
                      <td className="p-3 border-r border-slate-200 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="text-xs font-black text-slate-900">
                            {student.overallProgress}%
                          </div>
                          <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
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

                      {/* Primary Status Column */}
                      <td className="p-3 border-r border-slate-200 text-center">
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
                      <td className="p-3 text-center text-[10px] text-slate-500 whitespace-nowrap">
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
    );
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="text-xl font-black text-slate-900">
          {matrixData?.book?.exam || "ACADEMIC"} PROGRESS REPORT — BOOK & CHAPTER MATRIX
        </div>
        <div className="text-sm font-semibold text-slate-700 mt-1">
          {matrixData?.book?.name} • {matrixData?.book?.branch || matrixData?.book?.subject?.name}
        </div>
        <div className="text-base font-bold text-indigo-700 mt-1">
          Mode: {viewMode === "all" ? "All Chapters Summary" : `Chapter: ${matrixData?.chapter?.name}`}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>Teacher: {currentUser?.name || "Teacher"}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* FILTER PANEL: Book Selector & View Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 print:hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Book-Wise Homework Tracking
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                  {viewMode === "all" ? "All Chapters View" : "Single Chapter View"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track real student homework updates and exercise completion across all chapters
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: All Chapters vs Single Chapter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "all"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="View every chapter's student-by-exercise table stacked on one continuous scrollable page"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Chapters</span>
              </button>
              <button
                onClick={() => setViewMode("single")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "single"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="View one selected chapter's student-by-exercise table"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Single Chapter</span>
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isCurrentBookmarked
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Bookmark this view"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isCurrentBookmarked ? "text-amber-500 fill-amber-500" : "text-slate-400"
                }`}
              />
              <span>{isCurrentBookmarked ? "Bookmarked" : "Bookmark View"}</span>
            </button>

            {/* Refresh */}
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

        {/* Saved views strip */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
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
                  {fav.bookName} → {fav.chapterName.slice(0, 24)}...
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Cascading Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
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

          {/* 3. Book Selector (Prominent requirement) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center justify-between">
              <span>3. Select Book</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {booksForSubject.length} Books
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                disabled={booksForSubject.length === 0}
                className="w-full appearance-none bg-indigo-50/30 hover:bg-white border border-indigo-200 hover:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-8 disabled:opacity-50 truncate"
              >
                {booksForSubject.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.author ? `(${b.author})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Chapter Selector (Enabled in Single Chapter mode, informative in All Chapters) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              4. Chapter {viewMode === "all" ? "(Showing All)" : "(Selected)"}
            </label>
            <div className="relative">
              {viewMode === "all" ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>All {availableChapters.length} Chapters Stacked</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 font-extrabold text-slate-700">
                    Continuous
                  </span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOOK-LEVEL SUMMARY BANNER (Shown in All Chapters mode, or at top of book) */}
      {matrixData && viewMode === "all" && matrixData.bookSummary && (
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
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{matrixData.book?.name}</span>
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>All Chapters Overview •</span>
                {selectedBookObj?.author && (
                  <span className="text-slate-400">By {selectedBookObj.author}</span>
                )}
                <span className="text-indigo-400 font-bold">
                  ({matrixData.bookSummary.totalChapters} Chapters • {matrixData.bookSummary.totalExercises} Exercises)
                </span>
              </p>
            </div>

            {/* Overall Book Progress Gauge */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Overall Book Completion</span>
                <span className="text-emerald-400 text-sm font-black">
                  {matrixData.bookSummary.overallProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${matrixData.bookSummary.overallProgress || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span>
                  {matrixData.bookSummary.completedTasks} of {matrixData.bookSummary.totalAssignedTasks} tasks finished
                </span>
                <span>{matrixData.bookSummary.totalQuestions?.toLocaleString()} Questions</span>
              </div>
            </div>
          </div>

          {/* Book KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-5 border-t border-white/10 print:text-black">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chapters
              </div>
              <div className="text-xl font-black text-white mt-1">
                {matrixData.bookSummary.totalChapters}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Exercises
              </div>
              <div className="text-xl font-black text-indigo-400 mt-1">
                {matrixData.bookSummary.totalExercises}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Questions
              </div>
              <div className="text-xl font-black text-white mt-1">
                {matrixData.bookSummary.totalQuestions?.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Students
              </div>
              <div className="text-xl font-black text-white mt-1">
                {matrixData.bookSummary.studentCount}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ✓ Completed
              </div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {matrixData.bookSummary.completedTasks}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ● In Progress
              </div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {matrixData.bookSummary.inProgressTasks}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                — Pending
              </div>
              <div className="text-xl font-black text-slate-400 mt-1">
                {matrixData.bookSummary.pendingTasks}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ! Overdue
              </div>
              <div className="text-xl font-black text-rose-400 mt-1">
                {matrixData.bookSummary.overdueTasks}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE CHAPTER SUMMARY HEADER (When in Single Chapter Mode) */}
      {matrixData && viewMode === "single" && matrixData.chapter && (
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
                Ch {matrixData.chapter?.chapterNumber}: {matrixData.chapter?.name}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>Book:</span>
                <span className="font-semibold text-white">{matrixData.book?.name}</span>
                {selectedBookObj?.author && (
                  <span className="text-slate-400">by {selectedBookObj.author}</span>
                )}
              </p>
            </div>

            {/* Average Student Progress */}
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

      {/* SINGLE CHAPTER: Exercise Performance Breakdown Strip */}
      {viewMode === "single" && matrixData?.stats?.exercisePerformance?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 print:hidden">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Chapter Summary By Exercise</span>
            </h3>
            <button
              onClick={() => handleOpenAssignModal(selectedChapterId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Exercise to Students</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {matrixData.stats.exercisePerformance.map((perf: any) => (
              <div
                key={perf.exerciseId}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer"
                onClick={() => handleOpenAssignModal(selectedChapterId, perf.exerciseId)}
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

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Student Search: Across all chapter tables in All Chapters mode */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                viewMode === "all"
                  ? "Search students across all chapters..."
                  : "Search student by name, roll no, or email..."
              }
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
            {/* Needs Attention Filter */}
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
              <option value="NOT_STARTED">Pending (—)</option>
              <option value="OVERDUE">Overdue (!)</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="NOT_ASSIGNED">Not Assigned</option>
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

            {/* All Book Students Checkbox */}
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={includeAllBookStudents}
                onChange={(e) => setIncludeAllBookStudents(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="whitespace-nowrap">All Book Students</span>
            </label>

            {/* CSV Export & Print */}
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
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loadingMatrix && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            {viewMode === "all"
              ? "Loading all chapters and student exercise matrix..."
              : "Loading chapter progress matrix..."}
          </p>
        </div>
      )}

      {/* MATRIX DISPLAY: ALL CHAPTERS VS SINGLE CHAPTER */}
      {!loadingMatrix && matrixData && (
        <>
          {viewMode === "all" && matrixData.chapters ? (
            <div className="space-y-6">
              {/* Quick Jump Chapter Bar */}
              {matrixData.chapters.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center gap-2 overflow-x-auto print:hidden">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick Jump:</span>
                  </span>
                  {matrixData.chapters.map((chMatrix: any) => {
                    const hasDone = (chMatrix.stats?.completedStudents || 0) > 0;
                    const hasInProgress = (chMatrix.stats?.inProgressStudents || 0) > 0;
                    const hasActivity = hasDone || hasInProgress;

                    return (
                      <button
                        key={chMatrix.chapter.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`chapter-table-${chMatrix.chapter.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          hasActivity
                            ? "bg-indigo-50/90 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={`Ch ${chMatrix.chapter.chapterNumber}: ${chMatrix.chapter.name} (${hasActivity ? "Active homework updates" : "No assignments yet"})`}
                      >
                        <span>Ch. {chMatrix.chapter.chapterNumber}</span>
                        {hasDone && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white">
                            ✓ {chMatrix.stats.completedStudents}
                          </span>
                        )}
                        {hasInProgress && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500 text-white">
                            ● {chMatrix.stats.inProgressStudents}
                          </span>
                        )}
                        {!hasActivity && (
                          <span className="text-[10px] text-slate-400 font-normal">0 tasks</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {matrixData.chapters.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No chapters found</div>
                  <p className="text-xs text-slate-400">
                    This book does not have any chapters configured yet.
                  </p>
                </div>
              ) : (
                matrixData.chapters.map((chMatrix: any) =>
                  renderChapterTable(chMatrix, true)
                )
              )}
            </div>
          ) : viewMode === "single" && matrixData.chapter ? (
            <div>
              {renderChapterTable({
                chapter: matrixData.chapter,
                exercises: matrixData.exercises || [],
                students: matrixData.students || [],
                stats: matrixData.stats || {},
              })}
            </div>
          ) : null}
        </>
      )}

      {/* STUDENT DETAIL DRAWER */}
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

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Book:</span>{" "}
              <span className="text-indigo-700 font-bold">{matrixData?.book?.name}</span>
            </div>

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

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Assigned Exercises
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
                              setSelectedStudentDrawer(null);
                              setSelectedExerciseDrawer({ student: selectedStudentDrawer, cell });
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Details & History →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE DETAIL DRAWER */}
      {selectedExerciseDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Exercise Details
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedExerciseDrawer.cell.exerciseNumber} — {selectedExerciseDrawer.cell.exerciseName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExerciseDrawer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-800">
                Student: {selectedExerciseDrawer.student.studentName}
              </div>
              <div className="text-[11px] text-slate-500">
                Book: {matrixData?.book?.name}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Questions Solved</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {selectedExerciseDrawer.cell.questionsCompleted} /{" "}
                    {selectedExerciseDrawer.cell.totalQuestions}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Status</div>
                  <div className="text-xs font-black uppercase mt-2">
                    {selectedExerciseDrawer.cell.isOverdue
                      ? "OVERDUE"
                      : selectedExerciseDrawer.cell.exerciseStatus.replace("_", " ")}
                  </div>
                </div>
              </div>

              {selectedExerciseDrawer.cell.instructions && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  <div className="font-bold text-[11px] text-indigo-700">Teacher Instructions:</div>
                  <p className="mt-0.5">{selectedExerciseDrawer.cell.instructions}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-b border-slate-100 py-3">
                <span>Due Date:</span>
                <span className="font-bold text-slate-800">
                  {selectedExerciseDrawer.cell.dueDate
                    ? new Date(selectedExerciseDrawer.cell.dueDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <button
                onClick={handleOpenOverride}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-xs transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Teacher Override Question Count</span>
              </button>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Update History</span>
                </h4>
                {selectedExerciseDrawer.cell.history?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                    No incremental updates logged yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedExerciseDrawer.cell.history?.map((h: any) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            +{h.deltaQuestions} Qs ({h.questionsCompleted}/{h.totalQuestions})
                          </div>
                          {h.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{h.notes}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER OVERRIDE MODAL */}
      {isOverrideModalOpen && selectedExerciseDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Teacher Verified Override
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Directly adjust the completed question count for{" "}
              <strong className="text-slate-800">
                {selectedExerciseDrawer.student.studentName}
              </strong>{" "}
              on {selectedExerciseDrawer.cell.exerciseNumber}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verified Questions Completed (Max: {selectedExerciseDrawer.cell.totalQuestions}):
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedExerciseDrawer.cell.totalQuestions}
                  value={overrideQuestions}
                  onChange={(e) => setOverrideQuestions(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Audit Reason:
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Verified physically during classroom session..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {overrideFeedback && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold">
                  ✓ {overrideFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteOverride}
                  disabled={isSubmittingOverride}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs disabled:opacity-50"
                >
                  {isSubmittingOverride ? "Saving..." : "Apply Override"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Assign Exercise to Students
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Choose Chapter & Exercise:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={assignChapterId}
                    onChange={(e) => {
                      setAssignChapterId(e.target.value);
                      const ch = availableChapters.find((c: any) => c.id === e.target.value);
                      if (ch?.exercises?.length > 0) {
                        setAssignExerciseId(ch.exercises[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                  >
                    {availableChapters.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.chapterNumber}: {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={assignExerciseId}
                    onChange={(e) => setAssignExerciseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                  >
                    {(
                      availableChapters.find((c: any) => c.id === assignChapterId)?.exercises ||
                      matrixData?.exercises ||
                      []
                    ).map((ex: any) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.exerciseNumber || ex.name} ({ex.totalQuestions} Qs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Due Date:</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Instructions (Optional):
                </label>
                <textarea
                  rows={2}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="e.g. Complete Level 1 objective questions with working steps in notebook..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Assigning to <strong className="text-slate-800">{assignStudentIds.length}</strong> students
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAssign}
                    disabled={isAssigning}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 shadow-xs"
                  >
                    {isAssigning ? "Assigning..." : "Confirm & Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
