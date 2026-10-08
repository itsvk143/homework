"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  Users,
  Phone,
  Mail,
  BookOpen,
  ArrowRightLeft,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  School,
  Sparkles,
} from "lucide-react";

export function AdminTeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cb_cached_teachers");
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cb_cached_teachers");
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) return false;
        }
      } catch {}
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [convertingTeacher, setConvertingTeacher] = useState<any>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<any>(null);

  // Teacher-Student Assignment Modal state
  const [assigningTeacher, setAssigningTeacher] = useState<any>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [assignClassGrades, setAssignClassGrades] = useState<string[]>([]);
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState<string>("");
  const [assignGradeFilter, setAssignGradeFilter] = useState<string>("ALL");
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [savingAssignments, setSavingAssignments] = useState<boolean>(false);
  const [removingAssignmentIds, setRemovingAssignmentIds] = useState<string[]>([]);

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [convertData, setConvertData] = useState<any>({
    classGrade: "NEET Dropper",
    section: "A",
    rollNo: "",
    schoolName: "LV INSTITUTE",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const STANDARD_CLASSES = [
    "NEET Dropper",
    "JEE Dropper",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  const STANDARD_SUBJECTS = [
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Social Studies",
    "Hindi",
    "Computer Science",
  ];

  const fetchTeachers = async () => {
    try {
      if (teachers.length === 0) {
        setLoading(true);
      }
      const res = await fetch("/api/teachers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        let loaded = data.teachers || [];
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("cb_deleted_teacher_ids") || "[]";
            const deletedList: string[] = JSON.parse(raw);
            loaded = loaded.filter(
              (t: any) =>
                !deletedList.includes(t.id) &&
                !deletedList.includes(t.email?.toLowerCase()) &&
                t.email?.toLowerCase() !== "teacher@classboard.com" &&
                t.email?.toLowerCase() !== "verma@classboard.com"
            );
            localStorage.setItem("cb_cached_teachers", JSON.stringify(loaded));
          } catch {}
        }
        setTeachers(loaded);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Derive all distinct classes from subjects and students
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    STANDARD_CLASSES.forEach((c) => classSet.add(c));
    allSubjects.forEach((s) => {
      if (s.classGrade && s.classGrade.trim()) classSet.add(s.classGrade.trim());
    });
    allStudents.forEach((st) => {
      if (st.studentProfile?.classGrade && st.studentProfile.classGrade.trim()) {
        classSet.add(st.studentProfile.classGrade.trim());
      }
    });

    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [allSubjects, allStudents]);

  // Compose specialty text from chosen subjects and classes
  const composeSpecialty = (subs: string[], classes: string[]) => {
    if (subs.length === 0 && classes.length === 0) return "";
    const subPart = subs.join(" & ");
    const classPart = classes.length > 0 ? ` (${classes.join(", ")})` : "";
    return `${subPart}${classPart}`.trim();
  };

  const toggleFormClass = (cls: string) => {
    setFormData((prev: any) => {
      const currentClasses: string[] = prev.selectedClasses || [];
      const updatedClasses = currentClasses.includes(cls)
        ? currentClasses.filter((c) => c !== cls)
        : [...currentClasses, cls];

      const currentSubjects: string[] = prev.selectedSubjects || [];
      const composed = composeSpecialty(currentSubjects, updatedClasses);
      return {
        ...prev,
        selectedClasses: updatedClasses,
        subjectSpecialty: composed || prev.subjectSpecialty,
      };
    });
  };

  const toggleFormSubject = (sub: string) => {
    setFormData((prev: any) => {
      const currentSubjects: string[] = prev.selectedSubjects || [];
      const updatedSubjects = currentSubjects.includes(sub)
        ? currentSubjects.filter((s) => s !== sub)
        : [...currentSubjects, sub];

      const currentClasses: string[] = prev.selectedClasses || [];
      const composed = composeSpecialty(updatedSubjects, currentClasses);
      return {
        ...prev,
        selectedSubjects: updatedSubjects,
        subjectSpecialty: composed || prev.subjectSpecialty,
      };
    });
  };

  const openAddTeacherModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "teacher123",
      selectedClasses: ["Class 8"],
      selectedSubjects: ["Science", "Mathematics"],
      subjectSpecialty: "Mathematics & Science (Class 8)",
      phone: "",
      status: "ACTIVE",
    });
    setShowAddModal(true);
  };

  const openEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    const existingSpecialty = teacher.teacherProfile?.subjectSpecialty || "";

    const initialClasses: string[] = [];
    availableClasses.forEach((c) => {
      if (existingSpecialty.toLowerCase().includes(c.toLowerCase())) {
        initialClasses.push(c);
      }
    });

    const initialSubjects: string[] = [];
    STANDARD_SUBJECTS.forEach((s) => {
      if (existingSpecialty.toLowerCase().includes(s.toLowerCase())) {
        initialSubjects.push(s);
      }
    });

    teacher.assignedStudentsAsTeacher?.forEach((a: any) => {
      if (a.subject?.name && !initialSubjects.includes(a.subject.name)) {
        initialSubjects.push(a.subject.name);
      }
      if (a.subject?.classGrade && !initialClasses.includes(a.subject.classGrade)) {
        initialClasses.push(a.subject.classGrade);
      }
    });

    setFormData({
      name: teacher.name,
      email: teacher.email,
      status: teacher.status,
      subjectSpecialty: existingSpecialty,
      selectedClasses: initialClasses,
      selectedSubjects: initialSubjects,
      phone: teacher.teacherProfile?.phone || "",
      bio: teacher.teacherProfile?.bio || "",
    });
  };

  // Filter subjects based on selected classes in Assign Modal Step 1
  const filteredSubjectsForAssign = useMemo(() => {
    if (assignClassGrades.length === 0) {
      return allSubjects;
    }
    return allSubjects.filter(
      (sub) => !sub.classGrade || assignClassGrades.includes(sub.classGrade)
    );
  }, [allSubjects, assignClassGrades]);

  const toggleAssignClass = (cls: string) => {
    setAssignClassGrades((prev) => {
      const updated = prev.includes(cls)
        ? prev.filter((c) => c !== cls)
        : [...prev, cls];
      return updated;
    });
  };

  const toggleAssignSubject = (subId: string) => {
    setAssignSubjectIds((prev) => {
      return prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId];
    });
  };

  const selectAllAssignSubjects = () => {
    setAssignSubjectIds(filteredSubjectsForAssign.map((s) => s.id));
  };

  const clearAllAssignSubjects = () => {
    setAssignSubjectIds([]);
  };

  const selectAllAssignClasses = () => {
    setAssignClassGrades([...availableClasses]);
  };

  const clearAllAssignClasses = () => {
    setAssignClassGrades([]);
  };

  const fetchAssignments = async (teacherId: string) => {
    try {
      setLoadingAssignments(true);
      const [assignRes, stuRes, subRes] = await Promise.all([
        fetch(`/api/admin/teacher-student-assignments?teacherId=${teacherId}`),
        fetch("/api/students"),
        fetch("/api/subjects"),
      ]);

      if (assignRes.ok) {
        const aData = await assignRes.json();
        setTeacherAssignments(aData.assignments || []);
      }
      if (stuRes.ok) {
        const sData = await stuRes.json();
        setAllStudents(sData.students || []);
      }
      if (subRes.ok) {
        const subData = await subRes.json();
        const activeSubs = subData.subjects || [];
        setAllSubjects(activeSubs);
      }
    } catch (err) {
      console.error("Error loading assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleOpenAssignModal = (teacher: any) => {
    setAssigningTeacher(teacher);
    setSelectedStudentIds([]);
    setAssignSearch("");
    setRemovingAssignmentIds([]);

    const existingSpecialty = teacher.teacherProfile?.subjectSpecialty || "";
    const matchedClasses: string[] = [];
    availableClasses.forEach((c) => {
      if (existingSpecialty.toLowerCase().includes(c.toLowerCase())) {
        matchedClasses.push(c);
      }
    });

    setAssignClassGrades(matchedClasses.length > 0 ? matchedClasses : []);
    setAssignSubjectIds([]);
    setAssignGradeFilter("ALL");
    fetchAssignments(teacher.id);
  };

  const handleSaveAssignments = async () => {
    if (!assigningTeacher || assignSubjectIds.length === 0 || selectedStudentIds.length === 0) {
      showNotification("error", "Please select at least one subject and at least one student.");
      return;
    }

    try {
      setSavingAssignments(true);
      const res = await fetch("/api/admin/teacher-student-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: assigningTeacher.id,
          studentIds: selectedStudentIds,
          subjectIds: assignSubjectIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", data.message || "Students assigned successfully!");
        setSelectedStudentIds([]);
        await fetchAssignments(assigningTeacher.id);
        await fetchTeachers();
      } else {
        showNotification("error", data.error || "Failed to assign students.");
      }
    } catch (err) {
      showNotification("error", "Error assigning students.");
    } finally {
      setSavingAssignments(false);
    }
  };

  // Safe and instant removal of an assigned student
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!assignmentId) return;

    // 1. Optimistic removal: instantly removes from UI so there is zero delay!
    const previousAssignments = [...teacherAssignments];
    setTeacherAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setRemovingAssignmentIds((prev) => [...prev, assignmentId]);

    try {
      const res = await fetch(`/api/admin/teacher-student-assignments?id=${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Student removed successfully from faculty.");
        // Refresh background teachers count
        fetchTeachers();
      } else {
        // Rollback state if server returns error
        setTeacherAssignments(previousAssignments);
        showNotification("error", data.error || "Failed to remove assignment.");
      }
    } catch (err) {
      setTeacherAssignments(previousAssignments);
      showNotification("error", "Error removing assignment. Please try again.");
    } finally {
      setRemovingAssignmentIds((prev) => prev.filter((id) => id !== assignmentId));
    }
  };

  // Bulk remove all assigned students from this teacher
  const handleRemoveAllAssignments = async () => {
    if (!assigningTeacher || teacherAssignments.length === 0) return;
    const count = teacherAssignments.length;
    if (!confirm(`Are you sure you want to remove all ${count} assigned student(s) from ${assigningTeacher.name}?`)) {
      return;
    }

    const previousAssignments = [...teacherAssignments];
    const allIds = teacherAssignments.map((a) => a.id);
    setTeacherAssignments([]);
    setRemovingAssignmentIds(allIds);

    try {
      const res = await fetch("/api/admin/teacher-student-assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: assigningTeacher.id, ids: allIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", `Removed all ${count} student assignments from ${assigningTeacher.name}.`);
        fetchTeachers();
      } else {
        setTeacherAssignments(previousAssignments);
        showNotification("error", data.error || "Failed to remove assignments.");
      }
    } catch {
      setTeacherAssignments(previousAssignments);
      showNotification("error", "Error removing assignments.");
    } finally {
      setRemovingAssignmentIds([]);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Add Teacher
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Teacher created successfully!");
        setShowAddModal(false);
        setFormData({});
        fetchTeachers();
      } else {
        showNotification("error", data.error || "Failed to create teacher.");
      }
    } catch (err) {
      showNotification("error", "Error creating teacher.");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Teacher
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTeacher.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Teacher updated successfully!");
        setEditingTeacher(null);
        setFormData({});
        fetchTeachers();
      } else {
        showNotification("error", data.error || "Failed to update teacher.");
      }
    } catch (err) {
      showNotification("error", "Error updating teacher.");
    } finally {
      setActionLoading(false);
    }
  };

  // Convert Teacher to Student
  const handleConvertToStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingTeacher) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: convertingTeacher.id,
          convertToRole: "STUDENT",
          ...convertData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", `${convertingTeacher.name} converted to Student!`);
        setConvertingTeacher(null);
        fetchTeachers();
      } else {
        showNotification("error", data.error || "Failed to convert role.");
      }
    } catch (err) {
      showNotification("error", "Error converting teacher to student.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/teachers?id=${deletingTeacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Teacher deleted successfully.");
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("cb_deleted_teacher_ids") || "[]";
            const deletedList: string[] = JSON.parse(raw);
            if (!deletedList.includes(deletingTeacher.id)) deletedList.push(deletingTeacher.id);
            if (deletingTeacher.email && !deletedList.includes(deletingTeacher.email.toLowerCase())) {
              deletedList.push(deletingTeacher.email.toLowerCase());
            }
            localStorage.setItem("cb_deleted_teacher_ids", JSON.stringify(deletedList));
          } catch {}
        }
        setDeletingTeacher(null);
        fetchTeachers();
      } else {
        showNotification("error", data.error || "Failed to delete teacher.");
      }
    } catch (err) {
      showNotification("error", "Error deleting teacher.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter teachers
  const specialties = Array.from(
    new Set(teachers.map((t) => t.teacherProfile?.subjectSpecialty).filter(Boolean))
  );

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacherProfile?.subjectSpecialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "ALL" ||
      t.teacherProfile?.subjectSpecialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Teacher Management Dashboard
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add new educators, modify profiles, convert roles to students, or delete teacher accounts.
            </p>
          </div>

          <button
            onClick={openAddTeacherModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Faculty
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {teachers.length}
            </div>
          </div>
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Subject Departments
            </div>
            <div className="text-2xl font-black text-blue-900 mt-0.5">
              {specialties.length}
            </div>
          </div>
          <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Active Assignments
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">
              {teachers.reduce((acc, t) => acc + (t._count?.teacherAssignments || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search teachers by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Specialty:</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">All Subjects ({teachers.length})</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading && teachers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading faculty records...</span>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No teachers found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Teacher Profile</th>
                  <th className="py-3 px-4">Subject Specialty</th>
                  <th className="py-3 px-4">Assigned Students</th>
                  <th className="py-3 px-4">Active Tasks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {teacher.avatarUrl ? (
                          <img
                            src={teacher.avatarUrl}
                            alt={teacher.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {teacher.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{teacher.name}</div>
                          <div className="text-[11px] text-slate-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                        {teacher.teacherProfile?.subjectSpecialty || "General Academic"}
                      </span>
                    </td>

                    {/* Assigned Students */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{teacher.assignedStudentsAsTeacher?.length || 0} Students</span>
                      </div>
                      {teacher.assignedStudentsAsTeacher?.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[190px]">
                          {Array.from(
                            new Set(
                              teacher.assignedStudentsAsTeacher
                                .map((a: any) => a.subject?.name)
                                .filter(Boolean)
                            )
                          ).map((subName: any) => (
                            <span
                              key={subName}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {subName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None assigned</span>
                      )}
                    </td>

                    {/* Tasks */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">
                        {teacher._count?.teacherAssignments || 0} Homeworks
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {teacher._count?.assignedBooksAsTeacher || 0} Books Assigned
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          teacher.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Assign Students */}
                        <button
                          onClick={() => handleOpenAssignModal(teacher)}
                          title="Assign Students & Subjects"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-[11px] transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign Students</span>
                        </button>
                        {/* Edit Teacher */}
                        <button
                          onClick={() => openEditTeacher(teacher)}
                          title="Modify Teacher Data"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Convert to Student */}
                        <button
                          onClick={() => {
                            setConvertingTeacher(teacher);
                            setConvertData({
                              classGrade: "NEET Dropper",
                              section: "A",
                              rollNo: "",
                              schoolName: "LV INSTITUTE",
                            });
                          }}
                          title="Convert Role to Student"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>To Student</span>
                        </button>

                        {/* Delete Teacher */}
                        <button
                          onClick={() => setDeletingTeacher(teacher)}
                          title="Delete Teacher"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD TEACHER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-900">Add New Teacher</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@classboard.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={formData.password || "teacher123"}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Classes Taught Multi-Select */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Classes Taught (Select Multiple)</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {(formData.selectedClasses || []).length} class(es) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STANDARD_CLASSES.map((cls) => {
                    const isSelected = (formData.selectedClasses || []).includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleFormClass(cls)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{cls}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subjects Taught Multi-Select */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Subjects Taught (Select Multiple)</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    {(formData.selectedSubjects || []).length} subject(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STANDARD_SUBJECTS.map((sub) => {
                    const isSelected = (formData.selectedSubjects || []).includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleFormSubject(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Composed Subject Specialty Preview & Custom Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Specialty Title / Custom Note
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjectSpecialty || ""}
                  onChange={(e) => setFormData({ ...formData, subjectSpecialty: e.target.value })}
                  placeholder="e.g. Science & English (Class 8, Class 9, Class 10)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically updated from selected classes and subjects. You can also customize it directly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Teacher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TEACHER */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-900">Modify Teacher: {editingTeacher.name}</h3>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateTeacher} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || "ACTIVE"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Classes Taught Multi-Select */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Classes Taught (Select Multiple)</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {(formData.selectedClasses || []).length} class(es) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STANDARD_CLASSES.map((cls) => {
                    const isSelected = (formData.selectedClasses || []).includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleFormClass(cls)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{cls}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subjects Taught Multi-Select */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Subjects Taught / Specialty (Select Multiple)</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    {(formData.selectedSubjects || []).length} subject(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STANDARD_SUBJECTS.map((sub) => {
                    const isSelected = (formData.selectedSubjects || []).includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleFormSubject(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Composed Subject Specialty Preview & Custom Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Specialty Title / Custom Note
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjectSpecialty || ""}
                  onChange={(e) => setFormData({ ...formData, subjectSpecialty: e.target.value })}
                  placeholder="e.g. Science & English (Class 8, Class 9, Class 10)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically updated from selected classes and subjects. You can also customize it directly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT TEACHER TO STUDENT */}
      {convertingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Convert Teacher to Student</span>
              </h3>
              <button onClick={() => setConvertingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConvertToStudent} className="p-6 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are changing <strong>{convertingTeacher.name}</strong> from <strong>TEACHER</strong> to <strong>STUDENT</strong>. Please specify their student academic placement:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class / Grade *</label>
                <select
                  value={convertData.classGrade}
                  onChange={(e) => setConvertData({ ...convertData, classGrade: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                >
                  <option value="NEET Dropper">NEET Dropper</option>
                  <option value="JEE Dropper">JEE Dropper</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Class 11 & 12">Class 11 & 12</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    value={convertData.section}
                    onChange={(e) => setConvertData({ ...convertData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={convertData.rollNo}
                    onChange={(e) => setConvertData({ ...convertData, rollNo: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={convertData.schoolName}
                  onChange={(e) => setConvertData({ ...convertData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingTeacher(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                  <span>Confirm Conversion to Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE TEACHER CONFIRMATION */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">Delete Teacher Record?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Teacher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ASSIGN STUDENTS TO TEACHER */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/60 to-emerald-50/60 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Assign Students to Faculty
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{assigningTeacher.name}</span>
                    <span>•</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-blue-200">
                      {assigningTeacher.teacherProfile?.subjectSpecialty || "General Faculty"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAssigningTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Step 1: Select Classes & Subjects to Assign (Multi-Select) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Step 1: Select Classes & Subjects to Assign</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Single teacher can take multiple classes & subjects
                  </span>
                </div>

                {/* 1. Classes Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      1. Select Classes ({assignClassGrades.length === 0 ? "All Classes" : `${assignClassGrades.length} selected`})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllAssignClasses}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearAllAssignClasses}
                        className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAssignClassGrades([])}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        assignClassGrades.length === 0
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      All Classes
                    </button>
                    {availableClasses.map((cls) => {
                      const isSelected = assignClassGrades.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleAssignClass(cls)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          <span>{cls}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Subjects Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      2. Select Subjects to Assign ({assignSubjectIds.length} selected)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllAssignSubjects}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearAllAssignSubjects}
                        className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                    {filteredSubjectsForAssign.length === 0 ? (
                      <div className="p-2 text-slate-400 text-xs text-center w-full">
                        No subjects found for the selected classes.
                      </div>
                    ) : (
                      filteredSubjectsForAssign.map((sub) => {
                        const isSelected = assignSubjectIds.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleAssignSubject(sub.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: isSelected ? "#fff" : sub.color || "#4F46E5" }}
                            />
                            <span>{sub.name}</span>
                            {sub.classGrade && (
                              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-200 text-slate-600"}`}>
                                {sub.classGrade}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Currently Assigned Students */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Currently Assigned Students ({teacherAssignments.length})</span>
                    </label>
                    {loadingAssignments && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                  </div>

                  {teacherAssignments.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRemoveAllAssignments}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove All ({teacherAssignments.length})</span>
                    </button>
                  )}
                </div>

                {teacherAssignments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    No students currently assigned to this faculty member.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-2.5 bg-slate-50/70 rounded-2xl border border-slate-200">
                    {teacherAssignments.map((assignment) => {
                      const isRemoving = removingAssignmentIds.includes(assignment.id);
                      return (
                        <div
                          key={assignment.id}
                          className={`flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs transition-all ${
                            isRemoving ? "opacity-40 pointer-events-none" : "hover:border-slate-300"
                          }`}
                        >
                          <span className="font-bold text-slate-800">
                            {assignment.student?.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            {assignment.subject?.name}
                          </span>
                          {assignment.student?.studentProfile?.classGrade && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {assignment.student.studentProfile.classGrade}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveAssignment(assignment.id);
                            }}
                            title="Remove student assignment"
                            aria-label={`Remove assignment for ${assignment.student?.name}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-center"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Select Students to Assign */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Step 2: Choose Students to Assign</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const filteredIds = allStudents
                          .filter((stu) => {
                            const matchSearch =
                              !assignSearch ||
                              stu.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                              stu.email.toLowerCase().includes(assignSearch.toLowerCase()) ||
                              stu.studentProfile?.rollNo?.includes(assignSearch);
                            const matchClass =
                              assignGradeFilter === "ALL"
                                ? assignClassGrades.length === 0 ||
                                  (stu.studentProfile?.classGrade &&
                                    assignClassGrades.includes(stu.studentProfile.classGrade))
                                : stu.studentProfile?.classGrade === assignGradeFilter;
                            return matchSearch && matchClass;
                          })
                          .map((s) => s.id);
                        setSelectedStudentIds(filteredIds);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter & Search */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter students by name, email, roll..."
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={assignGradeFilter}
                      onChange={(e) => setAssignGradeFilter(e.target.value)}
                      className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-semibold"
                    >
                      <option value="ALL">
                        {assignClassGrades.length > 0
                          ? `All Selected Classes (${assignClassGrades.length})`
                          : "All Classes"}
                      </option>
                      {(assignClassGrades.length > 0
                        ? assignClassGrades
                        : Array.from(
                            new Set(allStudents.map((s) => s.studentProfile?.classGrade).filter(Boolean))
                          )
                      ).map((grade: any) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students Checklist Grid */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50/50 rounded-2xl border border-slate-200">
                  {allStudents
                    .filter((stu) => {
                      const matchSearch =
                        !assignSearch ||
                        stu.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                        stu.email.toLowerCase().includes(assignSearch.toLowerCase()) ||
                        stu.studentProfile?.rollNo?.includes(assignSearch);
                      const matchClass =
                        assignGradeFilter === "ALL"
                          ? assignClassGrades.length === 0 ||
                            (stu.studentProfile?.classGrade &&
                              assignClassGrades.includes(stu.studentProfile.classGrade))
                          : stu.studentProfile?.classGrade === assignGradeFilter;
                      return matchSearch && matchClass;
                    })
                    .map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      const assignedSubjectNames = teacherAssignments
                        .filter(
                          (a) =>
                            a.studentId === student.id &&
                            (assignSubjectIds.length === 0 || assignSubjectIds.includes(a.subjectId))
                        )
                        .map((a) => a.subject?.name)
                        .filter(Boolean);

                      const isFullyAssigned =
                        assignSubjectIds.length > 0 &&
                        assignSubjectIds.every((sId) =>
                          teacherAssignments.some((a) => a.studentId === student.id && a.subjectId === sId)
                        );

                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                            } else {
                              setSelectedStudentIds((prev) => [...prev, student.id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-400 text-blue-950 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer pointer-events-none"
                            />
                            <div>
                              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                <span>{student.name}</span>
                                {isFullyAssigned ? (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                    Already Assigned
                                  </span>
                                ) : assignedSubjectNames.length > 0 ? (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                                    Assigned: {assignedSubjectNames.join(", ")}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {student.studentProfile?.classGrade || "No Grade"} - {student.studentProfile?.section || "A"} • Roll #{student.studentProfile?.rollNo || "--"} • {student.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">
                  {selectedStudentIds.length} student{selectedStudentIds.length === 1 ? "" : "s"} selected
                </span>
                <span className="text-[11px] text-slate-500">
                  {assignSubjectIds.length === 0
                    ? "Select at least 1 subject in Step 1"
                    : `Across ${assignSubjectIds.length} subject${assignSubjectIds.length === 1 ? "" : "s"} (${selectedStudentIds.length * assignSubjectIds.length} assignment link${selectedStudentIds.length * assignSubjectIds.length === 1 ? "" : "s"})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={savingAssignments || selectedStudentIds.length === 0 || assignSubjectIds.length === 0}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {savingAssignments ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {assignSubjectIds.length === 0
                      ? "Select a Subject"
                      : `Assign to Selected Subjects`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
