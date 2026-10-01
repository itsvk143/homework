import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, listDemoUsers, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const headerUserId = req.headers.get("x-user-id");
    const headerUserEmail = req.headers.get("x-user-email");
    const fallback = headerUserEmail || headerUserId;

    const user = await getCurrentUser(fallback);
    const demoUsers = await listDemoUsers();

    const response = NextResponse.json({
      user,
      demoUsers,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

    // If user is authenticated, keep session refreshed for 1 year
    if (user) {
      response.cookies.set("cb_user_id", user.id, SESSION_COOKIE_OPTIONS);
      response.cookies.set("cb_user_email", user.email, SESSION_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
