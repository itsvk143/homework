import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  listDemoUsers,
  createSessionToken,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const headerUserId = req.headers.get("x-user-id");
    const headerUserEmail = req.headers.get("x-user-email");
    const headerUserRole = req.headers.get("x-user-role");
    const headerSessionToken = req.headers.get("x-session-token");
    const fallback = headerUserEmail || headerUserId;

    const user = await getCurrentUser(fallback, headerSessionToken, headerUserRole);
    const demoUsers = await listDemoUsers();

    let sessionToken = "";
    if (user) {
      sessionToken = createSessionToken(user);
    }

    const response = NextResponse.json(
      {
        user,
        sessionToken,
        demoUsers,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );

    // If user is authenticated, keep session refreshed for 1 full year
    if (user) {
      response.cookies.set("cb_user_id", user.id, SESSION_COOKIE_OPTIONS);
      response.cookies.set("cb_user_email", user.email, SESSION_COOKIE_OPTIONS);
      response.cookies.set("cb_user_role", user.role, SESSION_COOKIE_OPTIONS);
      if (sessionToken) {
        response.cookies.set("cb_session", sessionToken, SESSION_COOKIE_OPTIONS);
      }
    }

    return response;
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { error: "Failed to fetch user session" },
      { status: 500 }
    );
  }
}
