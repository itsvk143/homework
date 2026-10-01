// mobile/App.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { PerformanceProvider, usePerformance } from "./src/context/PerformanceContext";
import { InteractiveBackground } from "./src/components/InteractiveBackground";
import { StudentHomeDashboard } from "./src/components/StudentHomeDashboard";
import { TeacherChapterMatrix } from "./src/components/TeacherChapterMatrix";
import { LiveNotificationBadge } from "./src/components/LiveNotificationBadge";
import { StudentProgress, Role, PerformanceMode } from "./src/types";

// Demo NEET/JEE chapter progress data for teacher matrix
const DEMO_STUDENT_MATRIX: StudentProgress[] = [
  {
    studentId: "s-1",
    studentName: "Rahul Kumar",
    rollNo: "14",
    overallPercentage: 68,
    exerciseScores: [
      { exerciseNumber: 1, exerciseName: "Ex 1 — Mole Concept Basics", completed: 20, total: 20, status: "COMPLETED" },
      { exerciseNumber: 2, exerciseName: "Ex 2 — Molar Mass & Gas Laws", completed: 15, total: 20, status: "IN_PROGRESS" },
      { exerciseNumber: 3, exerciseName: "Ex 3 — Limiting Reagents", completed: 10, total: 15, status: "IN_PROGRESS" },
      { exerciseNumber: 4, exerciseName: "Ex 4 — Concentration Terms", completed: 0, total: 20, status: "NOT_STARTED" },
    ],
  },
  {
    studentId: "s-2",
    studentName: "Priya Patel",
    rollNo: "22",
    overallPercentage: 92,
    exerciseScores: [
      { exerciseNumber: 1, exerciseName: "Ex 1 — Mole Concept Basics", completed: 20, total: 20, status: "COMPLETED" },
      { exerciseNumber: 2, exerciseName: "Ex 2 — Molar Mass & Gas Laws", completed: 20, total: 20, status: "COMPLETED" },
      { exerciseNumber: 3, exerciseName: "Ex 3 — Limiting Reagents", completed: 15, total: 15, status: "COMPLETED" },
      { exerciseNumber: 4, exerciseName: "Ex 4 — Concentration Terms", completed: 16, total: 20, status: "IN_PROGRESS" },
    ],
  },
  {
    studentId: "s-3",
    studentName: "Aman Singh",
    rollNo: "05",
    overallPercentage: 45,
    exerciseScores: [
      { exerciseNumber: 1, exerciseName: "Ex 1 — Mole Concept Basics", completed: 18, total: 20, status: "IN_PROGRESS" },
      { exerciseNumber: 2, exerciseName: "Ex 2 — Molar Mass & Gas Laws", completed: 10, total: 20, status: "IN_PROGRESS" },
      { exerciseNumber: 3, exerciseName: "Ex 3 — Limiting Reagents", completed: 5, total: 15, status: "IN_PROGRESS" },
      { exerciseNumber: 4, exerciseName: "Ex 4 — Concentration Terms", completed: 0, total: 20, status: "NOT_STARTED" },
    ],
  },
  {
    studentId: "s-4",
    studentName: "Ananya Roy",
    rollNo: "08",
    overallPercentage: 86,
    exerciseScores: [
      { exerciseNumber: 1, exerciseName: "Ex 1 — Mole Concept Basics", completed: 20, total: 20, status: "COMPLETED" },
      { exerciseNumber: 2, exerciseName: "Ex 2 — Molar Mass & Gas Laws", completed: 18, total: 20, status: "IN_PROGRESS" },
      { exerciseNumber: 3, exerciseName: "Ex 3 — Limiting Reagents", completed: 14, total: 15, status: "IN_PROGRESS" },
      { exerciseNumber: 4, exerciseName: "Ex 4 — Concentration Terms", completed: 12, total: 20, status: "IN_PROGRESS" },
    ],
  },
];

