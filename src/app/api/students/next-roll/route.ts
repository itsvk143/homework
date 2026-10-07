import { NextRequest, NextResponse } from "next/server";
import { getNextRollNumber } from "@/lib/rollNumber";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classGrade = searchParams.get("classGrade") || "NEET Dropper";
    const section = searchParams.get("section") || "A";

    const nextRollNo = await getNextRollNumber(classGrade, section);
    return NextResponse.json({ nextRollNo });
  } catch (error) {
    console.error("Error getting next roll number:", error);
    return NextResponse.json({ nextRollNo: "1" });
  }
}
