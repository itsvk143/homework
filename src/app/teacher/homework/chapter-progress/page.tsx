"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TeacherChapterProgress } from "@/components/TeacherChapterProgress";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function ChapterProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const chapterId = searchParams.get("chapterId");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("cb_user_id") : null;
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("cb_user_email") : null;
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("cb_user_role") : null;
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("cb_session_token") : null;
      const headers: Record<string, string> = {};
      if (storedId) headers["x-user-id"] = storedId;
      if (storedEmail) headers["x-user-email"] = storedEmail;
      if (storedRole) headers["x-user-role"] = storedRole;
      if (storedToken) headers["x-session-token"] = storedToken;

      const res = await fetch("/api/auth/me", { cache: "no-store", headers });
      if (res.ok) {
        const data = await res.json();
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (data.user.role === "STUDENT") {
          router.replace("/");
          return;
        }
        if (typeof window !== "undefined") {
          if (data.user.id) localStorage.setItem("cb_user_id", data.user.id);
          if (data.user.email) localStorage.setItem("cb_user_email", data.user.email);
          if (data.user.role) localStorage.setItem("cb_user_role", data.user.role);
          if (data.sessionToken) localStorage.setItem("cb_session_token", data.sessionToken);
        }
        setCurrentUser(data.user);
      } else {
        router.replace("/login");
      }
    } catch (err) {
      console.error(err);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Chapter Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentUser={currentUser}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
        <div className="print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <TeacherChapterProgress
          currentUser={currentUser}
          initialBookId={bookId}
          initialChapterId={chapterId}
        />
      </main>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <footer className="border-t border-slate-200/80 bg-white/50 py-4 text-center text-xs text-slate-400 print:hidden">
        TRACKER Academic Platform • Teacher Chapter Progress Matrix
      </footer>
    </div>
  );
}

export default function ChapterProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChapterProgressContent />
    </Suspense>
  );
}
