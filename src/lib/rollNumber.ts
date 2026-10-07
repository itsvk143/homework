import { prisma } from "./prisma";

/**
 * Computes the next sequential roll number for a student.
 * Scoped by classGrade and section (e.g. "NEET Dropper", section "A").
 * Starts at 1.
 */
export async function getNextRollNumber(
  classGrade: string = "NEET Dropper",
  section: string = "A"
): Promise<string> {
  try {
    const cleanGrade = classGrade.trim();
    const cleanSection = section.trim();

    const existingProfiles = await prisma.studentProfile.findMany({
      where: {
        classGrade: cleanGrade,
        section: cleanSection,
      },
      select: { rollNo: true },
    });

    let maxRoll = 0;
    for (const prof of existingProfiles) {
      if (prof.rollNo) {
        const num = parseInt(prof.rollNo.trim(), 10);
        if (!isNaN(num) && num > maxRoll) {
          maxRoll = num;
        }
      }
    }

    // Numbering starts from 1
    return String(maxRoll + 1);
  } catch (error) {
    console.error("Error computing next roll number:", error);
    return "1";
  }
}
