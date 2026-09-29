import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: {
        _count: {
          select: { books: true, homeworks: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, classGrade, code, description, color, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        classGrade: classGrade || "Class 8",
        code: code?.trim() || null,
        description: description?.trim() || null,
        color: color || "#4F46E5",
        icon: icon || "book-open",
        status: "ACTIVE",
      },
    });

    await logAuditEvent({
      action: "CREATE_SUBJECT",
      entityType: "Subject",
      entityId: subject.id,
      metadata: { name: subject.name, classGrade: subject.classGrade },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
