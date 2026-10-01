import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "User switching is disabled. Authentication is required. Please log in with your own account." },
    { status: 403 }
  );
}

