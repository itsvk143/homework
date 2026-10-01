"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  UserCheck,
  School,
  Lock,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export default function SignupPage() {
  const router = useRouter();

  // Role: STUDENT or TEACHER
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  // Basic Information
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Student specific
  const [schoolName, setSchoolName] = useState("Delhi Public School");
  const [classGrade, setClassGrade] = useState("Class 8");
  const [section, setSection] = useState("A");
  const [rollNo, setRollNo] = useState("");

  // Teacher specific
  const STANDARD_CLASSES = [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
    "JEE / NEET Dropper",
  ];

  const STANDARD_SUBJECTS = [
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Hindi",
    "Social Science",
    "Computer Science",
  ];

  const [teacherClasses, setTeacherClasses] = useState<string[]>(["Class 9", "Class 10"]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>(["Mathematics"]);
  const [subjectSpecialty, setSubjectSpecialty] = useState("Mathematics (Class 9, Class 10)");
  const [phone, setPhone] = useState("");

  const composeSpecialty = (subs: string[], classes: string[]) => {
    if (subs.length === 0 && classes.length === 0) return "";
    const subPart = subs.join(" & ");
    const classPart = classes.length > 0 ? ` (${classes.join(", ")})` : "";
    return `${subPart}${classPart}`.trim();
  };

  const toggleTeacherClass = (cls: string) => {
    setTeacherClasses((prev) => {
      const updated = prev.includes(cls)
        ? prev.filter((c) => c !== cls)
        : [...prev, cls];
      const composed = composeSpecialty(teacherSubjects, updated);
      if (composed) setSubjectSpecialty(composed);
      return updated;
    });
  };

  const toggleTeacherSubject = (sub: string) => {
    setTeacherSubjects((prev) => {
      const updated = prev.includes(sub)
        ? prev.filter((s) => s !== sub)
        : [...prev, sub];
      const composed = composeSpecialty(updated, teacherClasses);
      if (composed) setSubjectSpecialty(composed);
      return updated;
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleRef = useRef<"STUDENT" | "TEACHER">(role);
  roleRef.current = role;
  const schoolNameRef = useRef(schoolName);
  schoolNameRef.current = schoolName;
  const classGradeRef = useRef(classGrade);
  classGradeRef.current = classGrade;
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const rollNoRef = useRef(rollNo);
  rollNoRef.current = rollNo;
  const subjectSpecialtyRef = useRef(subjectSpecialty);
  subjectSpecialtyRef.current = subjectSpecialty;
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Handle Google Credential with chosen role and profile
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError("Google sign-up was cancelled.");
      return;
    }

    setLoading(true);
    setError(null);

    const chosenRole = roleRef.current;

    try {
      const res = await fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          role: chosenRole,
          schoolName: schoolNameRef.current.trim(),
          classGrade: chosenRole === "STUDENT" ? classGradeRef.current : undefined,
          section: chosenRole === "STUDENT" ? sectionRef.current : undefined,
          rollNo: chosenRole === "STUDENT" && rollNoRef.current.trim() ? rollNoRef.current.trim() : undefined,
          subjectSpecialty: chosenRole === "TEACHER" ? subjectSpecialtyRef.current : undefined,
          phone: chosenRole === "TEACHER" && phoneRef.current.trim() ? phoneRef.current.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = data.redirectUrl || "/";
      } else {
        setError(data.error || "Google sign-up could not be completed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to sign-up service. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const initGoogleIdentityServices = () => {
    if (!window.google?.accounts?.id) return;

    if (googleClientId && googleClientId.trim().length > 0) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId.trim(),
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          });
        }
      } catch (err) {
        console.error("GIS initialization error:", err);
      }
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.id) {
      initGoogleIdentityServices();
    }
  }, [googleClientId, role, classGrade, section, rollNo, subjectSpecialty, schoolName, phone]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          schoolName: schoolName.trim(),
          classGrade: role === "STUDENT" ? classGrade : undefined,
          section: role === "STUDENT" ? section : undefined,
          rollNo: role === "STUDENT" && rollNo.trim() ? rollNo.trim() : undefined,
          subjectSpecialty: role === "TEACHER" ? subjectSpecialty : undefined,
          phone: role === "TEACHER" && phone.trim() ? phone.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = data.redirectUrl || "/";
      } else {
        setError(data.error || "Unable to create account. Please check your information.");
      }
    } catch (err) {
      setError("Unable to connect to sign-up service. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleIdentityServices}
      />

      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4 px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>

          {/* Logo Header */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  ClassBoard
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500">First-Time User Registration</p>
            </div>
          </div>

          <h2 className="mt-5 text-center text-2xl font-extrabold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500">
            Join ClassBoard to track homework, manage books, or review exercises
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE ROLE */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                1. Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    role === "STUDENT"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20"
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
                    Student
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Track homework, solve questions, and submit exercise proofs.
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Learner Dashboard
                    </span>
                  </div>
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    role === "TEACHER"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20"
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
                    Teacher
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Assign books, schedule homework, and monitor chapter progress.
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Educator Dashboard
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 2: BASIC INFORMATION */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  2. Basic Information
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikash Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          placeholder="At least 6 chars"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: ROLE DETAILS */}
              <div className="pt-2">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  3. {role === "STUDENT" ? "Student Academic Details" : "Teacher Department & Specialty"}
                </label>

                {role === "STUDENT" ? (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        School / Institution Name
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Delhi Public School"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>

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
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        School / Academy / Institute
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. ClassBoard Academy / Delhi Public School"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* 1. Classes Multi-Select */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Classes / Grades You Teach (Select Multiple) *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherClasses([...STANDARD_CLASSES]);
                              const composed = composeSpecialty(teacherSubjects, STANDARD_CLASSES);
                              if (composed) setSubjectSpecialty(composed);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            All Classes
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherClasses([]);
                              const composed = composeSpecialty(teacherSubjects, []);
                              if (composed) setSubjectSpecialty(composed);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                        {STANDARD_CLASSES.map((cls) => {
                          const isSelected = teacherClasses.includes(cls);
                          return (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => toggleTeacherClass(cls)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-2xs"
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
                        <label className="block text-xs font-bold text-slate-700">
                          Subjects You Teach (Select Multiple) *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherSubjects([...STANDARD_SUBJECTS]);
                              const composed = composeSpecialty(STANDARD_SUBJECTS, teacherClasses);
                              if (composed) setSubjectSpecialty(composed);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherSubjects([]);
                              const composed = composeSpecialty([], teacherClasses);
                              if (composed) setSubjectSpecialty(composed);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                        {STANDARD_SUBJECTS.map((sub) => {
                          const isSelected = teacherSubjects.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleTeacherSubject(sub)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              <span>{sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Combined Specialty Text & Contact Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Subject Specialty Summary *
                        </label>
                        <input
                          type="text"
                          required
                          value={subjectSpecialty}
                          onChange={(e) => setSubjectSpecialty(e.target.value)}
                          placeholder="e.g. Mathematics & Science (Class 9, Class 10)"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                        />
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
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Creating Account..." : `Sign Up as ${role === "TEACHER" ? "Teacher" : "Student"}`}</span>
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-semibold text-slate-400 text-[11px] tracking-wider uppercase">
                  OR SIGN UP WITH GOOGLE
                </span>
              </div>
            </div>

            {/* Official Google Identity Services Container */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-[11px] text-slate-500 text-center">
                Google will automatically assign you as <strong className="text-slate-900">{role === "TEACHER" ? "Teacher" : "Student"}</strong> based on your selection above.
              </p>
              <div
                id="google-signup-container"
                ref={googleBtnRef}
                className="min-h-[44px] flex items-center justify-center w-full"
              />
            </div>

            {/* Bottom Links */}
            <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-800 font-bold ml-1"
              >
                Sign In here
              </Link>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Role-Based Academic Authentication • ClassBoard v2.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
