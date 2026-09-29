import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: "default",
          requireTeacherVerification: true,
          sequentialExerciseCompletion: false,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { requireTeacherVerification, sequentialExerciseCompletion } = body;

    const settings = await prisma.systemSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        requireTeacherVerification: requireTeacherVerification ?? true,
        sequentialExerciseCompletion: sequentialExerciseCompletion ?? false,
      },
      update: {
        ...(requireTeacherVerification !== undefined ? { requireTeacherVerification } : {}),
        ...(sequentialExerciseCompletion !== undefined ? { sequentialExerciseCompletion } : {}),
      },
    });

    await logAuditEvent({
      action: "UPDATE_SYSTEM_SETTINGS",
      entityType: "SystemSetting",
      entityId: "default",
      metadata: { requireTeacherVerification, sequentialExerciseCompletion },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
