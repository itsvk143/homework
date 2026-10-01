"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ArrowRightLeft,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  School,
  Sparkles,
  GraduationCap,
  Users,
  UserCheck,
} from "lucide-react";

export function AdminStudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [convertingStudent, setConvertingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);

  // Assignment Modal State
  const [assigningStudent, setAssigningStudent] = useState<any>(null);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [savingAssignment, setSavingAssignment] = useState<boolean>(false);

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [convertData, setConvertData] = useState<any>({
    subjectSpecialty: "Mathematics",
    phone: "",
    schoolName: "ClassBoard Academy",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAssignments = async (studentId: string) => {
    try {
      setLoadingAssignments(true);
      const [assignRes, teachRes, subRes] = await Promise.all([
        fetch(`/api/admin/teacher-student-assignments?studentId=${studentId}`),
        fetch("/api/teachers"),
        fetch("/api/subjects"),
      ]);

      if (assignRes.ok) {
        const aData = await assignRes.json();
        setStudentAssignments(aData.assignments || []);
      }
      if (teachRes.ok) {
        const tData = await teachRes.json();
        const activeTeachers = tData.teachers || [];
        setAllTeachers(activeTeachers);
        if (activeTeachers.length > 0) {
          setSelectedTeacherId(activeTeachers[0].id);
        }
      }
      if (subRes.ok) {
        const sData = await subRes.json();
        const activeSubs = sData.subjects || [];
        setAllSubjects(activeSubs);
        if (activeSubs.length > 0) {
          setSelectedSubjectId(activeSubs[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading student assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleOpenAssignModal = (student: any) => {
    setAssigningStudent(student);
    fetchStudentAssignments(student.id);
  };

  const handleSaveStudentAssignment = async () => {
    if (!assigningStudent || !selectedTeacherId || !selectedSubjectId) {
      showNotification("error", "Please select both a faculty member and a subject.");
      return;
    }

    try {
      setSavingAssignment(true);
      const res = await fetch("/api/admin/teacher-student-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          studentId: assigningStudent.id,
          subjectId: selectedSubjectId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", data.message || "Faculty assigned successfully!");
        await fetchStudentAssignments(assigningStudent.id);
        await fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to assign faculty.");
      }
    } catch (err) {
      showNotification("error", "Error assigning faculty.");
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleRemoveStudentAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/admin/teacher-student-assignments?id=${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Faculty assignment removed.");
        if (assigningStudent) {
          await fetchStudentAssignments(assigningStudent.id);
        }
        await fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to remove assignment.");
      }
    } catch (err) {
      showNotification("error", "Error removing assignment.");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Student registered successfully!");
        setShowAddModal(false);
        setFormData({});
        fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to add student.");
      }
    } catch (err) {
      showNotification("error", "Error creating student.");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Student
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStudent.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Student updated successfully!");
        setEditingStudent(null);
        setFormData({});
        fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to update student.");
      }
    } catch (err) {
      showNotification("error", "Error updating student.");
    } finally {
      setActionLoading(false);
    }
  };

  // Convert Student to Teacher
  const handleConvertToTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingStudent) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: convertingStudent.id,
          convertToRole: "TEACHER",
          ...convertData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", `${convertingStudent.name} converted to Teacher!`);
        setConvertingStudent(null);
        fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to convert role.");
      }
    } catch (err) {
      showNotification("error", "Error converting student to teacher.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students?id=${deletingStudent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Student deleted successfully.");
        setDeletingStudent(null);
        fetchStudents();
      } else {
        showNotification("error", data.error || "Failed to delete student.");
      }
    } catch (err) {
      showNotification("error", "Error deleting student.");
    } finally {
      setActionLoading(false);
    }
  };

  // Unique Classes
  const grades = Array.from(
    new Set(students.map((s) => s.studentProfile?.classGrade).filter(Boolean))
  );

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentProfile?.classGrade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentProfile?.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade =
      selectedGrade === "ALL" || s.studentProfile?.classGrade === selectedGrade;
    return matchesSearch && matchesGrade;
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
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Student Management Dashboard
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enroll students, edit class placements, convert roles to teachers, or remove student accounts.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                password: "student123",
                classGrade: "Class 8",
                section: "A",
                rollNo: "",
                schoolName: "Delhi Public School",
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled Students
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {students.length}
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Active Classes
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">
              {grades.length}
            </div>
          </div>
          <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Total Assigned Homeworks
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">
              {students.reduce((acc, s) => acc + (s._count?.studentAssignments || 0), 0)}
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
            placeholder="Search students by name, roll, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Grade / Class:</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">All Classes ({students.length})</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading student records...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No students found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4">Homework Tasks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {student.avatarUrl ? (
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[11px] text-slate-500">{student.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Class & Section */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        {student.studentProfile?.classGrade || "Class 8"} - {student.studentProfile?.section || "A"}
                      </span>
                    </td>

                    {/* Roll No */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {student.studentProfile?.rollNo || "--"}
                    </td>

                    {/* Assigned Faculty */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{student.assignedTeachersAsStudent?.length || 0} Faculty</span>
                      </div>
                      {student.assignedTeachersAsStudent?.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                          {student.assignedTeachersAsStudent.map((a: any) => (
                            <span
                              key={a.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[190px]"
                              title={`${a.teacher?.name} (${a.subject?.name})`}
                            >
                              {a.teacher?.name?.split(" ")[0]} ({a.subject?.name})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None assigned</span>
                      )}
                    </td>

                    {/* Homework Tasks */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">
                        {student._count?.studentAssignments || 0} Homeworks
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {student.assignedBooksAsStudent?.length || 0} Books Assigned
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          student.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Assign Faculty Button */}
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          title="Assign Faculty & Subject"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold text-[11px] transition-colors cursor-pointer border border-indigo-200 shadow-2xs"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Assign Faculty</span>
                        </button>
                        {/* Edit Student */}
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setFormData({
                              name: student.name,
                              email: student.email,
                              status: student.status,
                              classGrade: student.studentProfile?.classGrade || "Class 8",
                              section: student.studentProfile?.section || "A",
                              rollNo: student.studentProfile?.rollNo || "",
                              schoolName: student.studentProfile?.schoolName || "",
                            });
                          }}
                          title="Modify Student Data"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Convert to Teacher */}
                        <button
                          onClick={() => {
                            setConvertingStudent(student);
                            setConvertData({
                              subjectSpecialty: "Mathematics",
                              phone: "",
                              schoolName: "ClassBoard Academy",
                            });
                          }}
                          title="Convert Role to Teacher"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>To Teacher</span>
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => setDeletingStudent(student)}
                          title="Delete Student"
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

      {/* MODAL 1: ADD STUDENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Enroll New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ananya Roy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ananya@classboard.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  value={formData.password || "student123"}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formData.classGrade || "Class 8"}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
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
                    <option value="JEE / NEET Dropper">JEE / NEET Dropper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    value={formData.section || "A"}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll No</label>
                  <input
                    type="text"
                    value={formData.rollNo || ""}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 18"
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={formData.schoolName || ""}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Modify Student: {editingStudent.name}</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={formData.classGrade || "Class 8"}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
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
                    <option value="JEE / NEET Dropper">JEE / NEET Dropper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section || "A"}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll No</label>
                  <input
                    type="text"
                    value={formData.rollNo || ""}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={formData.schoolName || ""}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status || "ACTIVE"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT STUDENT TO TEACHER */}
      {convertingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>Convert Student to Teacher</span>
              </h3>
              <button onClick={() => setConvertingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConvertToTeacher} className="p-6 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are changing <strong>{convertingStudent.name}</strong> from <strong>STUDENT</strong> to <strong>TEACHER</strong>. Please specify their teaching department and specialty:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Subject Specialty *</label>
                <select
                  value={convertData.subjectSpecialty}
                  onChange={(e) => setConvertData({ ...convertData, subjectSpecialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science & Mathematics">Science & Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Science & English">Science & English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General Academic">General Academic</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone (optional)</label>
                <input
                  type="tel"
                  value={convertData.phone}
                  onChange={(e) => setConvertData({ ...convertData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School / Academy / Institute</label>
                <input
                  type="text"
                  value={convertData.schoolName}
                  onChange={(e) => setConvertData({ ...convertData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingStudent(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                  <span>Confirm Conversion to Teacher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE STUDENT CONFIRMATION */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">Delete Student Record?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingStudent.name}</strong> ({deletingStudent.email})? This action will remove their homework records and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ASSIGN FACULTY TO STUDENT */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/60 to-indigo-50/60 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Assign Faculty to Student
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{assigningStudent.name}</span>
                    <span>•</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-emerald-200">
                      {assigningStudent.studentProfile?.classGrade} - {assigningStudent.studentProfile?.section || "A"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAssigningStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Existing Faculty Assignments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Current Faculty ({studentAssignments.length})</span>
                  </label>
                  {loadingAssignments && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>

                {studentAssignments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    No faculty currently assigned to this student.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                    {studentAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {assignment.teacher?.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{assignment.teacher?.name}</div>
                            <div className="text-[10px] text-slate-500">{assignment.teacher?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {assignment.subject?.name}
                          </span>
                          <button
                            onClick={() => handleRemoveStudentAssignment(assignment.id)}
                            title="Remove assignment"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Faculty Assignment */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3 pt-3">
                <label className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Assign Another Faculty Member</span>
                </label>

                {/* Faculty Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Select Faculty / Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-hidden focus:border-indigo-500 text-xs shadow-2xs"
                  >
                    {allTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.teacherProfile?.subjectSpecialty || "General Faculty"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Select Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-hidden focus:border-indigo-500 text-xs shadow-2xs"
                  >
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.classGrade || "All Grades"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveStudentAssignment}
                    disabled={savingAssignment || !selectedTeacherId || !selectedSubjectId}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {savingAssignment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Assign Selected Faculty</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
