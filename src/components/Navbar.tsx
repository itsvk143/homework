"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Bell,
  Search,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  ChevronDown,
  UserCheck,
  Settings,
  X,
  LogIn,
  LogOut,
} from "lucide-react";

import { EditProfileModal } from "@/components/EditProfileModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  studentProfile?: {
    classGrade: string;
    section: string;
    rollNo?: string | null;
  } | null;
  teacherProfile?: {
    subjectSpecialty: string;
  } | null;
}

interface NavbarProps {
  currentUser: User | null;
  onOpenSearch: () => void;
  isMobileSimulator?: boolean;
  onToggleMobileSimulator?: () => void;
}

export function Navbar({
  currentUser,
  onOpenSearch,
  isMobileSimulator = false,
  onToggleMobileSimulator,
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, userId: currentUser.id }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "TEACHER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "STUDENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                ClassBoard
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Academic Hierarchy & Homework Platform
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search students, books, exercises...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Simulator Toggle */}
          {onToggleMobileSimulator && (
            <button
              onClick={onToggleMobileSimulator}
              title={isMobileSimulator ? "Switch to Desktop View" : "Preview Mobile App Experience"}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                isMobileSimulator
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/30"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {isMobileSimulator ? (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Mobile Preview</span>
                </>
              )}
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-subtle-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-md">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl my-1 transition-colors ${
                          notif.read ? "bg-white" : "bg-indigo-50/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.read ? "bg-slate-300" : "bg-indigo-600"}`} />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 inline-block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated User Account Menu */}
          <div className="relative">
            {currentUser ? (
              <>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {currentUser.name?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                          currentUser.role
                        )}`}
                      >
                        {currentUser.role}
                      </span>
                      {currentUser.studentProfile && (
                        <span className="text-[10px] text-slate-500">
                          {currentUser.studentProfile.classGrade}-{currentUser.studentProfile.section}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                            {currentUser.name?.slice(0, 2).toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {currentUser.email}
                          </p>
                          <div className="mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                                currentUser.role
                              )}`}
                            >
                              {currentUser.role} ACCOUNT
                            </span>
                          </div>
                        </div>
                      </div>

                      {currentUser.studentProfile && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-800">
                            {currentUser.studentProfile.classGrade} • Section {currentUser.studentProfile.section}
                          </p>
                          <p className="text-slate-500">
                            Roll No: {currentUser.studentProfile.rollNo || "Unassigned"}
                          </p>
                        </div>
                      )}

                      {currentUser.teacherProfile && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-600">
                          <p className="font-semibold text-slate-800">
                            Specialty: {currentUser.teacherProfile.subjectSpecialty}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 px-3 space-y-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setIsEditProfileOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            if (typeof window !== "undefined") {
                              localStorage.removeItem("cb_user_id");
                              localStorage.removeItem("cb_user_email");
                              localStorage.removeItem("cb_user_role");
                              localStorage.removeItem("cb_session_token");
                            }
                            await fetch("/api/auth/logout", { method: "POST" });
                          } catch (e) {
                            console.error("Logout error:", e);
                          }
                          window.location.href = "/login?logged_out=true";
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile & Role Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
        />
      )}
    </header>
  );
}
