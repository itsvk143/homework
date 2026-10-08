"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  BookOpen,
  Folder,
  FileSpreadsheet,
  Plus,
  Settings,
  ShieldAlert,
  Users,
  Archive,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  GraduationCap,
} from "lucide-react";
import { BookLibrary } from "./BookLibrary";
import { AdminTeacherManagement } from "./AdminTeacherManagement";
import { AdminStudentManagement } from "./AdminStudentManagement";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "content" | "library" | "teachers" | "students" | "settings" | "audit"
  >("teachers");
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    teachers: true,
  });
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    requireTeacherVerification: true,
    sequentialExerciseCompletion: false,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab: "content" | "settings" | "audit" | "teachers" | "students" | "library") => {
    setActiveTab(tab);
    setVisitedTabs((prev) => ({ ...prev, [tab]: true }));
  };

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modals for adding content
  const [modalType, setModalType] = useState<"subject" | "book" | "chapter" | "exercise" | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch("/api/academic/hierarchy");
      if (res.ok) {
        const data = await res.json();
        setHierarchy(data.subjects || []);
        // Auto-expand top subject & book
        if (data.subjects?.length > 0) {
          const firstSub = data.subjects[0];
          const newExp: Record<string, boolean> = { [firstSub.id]: true };
          if (firstSub.books?.length > 0) {
            newExp[firstSub.books[0].id] = true;
          }
          setExpandedNodes((prev) => ({ ...prev, ...newExp }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lazy load tab data only when tab is viewed
  useEffect(() => {
    if (activeTab === "content" && hierarchy.length === 0) {
      fetchHierarchy();
    } else if (activeTab === "settings" && Object.keys(settings).length <= 2) {
      fetchSettings();
    } else if (activeTab === "audit" && auditLogs.length === 0) {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Toggle settings
  const handleUpdateSetting = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Content
  const handleCreateContent = async () => {
    if (!formData.name) return;
    setIsSubmitting(true);

    try {
      let endpoint = "";
      let payload: any = { ...formData };

      if (modalType === "subject") {
        endpoint = "/api/subjects";
      } else if (modalType === "book") {
        endpoint = "/api/books";
        payload.subjectId = selectedParentId;
      } else if (modalType === "chapter") {
        endpoint = "/api/chapters";
        payload.bookId = selectedParentId;
      } else if (modalType === "exercise") {
        endpoint = "/api/exercises";
        payload.chapterId = selectedParentId;
        payload.totalQuestions = Number(formData.totalQuestions) || 10;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalType(null);
        setFormData({});
        fetchHierarchy();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete protection: Archive exercise
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("Are you sure you want to remove or archive this exercise?")) return;
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message || "Exercise updated");
      fetchHierarchy();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => handleTabChange("teachers")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "teachers"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-700 bg-blue-50/60 hover:bg-blue-100/60"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Manage Teachers</span>
          </button>

          <button
            onClick={() => handleTabChange("students")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "students"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Students</span>
          </button>

          <button
            onClick={() => handleTabChange("library")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "library"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Master Book Library</span>
          </button>

          <button
            onClick={() => handleTabChange("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => handleTabChange("audit")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => handleTabChange("content")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "content"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Master Content Tree</span>
          </button>
        </div>

        {activeTab === "content" && (
          <button
            onClick={() => {
              setModalType("subject");
              setSelectedParentId(null);
              setFormData({ name: "", classGrade: "Class 8", color: "#4F46E5" });
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        )}
      </div>

      {/* TAB 1: TREE-BASED MASTER ACADEMIC CONTENT BUILDER (Requirement 43 & 44) */}
      <div className={activeTab === "content" ? "block" : "hidden"}>
        {visitedTabs.content && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Academic Curriculum Hierarchy
                </h2>
                <p className="text-xs text-slate-500">
                  Predefined master structure: Subject → Book → Chapter → Exercise. Delete protection preserves historical homework records.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Delete Protection Active</span>
              </div>
            </div>

            {/* Tree View */}
            <div className="space-y-2 pt-2">
              {hierarchy.map((sub) => {
                const isSubExpanded = !!expandedNodes[sub.id];

                return (
                  <div key={sub.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    {/* Subject Node */}
                    <div className="p-3.5 bg-white flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <button
                        onClick={() => toggleNode(sub.id)}
                        className="flex items-center gap-2.5 font-bold text-sm text-slate-900"
                      >
                        {isSubExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span
                          className="w-3 hand-3 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span>{sub.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-100">
                          {sub.books?.length || 0} books
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setModalType("book");
                          setSelectedParentId(sub.id);
                          setFormData({ name: "", classGrade: sub.classGrade, displayOrder: (sub.books?.length || 0) + 1 });
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Book
                      </button>
                    </div>

                    {/* Books list under Subject */}
                    {isSubExpanded && (
                      <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-100">
                        {sub.books?.map((b: any) => {
                          const isBookExpanded = !!expandedNodes[b.id];

                          return (
                            <div key={b.id} className="border border-slate-200/80 rounded-xl bg-white overflow-hidden">
                              {/* Book Node */}
                              <div className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                                <button
                                  onClick={() => toggleNode(b.id)}
                                  className="flex items-center gap-2 font-semibold text-xs text-slate-800"
                                >
                                  {isBookExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <BookOpen className="w-4 h-4 text-indigo-600" />
                                  <span>{b.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({b.chapters?.length || 0} chapters)
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setModalType("chapter");
                                    setSelectedParentId(b.id);
                                    setFormData({
                                      name: "",
                                      chapterNumber: (b.chapters?.length || 0) + 1,
                                    });
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100"
                                >
                                  <Plus className="w-3 h-3" /> Add Chapter
                                </button>
                              </div>

                              {/* Chapters list under Book */}
                              {isBookExpanded && (
                                <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-100 bg-slate-50/30">
                                  {b.chapters?.map((ch: any) => {
                                    const isChapExpanded = !!expandedNodes[ch.id];

                                    return (
                                      <div key={ch.id} className="border border-slate-200/60 rounded-lg bg-white">
                                        {/* Chapter Node */}
                                        <div className="p-2.5 flex items-center justify-between text-xs">
                                          <button
                                            onClick={() => toggleNode(ch.id)}
                                            className="flex items-center gap-2 font-medium text-slate-800"
                                          >
                                            {isChapExpanded ? (
                                              <ChevronDown className="w-3 h-3 text-slate-400" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-slate-400" />
                                            )}
                                            <Folder className="w-3.5 h-3.5 text-amber-500" />
                                            <span>
                                              Ch {ch.chapterNumber}: {ch.name}
                                            </span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              setModalType("exercise");
                                              setSelectedParentId(ch.id);
                                              setFormData({
                                                name: `Exercise ${ch.chapterNumber}.${(ch.exercises?.length || 0) + 1}`,
                                                exerciseNumber: `${ch.chapterNumber}.${(ch.exercises?.length || 0) + 1}`,
                                                totalQuestions: 20,
                                              });
                                            }}
                                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                                          >
                                            <Plus className="w-3 h-3" /> Add Exercise
                                          </button>
                                        </div>

                                        {/* Exercises list under Chapter */}
                                        {isChapExpanded && (
                                          <div className="pl-6 pr-3 py-2 space-y-1.5 border-t border-slate-100">
                                            {ch.exercises?.map((ex: any) => {
                                              const refCount = ex._count?.homeworks || 0;

                                              return (
                                                <div
                                                  key={ex.id}
                                                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-between text-xs"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="font-bold text-slate-900">
                                                      {ex.name}
                                                    </span>
                                                    <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded font-semibold">
                                                      {ex.totalQuestions} Questions
                                                    </span>
                                                    {refCount > 0 && (
                                                      <span className="text-[10px] text-slate-400">
                                                        ({refCount} assigned homeworks)
                                                      </span>
                                                    )}
                                                  </div>

                                                  <button
                                                    onClick={() => handleDeleteExercise(ex.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                                    title={
                                                      refCount > 0
                                                        ? "Archive Exercise (Historical homework preserved)"
                                                        : "Delete Exercise"
                                                    }
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TAB: MASTER BOOK LIBRARY */}
      <div className={activeTab === "library" ? "block" : "hidden"}>
        {visitedTabs.library && <BookLibrary />}
      </div>

      {/* TAB: MANAGE TEACHERS DASHBOARD */}
      <div className={activeTab === "teachers" ? "block" : "hidden"}>
        <AdminTeacherManagement />
      </div>

      {/* TAB: MANAGE STUDENTS DASHBOARD */}
      <div className={activeTab === "students" ? "block" : "hidden"}>
        {visitedTabs.students && <AdminStudentManagement />}
      </div>

      {/* TAB 2: SYSTEM SETTINGS (Requirement 32 & 42) */}
      <div className={activeTab === "settings" ? "block" : "hidden"}>
        {visitedTabs.settings && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Platform Policies & Settings</h2>
              <p className="text-xs text-slate-500">
                Configure global behavioral rules for verification and progression.
              </p>
            </div>

            <div className="space-y-4">
              {/* Setting 1: Require Teacher Verification (Requirement 32) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Require Teacher Verification
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    When <strong>ON</strong>: When a student completes all questions (e.g., 20/20), status becomes <em>AWAITING_REVIEW</em> until a teacher verifies proof.
                    <br />
                    When <strong>OFF</strong>: 20/20 questions completed automatically marks homework as <em>COMPLETED</em>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdateSetting("requireTeacherVerification", !settings.requireTeacherVerification)
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.requireTeacherVerification ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      settings.requireTeacherVerification ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Setting 2: Sequential Exercise Completion (Requirement 42) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Sequential Exercise Completion
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    When <strong>ON</strong>: Students must finish Exercise 1.1 before unlocking Exercise 1.2.
                    <br />
                    When <strong>OFF</strong>: Teachers can assign and students can complete any exercise independently.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdateSetting(
                      "sequentialExerciseCompletion",
                      !settings.sequentialExerciseCompletion
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.sequentialExerciseCompletion ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      settings.sequentialExerciseCompletion ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAB 3: AUDIT LOGS (Requirement 58) */}
      <div className={activeTab === "audit" ? "block" : "hidden"}>
        {visitedTabs.audit && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable log of homework assignments, progress updates, verifications, and master content changes.
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-slate-800 font-medium">
                        {log.user?.name || "System"} ({log.user?.role || "SYSTEM"})
                      </span>
                    </div>
                    {log.metadata && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        {log.metadata}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 capitalize">
              Add New {modalType}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  placeholder={`e.g. ${modalType === "exercise" ? "Exercise 4.2" : "New " + modalType}`}
                />
              </div>

              {modalType === "exercise" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Exercise Number
                    </label>
                    <input
                      type="text"
                      value={formData.exerciseNumber || ""}
                      onChange={(e) => setFormData({ ...formData, exerciseNumber: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                      placeholder="e.g. 4.2"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Total Questions (Required for progress calculation)
                    </label>
                    <input
                      type="number"
                      value={formData.totalQuestions || 10}
                      onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateContent}
                disabled={isSubmitting || !formData.name}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