function MainApp() {
  const { theme, toggleTheme } = useTheme();
  const { performanceMode, setPerformanceMode } = usePerformance();
  const [role, setRole] = useState<Role>("STUDENT");
  const [activeTab, setActiveTab] = useState<string>("HOME");

  // Cycle through performance modes: HIGH -> NORMAL -> BATTERY_SAVER
  const cyclePerformanceMode = () => {
    const nextMode: Record<PerformanceMode, PerformanceMode> = {
      HIGH: "NORMAL",
      NORMAL: "BATTERY_SAVER",
      BATTERY_SAVER: "HIGH",
    };
    setPerformanceMode(nextMode[performanceMode]);
  };

  return (
    <InteractiveBackground>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar
          barStyle={theme.mode === "DARK" ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        {/* 1. TOP RESPONSIVE HEADER BAR */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.mode === "DARK" ? "rgba(17, 24, 39, 0.75)" : "rgba(255, 255, 255, 0.8)",
              borderBottomColor: theme.cardBorder,
            },
          ]}
        >
          {/* Logo & Identity */}
          <View style={styles.brandContainer}>
            <View style={[styles.brandLogoCircle, { backgroundColor: theme.accentPrimary }]}>
              <Text style={styles.brandLogoIcon}>✦</Text>
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>ClassBoard</Text>
                <View style={[styles.modePill, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
                  <Text style={[styles.modePillText, { color: theme.accentPrimary }]}>
                    {role}
                  </Text>
                </View>
              </View>
              <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
                Live-Wallpaper Mobile
              </Text>
            </View>
          </View>

          {/* Quick Header Action Controls */}
          <View style={styles.headerControls}>
            {/* Battery / Performance Mode Switcher */}
            <TouchableOpacity
              onPress={cyclePerformanceMode}
              style={[styles.iconButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceSubtle }]}
              accessibilityLabel="Toggle Battery Saver Performance Mode"
            >
              <Text style={[styles.iconBtnText, { color: theme.textPrimary }]}>
                {performanceMode === "BATTERY_SAVER" ? "🔋" : performanceMode === "HIGH" ? "⚡" : "✨"}
              </Text>
            </TouchableOpacity>

            {/* Dark / Light Mode Toggle */}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.iconButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceSubtle }]}
              accessibilityLabel="Toggle Dark / Light Theme"
            >
              <Text style={[styles.iconBtnText, { color: theme.textPrimary }]}>
                {theme.mode === "DARK" ? "☀️" : "🌙"}
              </Text>
            </TouchableOpacity>

            {/* Notification Bell with Animated Live Pulse Badge */}
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceSubtle }]}
              >
                <Text style={[styles.iconBtnText, { color: theme.textPrimary }]}>🔔</Text>
              </TouchableOpacity>
              <LiveNotificationBadge count={3} />
            </View>

            {/* Role Switcher (Student <-> Teacher) */}
            <TouchableOpacity
              onPress={() => setRole(role === "STUDENT" ? "TEACHER" : "STUDENT")}
              style={[styles.roleSwitchBtn, { backgroundColor: theme.accentPrimary }]}
            >
              <Text style={styles.roleSwitchText}>
                {role === "STUDENT" ? "Teacher View" : "Student View"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. BODY CONTENT (Interactive Dashboard) */}
        <View style={styles.body}>
          {role === "STUDENT" ? (
            <StudentHomeDashboard studentName="Rahul Kumar" classGrade="Class 8-A" />
          ) : (
            <View style={{ flex: 1, padding: 16 }}>
              <TeacherChapterMatrix
                examName="NEET"
                subjectName="Physical Chemistry"
                bookName="Narendra Avasthi"
                chapterName="Mole Concept & Stoichiometry"
                data={DEMO_STUDENT_MATRIX}
              />
            </View>
          )}
        </View>

        {/* 3. BOTTOM NAVIGATION BAR */}
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: theme.tabBarBackground,
              borderTopColor: theme.tabBarBorder,
            },
          ]}
        >
          {role === "STUDENT" ? (
            <>
              <TouchableOpacity onPress={() => setActiveTab("HOME")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "HOME" && { color: theme.accentPrimary }]}>🏠</Text>
                <Text style={[styles.navLabel, { color: activeTab === "HOME" ? theme.accentPrimary : theme.textMuted }]}>
                  Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("HW")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "HW" && { color: theme.accentPrimary }]}>📚</Text>
                <Text style={[styles.navLabel, { color: activeTab === "HW" ? theme.accentPrimary : theme.textMuted }]}>
                  Homework
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("PROGRESS")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "PROGRESS" && { color: theme.accentPrimary }]}>📊</Text>
                <Text style={[styles.navLabel, { color: activeTab === "PROGRESS" ? theme.accentPrimary : theme.textMuted }]}>
                  Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("PROFILE")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "PROFILE" && { color: theme.accentPrimary }]}>👤</Text>
                <Text style={[styles.navLabel, { color: activeTab === "PROFILE" ? theme.accentPrimary : theme.textMuted }]}>
                  Profile
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setActiveTab("MATRIX")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "MATRIX" && { color: theme.accentPrimary }]}>📑</Text>
                <Text style={[styles.navLabel, { color: activeTab === "MATRIX" ? theme.accentPrimary : theme.textMuted }]}>
                  Matrix
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("STUDENTS")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "STUDENTS" && { color: theme.accentPrimary }]}>👥</Text>
                <Text style={[styles.navLabel, { color: activeTab === "STUDENTS" ? theme.accentPrimary : theme.textMuted }]}>
                  Students
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("ASSIGN")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "ASSIGN" && { color: theme.accentPrimary }]}>✍️</Text>
                <Text style={[styles.navLabel, { color: activeTab === "ASSIGN" ? theme.accentPrimary : theme.textMuted }]}>
                  Assign
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("SETTINGS")} style={styles.navItem}>
                <Text style={[styles.navIcon, activeTab === "SETTINGS" && { color: theme.accentPrimary }]}>⚙️</Text>
                <Text style={[styles.navLabel, { color: activeTab === "SETTINGS" ? theme.accentPrimary : theme.textMuted }]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </InteractiveBackground>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PerformanceProvider>
        <MainApp />
      </PerformanceProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "600",
  },
  modePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  modePillText: {
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    fontSize: 14,
  },
  roleSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  roleSwitchText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  navIcon: {
    fontSize: 17,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
});
