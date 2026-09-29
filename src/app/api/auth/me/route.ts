import { NextResponse } from "next/server";
import { getCurrentUser, listDemoUsers } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const demoUsers = await listDemoUsers();

    return NextResponse.json({
      user,
      demoUsers,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
