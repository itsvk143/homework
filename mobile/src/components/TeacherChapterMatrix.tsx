// mobile/src/components/TeacherChapterMatrix.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { StudentProgress } from "../types";
import { InteractiveCard } from "./InteractiveCard";
import { AnimatedProgress } from "./AnimatedProgress";
import { AnimatedButton } from "./AnimatedButton";

interface Props {
  examName?: string;
  subjectName?: string;
  bookName?: string;
  chapterName?: string;
  data: StudentProgress[];
}

export const TeacherChapterMatrix: React.FC<Props> = ({
  examName = "NEET",
  subjectName = "Physical Chemistry",
  bookName = "Narendra Avasthi",
  chapterName = "Mole Concept",
  data,
}) => {
  const { theme } = useTheme();
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [viewMode, setViewMode] = useState<"CARDS" | "MATRIX">("CARDS");

  // Exercise headers (1 to 4)
  const exerciseHeaders = [1, 2, 3, 4];

  return (
    <View style={styles.container}>
      {/* Chapter & Subject Header */}
      <View style={[styles.headerBanner, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
        <View style={styles.tagRow}>
          <Text style={[styles.examBadge, { backgroundColor: theme.accentPrimary }]}>
            {examName}
          </Text>
          <Text style={[styles.subjectTag, { color: theme.accentSecondary }]}>
            {subjectName}
          </Text>
        </View>

        <Text style={[styles.chapterTitle, { color: theme.textPrimary }]}>
          {chapterName}
        </Text>
        <Text style={[styles.bookSubtitle, { color: theme.textSecondary }]}>
          Textbook: {bookName}
        </Text>

        {/* View Switcher: Mobile Cards vs Spreadsheet Matrix */}
        <View style={styles.switcherRow}>
          <Pressable
            onPress={() => setViewMode("CARDS")}
            style={[
              styles.switchTab,
              viewMode === "CARDS" && { backgroundColor: theme.accentPrimary },
            ]}
          >
            <Text
              style={[
                styles.switchText,
                { color: viewMode === "CARDS" ? "#FFFFFF" : theme.textMuted },
              ]}
            >
              Card View
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode("MATRIX")}
            style={[
              styles.switchTab,
              viewMode === "MATRIX" && { backgroundColor: theme.accentPrimary },
            ]}
          >
            <Text
              style={[
                styles.switchText,
                { color: viewMode === "MATRIX" ? "#FFFFFF" : theme.textMuted },
              ]}
            >
              Spreadsheet Matrix
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 1. SPREADSHEET MATRIX (Horizontal Scrolling) */}
      {viewMode === "MATRIX" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matrixScroll}>
          <View>
            {/* Table Header */}
            <View style={[styles.matrixHeaderRow, { backgroundColor: theme.surfaceSubtle }]}>
              <View style={[styles.cellStudent, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.headerColText, { color: theme.textPrimary }]}>Student</Text>
              </View>
              {exerciseHeaders.map((exNum) => (
                <View key={exNum} style={[styles.cellEx, { borderColor: theme.cardBorder }]}>
                  <Text style={[styles.headerColText, { color: theme.textPrimary }]}>Ex {exNum}</Text>
                </View>
              ))}
              <View style={[styles.cellOverall, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.headerColText, { color: theme.textPrimary }]}>Overall</Text>
              </View>
            </View>

            {/* Table Rows */}
            {data.map((student) => (
              <Pressable
                key={student.studentId}
                onPress={() => setSelectedStudent(student)}
                style={({ pressed }) => [
                  styles.matrixRow,
                  {
                    backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <View style={[styles.cellStudent, { borderColor: theme.cardBorder }]}>
                  <Text style={[styles.studentNameText, { color: theme.textPrimary }]}>
                    {student.studentName}
                  </Text>
                  {student.rollNo && (
                    <Text style={[styles.studentRollText, { color: theme.textMuted }]}>
                      Roll #{student.rollNo}
                    </Text>
                  )}
                </View>

                {exerciseHeaders.map((exNum) => {
                  const score = student.exerciseScores.find((e) => e.exerciseNumber === exNum);
                  return (
                    <View key={exNum} style={[styles.cellEx, { borderColor: theme.cardBorder }]}>
                      {score ? (
                        <View style={styles.matrixScoreBox}>
                          <Text
                            style={[
                              styles.matrixScoreText,
                              {
                                color:
                                  score.completed === score.total && score.total > 0
                                    ? theme.accentSuccess
                                    : score.completed > 0
                                    ? theme.textPrimary
                                    : theme.textMuted,
                              },
                            ]}
                          >
                            {score.completed}/{score.total}
                          </Text>
                          {score.completed === score.total && score.total > 0 && (
                            <Text style={[styles.checkText, { color: theme.accentSuccess }]}>✓</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={[styles.matrixScoreText, { color: theme.textMuted }]}>--</Text>
                      )}
                    </View>
                  );
                })}

                <View style={[styles.cellOverall, { borderColor: theme.cardBorder }]}>
                  <Text
                    style={[
                      styles.matrixOverallText,
                      {
                        color:
                          student.overallPercentage >= 80
                            ? theme.accentSuccess
                            : student.overallPercentage >= 50
                            ? theme.accentPrimary
                            : theme.accentWarning,
                      },
                    ]}
                  >
                    {student.overallPercentage}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* 2. CARD VIEW (Optimized for Mobile) */
        <View style={styles.cardList}>
          {data.map((student) => (
            <InteractiveCard
              key={student.studentId}
              onPress={() => setSelectedStudent(student)}
              style={styles.studentCard}
            >
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={[styles.studentCardName, { color: theme.textPrimary }]}>
                    {student.studentName}
                  </Text>
                  <Text style={[styles.studentCardRoll, { color: theme.textMuted }]}>
                    Roll #{student.rollNo || "--"} • Class Progress
                  </Text>
                </View>
                <View
                  style={[
                    styles.overallPill,
                    {
                      backgroundColor:
                        student.overallPercentage >= 80
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(99, 102, 241, 0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.overallPillText,
                      {
                        color:
                          student.overallPercentage >= 80
                            ? theme.accentSuccess
                            : theme.accentPrimary,
                      },
                    ]}
                  >
                    {student.overallPercentage}%
                  </Text>
                </View>
              </View>

              <AnimatedProgress
                percentage={student.overallPercentage}
                height={6}
                style={{ marginVertical: 10 }}
              />

              {/* Grid of Exercises */}
              <View style={styles.exChipsRow}>
                {student.exerciseScores.map((ex) => (
                  <View
                    key={ex.exerciseNumber}
                    style={[
                      styles.exChip,
                      {
                        backgroundColor:
                          ex.completed === ex.total && ex.total > 0
                            ? "rgba(16, 185, 129, 0.12)"
                            : ex.completed > 0
                            ? "rgba(99, 102, 241, 0.10)"
                            : theme.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.exChipLabel, { color: theme.textMuted }]}>
                      Ex {ex.exerciseNumber}
                    </Text>
                    <Text
                      style={[
                        styles.exChipVal,
                        {
                          color:
                            ex.completed === ex.total && ex.total > 0
                              ? theme.accentSuccess
                              : theme.textPrimary,
                        },
                      ]}
                    >
                      {ex.completed}/{ex.total} {ex.completed === ex.total && ex.total > 0 ? "✓" : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </InteractiveCard>
          ))}
        </View>
      )}

      {/* 3. STUDENT DETAIL MODAL (Touch Drill-Down) */}
      {selectedStudent && (
        <Modal
          animationType="fade"
          transparent
          visible={!!selectedStudent}
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.surface, borderColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {selectedStudent.studentName}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                {chapterName} • Detailed Exercise Matrix
              </Text>

              <View style={styles.modalStatsOverview}>
                <View>
                  <Text style={[styles.modalStatsLabel, { color: theme.textMuted }]}>
                    Chapter Completion
                  </Text>
                  <Text style={[styles.modalStatsVal, { color: theme.accentSuccess }]}>
                    {selectedStudent.overallPercentage}%
                  </Text>
                </View>
              </View>

              <ScrollView style={{ maxHeight: 240, marginVertical: 12 }}>
                {selectedStudent.exerciseScores.map((score) => (
                  <View
                    key={score.exerciseNumber}
                    style={[
                      styles.modalScoreRow,
                      { borderBottomColor: theme.cardBorder },
                    ]}
                  >
                    <View>
                      <Text style={[styles.modalExTitle, { color: theme.textPrimary }]}>
                        {score.exerciseName || `Exercise ${score.exerciseNumber}`}
                      </Text>
                      <Text style={[styles.modalExStatus, { color: theme.textMuted }]}>
                        Status: {score.status}
                      </Text>
                    </View>
                    <View style={styles.modalExRight}>
                      <Text style={[styles.modalExScore, { color: theme.textPrimary }]}>
                        {score.completed} / {score.total}
                      </Text>
                      {score.completed === score.total && score.total > 0 && (
                        <Text style={{ color: theme.accentSuccess, fontWeight: "900" }}> ✓</Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <AnimatedButton
                title="Close Student Details"
                variant="secondary"
                onPress={() => setSelectedStudent(null)}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerBanner: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  examBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: "uppercase",
  },
  subjectTag: {
    fontSize: 11,
    fontWeight: "700",
  },
  chapterTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bookSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  switcherRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  switchText: {
    fontSize: 11,
    fontWeight: "700",
  },
  matrixScroll: {
    marginBottom: 16,
  },
  matrixHeaderRow: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  headerColText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  matrixRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 6,
    paddingVertical: 10,
  },
  cellStudent: {
    width: 120,
    paddingLeft: 10,
  },
  cellEx: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  cellOverall: {
    width: 70,
    alignItems: "center",
  },
  studentNameText: {
    fontSize: 12,
    fontWeight: "700",
  },
  studentRollText: {
    fontSize: 9,
  },
  matrixScoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  matrixScoreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  checkText: {
    fontSize: 10,
    fontWeight: "900",
  },
  matrixOverallText: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardList: {
    gap: 8,
  },
  studentCard: {
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentCardName: {
    fontSize: 14,
    fontWeight: "700",
  },
  studentCardRoll: {
    fontSize: 10,
    marginTop: 1,
  },
  overallPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  overallPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  exChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  exChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 60,
  },
  exChipLabel: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exChipVal: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  modalStatsOverview: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: 8,
  },
  modalStatsLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalStatsVal: {
    fontSize: 22,
    fontWeight: "900",
  },
  modalScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalExTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalExStatus: {
    fontSize: 10,
    marginTop: 1,
  },
  modalExRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalExScore: {
    fontSize: 13,
    fontWeight: "800",
  },
});
