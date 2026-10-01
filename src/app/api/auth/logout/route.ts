import { NextResponse } from "next/server";
import { SESSION_CLEAR_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set("cb_user_id", "", SESSION_CLEAR_COOKIE_OPTIONS);
  response.cookies.set("cb_user_email", "", SESSION_CLEAR_COOKIE_OPTIONS);
  response.cookies.set("cb_user_role", "", SESSION_CLEAR_COOKIE_OPTIONS);
  response.cookies.set("cb_session", "", SESSION_CLEAR_COOKIE_OPTIONS);
  return response;
}
