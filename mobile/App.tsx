import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";

export default function App() {
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [activeTab, setActiveTab] = useState<string>("HOME");

  // Fast Progress Update Demo state (< 10 seconds flow)
  const [questionsCompleted, setQuestionsCompleted] = useState<number>(12);
  const totalQuestions = 20;
  const progressPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
  const remaining = Math.max(0, totalQuestions - questionsCompleted);

  const handleSaveProgress = () => {
    Alert.alert(
      "Progress Saved! 🎉",
      `Recorded ${questionsCompleted} / ${totalQuestions} Questions (${progressPercentage}%). Synced to server.`
    );
  };

  const handleMarkCompleted = () => {
    setQuestionsCompleted(20);
    Alert.alert("Completed! 🎉", "Exercise 4.2 marked 100% completed!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>ClassBoard Mobile</Text>
          <Text style={styles.brandSubtitle}>
            {role === "STUDENT" ? "Rahul Kumar • Class 8-A" : "Mrs. Sunita Sharma • Teacher"}
          </Text>
        </View>

        {/* Role Toggle for demonstration */}
        <TouchableOpacity
          onPress={() => setRole(role === "STUDENT" ? "TEACHER" : "STUDENT")}
          style={styles.roleToggle}
        >
          <Text style={styles.roleToggleText}>Role: {role}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {role === "STUDENT" ? (
          <>
            {/* Quick Progress Card (Requirement 51) */}
            <View style={styles.quickCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.subjectBadge}>Mathematics</Text>
                <Text style={styles.dueBadge}>Due Today</Text>
              </View>

              <Text style={styles.bookTitle}>NCERT Mathematics Class 8</Text>
              <Text style={styles.exerciseTitle}>Chapter 4 — Exercise 4.2</Text>
              <Text style={styles.metaText}>Total Questions: {totalQuestions}</Text>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
              </View>

              {/* Question Count Display */}
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  {questionsCompleted} / {totalQuestions} Completed
                </Text>
                <Text style={styles.statsPercent}>{progressPercentage}%</Text>
              </View>

              <Text style={styles.remainingText}>{remaining} Questions Remaining</Text>

              {/* Number Input Stepper */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => setQuestionsCompleted(Math.max(0, questionsCompleted - 1))}
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>-</Text>
                </TouchableOpacity>

                <View style={styles.inputBox}>
                  <Text style={styles.inputValue}>{questionsCompleted}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setQuestionsCompleted(Math.min(totalQuestions, questionsCompleted + 1))}
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Fast Action Buttons */}
              <TouchableOpacity onPress={handleSaveProgress} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>SAVE PROGRESS</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleMarkCompleted} style={styles.completeButton}>
                <Text style={styles.completeButtonText}>✓ MARK EXERCISE COMPLETED</Text>
              </TouchableOpacity>
            </View>

            {/* Other Homeworks list preview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>More Assigned Homework</Text>
            </View>

            <View style={styles.hwItem}>
              <Text style={styles.hwSubject}>Science</Text>
              <Text style={styles.hwTitle}>Exercise 1.1 — Crop Production</Text>
              <Text style={styles.hwProgress}>10 / 10 Questions (100% Completed)</Text>
            </View>

            <View style={styles.hwItem}>
              <Text style={styles.hwSubject}>Mathematics</Text>
              <Text style={styles.hwTitle}>Exercise 3.2 — Quadrilaterals</Text>
              <Text style={styles.hwProgress}>0 / 6 Questions (Not Started)</Text>
            </View>
          </>
        ) : (
          /* TEACHER VIEW */
          <>
            <View style={styles.teacherStatsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Students</Text>
                <Text style={styles.statVal}>42</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Assigned Today</Text>
                <Text style={styles.statVal}>38</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={[styles.statVal, { color: "#10B981" }]}>27</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={[styles.statVal, { color: "#EF4444" }]}>3</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Student Submissions</Text>
            </View>

            <View style={styles.hwItem}>
              <Text style={styles.hwSubject}>Rahul Kumar • Math Ex 4.2</Text>
              <Text style={styles.hwTitle}>12 / 20 Questions Completed (60%)</Text>
              <Text style={styles.hwProgress}>Status: In Progress</Text>
            </View>

            <View style={styles.hwItem}>
              <Text style={styles.hwSubject}>Priya Patel • Math Ex 4.2</Text>
              <Text style={styles.hwTitle}>18 / 20 Questions Completed (90%)</Text>
              <Text style={styles.hwProgress}>Status: In Progress</Text>
            </View>

            <View style={styles.hwItem}>
              <Text style={styles.hwSubject}>Ananya Roy • Math Ex 4.2</Text>
              <Text style={styles.hwTitle}>20 / 20 Questions Completed (100%)</Text>
              <Text style={styles.hwProgress}>Status: Completed</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Tabs (Requirement 49 & 50) */}
      <View style={styles.bottomNav}>
        {role === "STUDENT" ? (
          <>
            <TouchableOpacity onPress={() => setActiveTab("HOME")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "HOME" && styles.navTextActive]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("HW")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "HW" && styles.navTextActive]}>Homework</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("CAL")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "CAL" && styles.navTextActive]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("PROG")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "PROG" && styles.navTextActive]}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("PROF")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "PROF" && styles.navTextActive]}>Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setActiveTab("DASH")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "DASH" && styles.navTextActive]}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("STU")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "STU" && styles.navTextActive]}>Students</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("HW")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "HW" && styles.navTextActive]}>Homework</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("REP")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "REP" && styles.navTextActive]}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("PROF")} style={styles.navItem}>
              <Text style={[styles.navText, activeTab === "PROF" && styles.navTextActive]}>Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  roleToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  roleToggleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4F46E5",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  quickCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subjectBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  statsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  statsPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4F46E5",
  },
  remainingText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 8,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  inputBox: {
    width: 80,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  saveButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  completeButton: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  completeButtonText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  hwItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  hwSubject: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  hwProgress: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  teacherStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 4,
  },
  bottomNav: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  navText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  navTextActive: {
    color: "#4F46E5",
    fontWeight: "800",
  },
});
