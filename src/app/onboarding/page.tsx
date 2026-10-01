"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  UserCheck,
  CheckCircle2,
  School,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Role: STUDENT or TEACHER
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  // Basic Information
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("Delhi Public School");

  // Student specific
  const [classGrade, setClassGrade] = useState("Class 8");
  const [section, setSection] = useState("A");
  const [rollNo, setRollNo] = useState("");

  // Teacher specific
  const [subjectSpecialty, setSubjectSpecialty] = useState("Mathematics");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!data.user) {
            router.replace("/login");
            return;
          }
          setCurrentUser(data.user);
          setName(data.user.name || "");
          if (data.user.role === "TEACHER") {
            setRole("TEACHER");
          }
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error(err);
        router.replace("/login");
      } finally {
        setCheckingSession(false);
      }
    };

    fetchMe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
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
        window.location.href = data.redirectUrl || "/";
      } else {
        setError(data.error || "Unable to save your role. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Preparing account setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                ClassBoard
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Setup
              </span>
            </div>
            <p className="text-xs text-slate-500">First-Time Account Onboarding</p>
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          Welcome{name ? `, ${name}` : ""}! Choose Your Role
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Please select whether you are joining as a Teacher or a Student to configure your dashboard.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* STEP 1: CHOOSE ROLE */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Step 1: Choose Your Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    role === "STUDENT"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        role === "STUDENT"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {role === "STUDENT" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    I am a Student
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Track homework, update exercise questions, and stay ahead of deadlines.
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Student Dashboard
                    </span>
                  </div>
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    role === "TEACHER"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        role === "TEACHER"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <UserCheck className="w-5 h-5" />
                    </div>
                    {role === "TEACHER" && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    I am a Teacher
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Assign books, schedule homework, and monitor chapter-wise student progress.
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Teacher Dashboard
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 2: BASIC INFO */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Step 2: Basic Information *
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikash Kumar"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    School / Institution / Coaching Name
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Delhi Public School"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: ROLE DETAILS */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Step 3: {role === "STUDENT" ? "Student Class & Section" : "Teacher Subject Specialty"}
              </label>

              {role === "STUDENT" ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class / Grade *
                      </label>
                      <select
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Section *
                      </label>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number (optional)
                      </label>
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Subject Specialty *
                      </label>
                      <select
                        value={subjectSpecialty}
                        onChange={(e) => setSubjectSpecialty(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
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
                        Contact Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Note: Role is permanent */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 leading-relaxed">
              <strong>Important:</strong> Once you confirm your role as <strong>{role === "TEACHER" ? "Teacher" : "Student"}</strong>, your role will be permanently locked.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring Account...</span>
                </>
              ) : (
                <>
                  <span>Confirm Role & Access {role === "TEACHER" ? "Teacher" : "Student"} Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ClassBoard Academic Security • One-Time Role Assignment</span>
        </div>
      </div>
    </div>
  );
}
