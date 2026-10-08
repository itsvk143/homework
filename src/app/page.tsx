"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StudentDashboard } from "@/components/StudentDashboard";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { MobileSimulator } from "@/components/MobileSimulator";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cb_user_data");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem("cb_user_data")) return false;
      } catch {}
    }
    return true;
  });
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load session - authentication required
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

      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          if (typeof window !== "undefined") {
            if (data.user.id) localStorage.setItem("cb_user_id", data.user.id);
            if (data.user.email) localStorage.setItem("cb_user_email", data.user.email);
            if (data.user.role) localStorage.setItem("cb_user_role", data.user.role);
            if (data.sessionToken) localStorage.setItem("cb_session_token", data.sessionToken);
            localStorage.setItem("cb_user_data", JSON.stringify(data.user));
          }

          const needsOnboarding = data.user.role === "PENDING";

          if (needsOnboarding) {
            router.replace("/onboarding");
            return;
          }
          setCurrentUser(data.user);
        } else {
          // Authentication required: redirect to login
          if (typeof window !== "undefined") localStorage.removeItem("cb_user_data");
          router.replace("/login");
          return;
        }
      } else {
        if (typeof window !== "undefined") localStorage.removeItem("cb_user_data");
        router.replace("/login");
        return;
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      if (typeof window !== "undefined") localStorage.removeItem("cb_user_data");
      router.replace("/login");
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Keyboard shortcut for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top App Header */}
      <Navbar
        currentUser={currentUser}
        onOpenSearch={() => setIsSearchOpen(true)}
        isMobileSimulator={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator(!isMobileSimulator)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isMobileSimulator ? (
          <MobileSimulator
            currentUser={currentUser}
            onRefreshData={fetchSession}
          />
        ) : (
          <>
            {currentUser?.role === "STUDENT" && (
              <StudentDashboard currentUser={currentUser} />
            )}

            {currentUser?.role === "TEACHER" && (
              <TeacherDashboard currentUser={currentUser} />
            )}

            {currentUser?.role === "ADMIN" && (
              <AdminDashboard />
            )}
          </>
        )}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 py-4 text-center text-xs text-slate-400">
        TRACKER Academic Platform • Predefined Content Hierarchy & Question-Level Progress Tracking
      </footer>
    </div>
  );
}
