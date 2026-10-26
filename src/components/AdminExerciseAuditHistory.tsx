"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  ArrowRight,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export function AdminExerciseAuditHistory() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exercise-config-audit");
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleRestore = async (audit: any) => {
    const confirmRestore = confirm(
      `Are you sure you want to restore the question count for "${audit.exercise?.name}" back to ${audit.previousCount} questions? This will update the canonical configuration for ALL students assigned to "${audit.book?.name}".`
    );
    if (!confirmRestore) return;

    setRevertingId(audit.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/exercise-config-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to restore configuration" });
      } else {
        setFeedback({
          type: "success",
          text: `Successfully restored ${audit.exercise?.name} to ${audit.previousCount} questions!`,
        });
        fetchAudits();
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Network error restoring configuration" });
    } finally {
      setRevertingId(null);
    }
  };

  const filteredAudits = audits.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.exercise?.name?.toLowerCase().includes(q) ||
      a.chapter?.name?.toLowerCase().includes(q) ||
      a.book?.name?.toLowerCase().includes(q) ||
      a.changedByName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Exercise Configuration Audit Log</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full audit trail of question count adjustments with single-click restore capabilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise, book, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-600 w-56 font-medium"
            />
          </div>

          <button
            onClick={fetchAudits}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Audit Log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading audit history...</span>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No exercise question count modifications recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Exercise & Chapter</th>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Change Applied</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map((a) => {
                  const isReverted = a.status === "REVERTED";
                  const isRevertingThis = revertingId === a.id;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Exercise */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {a.exercise?.exerciseNumber ? `${a.exercise.exerciseNumber} — ` : ""}
                          {a.exercise?.name || "Exercise"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Ch {a.chapter?.chapterNumber}: {a.chapter?.name}
                        </div>
                      </td>

                      {/* Book */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 truncate max-w-[200px]">
                          {a.book?.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {a.book?.subject?.name || "Subject"}
                        </div>
                      </td>

                      {/* Change */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 line-through">
                            {a.previousCount} Qs
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200">
                            {a.newCount} Qs
                          </span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{a.changedByName || "Unknown"}</div>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            a.changedByRole === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {a.changedByRole === "ADMIN" ? "Admin" : "Trusted Student"}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div>{new Date(a.timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isReverted
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isReverted ? "Reverted" : "Active"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {!isReverted ? (
                          <button
                            type="button"
                            disabled={isRevertingThis}
                            onClick={() => handleRestore(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                            title={`Revert to ${a.previousCount} questions`}
                          >
                            {isRevertingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3 text-indigo-600" />
                            )}
                            <span>Restore {a.previousCount} Qs</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Reverted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
