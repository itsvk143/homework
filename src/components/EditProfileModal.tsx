"use client";

import React, { useState } from "react";
import {
  X,
  User,
  GraduationCap,
  BookOpen,
  Lock,
  School,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated?: (updatedUser: any) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: EditProfileModalProps) {
  if (!isOpen || !currentUser) return null;

  const [name, setName] = useState(currentUser.name || "");
  const role = currentUser.role; // Immutable once signup completed

  // Student specific fields
  const [classGrade, setClassGrade] = useState(
    currentUser.studentProfile?.classGrade || "NEET Dropper"
  );
  const [section, setSection] = useState(
    currentUser.studentProfile?.section || "A"
  );
  const [rollNo, setRollNo] = useState(
    currentUser.studentProfile?.rollNo || ""
  );
  const [schoolName, setSchoolName] = useState(
    currentUser.studentProfile?.schoolName ||
      currentUser.teacherProfile?.schoolName ||
      "LV INSTITUTE"
  );

  // Teacher specific fields
  const [subjectSpecialty, setSubjectSpecialty] = useState(
    currentUser.teacherProfile?.subjectSpecialty || "Mathematics"
  );
  const [phone, setPhone] = useState(currentUser.teacherProfile?.phone || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          schoolName: schoolName.trim(),
          classGrade: role === "STUDENT" ? classGrade : undefined,
          section: role === "STUDENT" ? section : undefined,
          rollNo: role === "STUDENT" ? rollNo.trim() : undefined,
          subjectSpecialty: role === "TEACHER" ? subjectSpecialty : undefined,
          phone: role === "TEACHER" ? phone.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onProfileUpdated) {
          onProfileUpdated(data.user);
        }
        onClose();
        window.location.reload();
      } else {
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Edit Profile
              </h3>
              <p className="text-xs text-slate-500">
                Modify your personal and academic details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Locked Role Indicator (Immutable once signed up) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                {role === "TEACHER" ? (
                  <GraduationCap className="w-4 h-4" />
                ) : role === "ADMIN" ? (
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                ) : (
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account Role
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {role} ACCOUNT
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-xl">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Role Locked</span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Role-Specific User Data (Student or Teacher) */}
          {role === "STUDENT" && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School / Institution
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. LV INSTITUTE"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
                    <option value="NEET Dropper">NEET Dropper</option>
                    <option value="JEE Dropper">JEE Dropper</option>
                    <option value="Class 11 NEET">Class 11 NEET</option>
                    <option value="Class 11 JEE">Class 11 JEE</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12 NEET">Class 12 NEET</option>
                    <option value="Class 12 JEE">Class 12 JEE</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 4">Class 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll No
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {role === "TEACHER" && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Subject Specialty
                </label>
                <select
                  value={subjectSpecialty}
                  onChange={(e) => setSubjectSpecialty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / Contact
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
