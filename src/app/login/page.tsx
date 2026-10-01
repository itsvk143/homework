"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, ArrowLeft, ShieldCheck, Lock } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // 1. Check existing session on mount - if logged in and not explicitly logged out, auto-redirect immediately!
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logged_out") === "true") {
      setCheckingSession(false);
      return;
    }

    const storedId = typeof window !== "undefined" ? localStorage.getItem("cb_user_id") : null;
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("cb_user_email") : null;
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("cb_user_role") : null;
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("cb_session_token") : null;
    const headers: Record<string, string> = {};
    if (storedId) headers["x-user-id"] = storedId;
    if (storedEmail) headers["x-user-email"] = storedEmail;
    if (storedRole) headers["x-user-role"] = storedRole;
    if (storedToken) headers["x-session-token"] = storedToken;

    fetch("/api/auth/me", {
      cache: "no-store",
      headers,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.id) localStorage.setItem("cb_user_id", data.user.id);
          if (data.user.email) localStorage.setItem("cb_user_email", data.user.email);
          if (data.user.role) localStorage.setItem("cb_user_role", data.user.role);
          if (data.sessionToken) localStorage.setItem("cb_session_token", data.sessionToken);
          window.location.href = "/";
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError("Google sign-in was cancelled.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("cb_user_role") : null;
      const res = await fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          role: storedRole || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remember in localStorage for resilience
        if (data.user?.id) localStorage.setItem("cb_user_id", data.user.id);
        if (data.user?.email) localStorage.setItem("cb_user_email", data.user.email);
        if (data.user?.role) localStorage.setItem("cb_user_role", data.user.role);
        if (data.sessionToken) localStorage.setItem("cb_session_token", data.sessionToken);
        window.location.href = data.redirectUrl || "/";
      } else {
        setError(data.error || "Google authentication could not be verified. Please try again.");
      }
    } catch (err) {
      setError("Unable to sign in with Google right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const initGoogleIdentityServices = () => {
    if (!window.google?.accounts?.id) return;
    setGisLoaded(true);

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
            text: "continue_with",
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
  }, [googleClientId]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remember in localStorage for resilience
        if (data.user?.id) localStorage.setItem("cb_user_id", data.user.id);
        if (data.user?.email) localStorage.setItem("cb_user_email", data.user.email);
        if (data.user?.role) localStorage.setItem("cb_user_role", data.user.role);
        if (data.sessionToken) localStorage.setItem("cb_session_token", data.sessionToken);
        window.location.href = data.redirectUrl || "/";
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (err) {
      setError("Unable to process login. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 animate-pulse mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <p className="text-xs font-semibold text-slate-600 tracking-wide animate-pulse">
          Restoring your session...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Official Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleIdentityServices}
      />

      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4 px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Platform</span>
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
              <p className="text-xs text-slate-500">Academic & Homework Platform</p>
            </div>
          </div>

          <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500">
            Access students, homework tracking, and curriculum
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "LOGIN"}
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-semibold text-slate-400 text-[11px] tracking-wider uppercase">
                  OR
                </span>
              </div>
            </div>

            {/* Official Google Identity Services Container */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div
                id="google-signin-container"
                ref={googleBtnRef}
                className="min-h-[44px] flex items-center justify-center w-full"
              />

              {!googleClientId && (
                <div className="text-center p-3 bg-amber-50 border border-amber-200/80 rounded-2xl w-full">
                  <p className="text-[11px] font-semibold text-amber-800">
                    Google OAuth Client ID Not Yet Configured
                  </p>
                  <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
                    Add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> or Vercel Environment Variables.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Links */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setError("Please contact your school administrator or check your registered email.")}
                className="hover:text-indigo-600 transition-colors font-medium text-[11px]"
              >
                Forgot Password?
              </button>
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1"
              >
                <span>New User? Create Account</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Google Identity Services • Encrypted Server Verification</span>
          </div>
        </div>
      </div>
    </>
  );
}
