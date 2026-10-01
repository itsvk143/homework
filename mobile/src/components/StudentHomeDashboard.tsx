// mobile/src/components/StudentHomeDashboard.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Modal,
  Animated,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { InteractiveCard } from "./InteractiveCard";
import { AnimatedProgress } from "./AnimatedProgress";
import { AnimatedButton } from "./AnimatedButton";
import { HomeworkItem } from "../types";

interface Props {
  studentName?: string;
  classGrade?: string;
}

const INITIAL_HOMEWORKS: HomeworkItem[] = [
  {
    id: "hw-1",
    subject: "Mathematics",
    bookName: "NCERT Mathematics Class 8",
    chapterName: "Chapter 4 — Practical Geometry",
    exerciseName: "Exercise 4.2",
    dueDate: "Due Today",
    totalQuestions: 20,
    completedQuestions: 14,
    status: "IN_PROGRESS",
    color: "#6366F1",
  },
  {
    id: "hw-2",
    subject: "Science",
    bookName: "NCERT Science Class 8",
    chapterName: "Chapter 1 — Crop Production and Management",
    exerciseName: "Exercise 1.1",
    dueDate: "Tomorrow",
    totalQuestions: 10,
    completedQuestions: 10,
    status: "COMPLETED",
    color: "#10B981",
  },
  {
    id: "hw-3",
    subject: "Physics",
    bookName: "Concept of Physics — H.C. Verma",
    chapterName: "Chapter 3 — Rest and Motion: Kinematics",
    exerciseName: "Exercise 3.1",
    dueDate: "In 3 Days",
    totalQuestions: 15,
    completedQuestions: 4,
    status: "IN_PROGRESS",
    color: "#3B82F6",
  },
];

export const StudentHomeDashboard: React.FC<Props> = ({
  studentName = "Rahul Kumar",
  classGrade = "Class 8-A",
}) => {
  const { theme } = useTheme();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(INITIAL_HOMEWORKS);
  const [refreshing, setRefreshing] = useState(false);

  // Active Homework being updated (Requirement: Fast Stepper < 10s flow)
  const activeHw = homeworks[0];
  const [currentCompleted, setCurrentCompleted] = useState<number>(activeHw.completedQuestions);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const checkScale = React.useRef(new Animated.Value(0)).current;

  // Calculate overall stats
  const totalCompletedAll = homeworks.reduce((sum, h) => sum + (h.id === activeHw.id ? currentCompleted : h.completedQuestions), 0);
  const totalQuestionsAll = homeworks.reduce((sum, h) => sum + h.totalQuestions, 0);
  const overallPercentage = Math.round((totalCompletedAll / totalQuestionsAll) * 100);
  const pendingHwCount = homeworks.filter((h) => h.status !== "COMPLETED").length;

  const currentPercent = Math.round((currentCompleted / activeHw.totalQuestions) * 100);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 900);
  };

  const handleStepChange = (newCount: number) => {
    const clamped = Math.max(0, Math.min(activeHw.totalQuestions, newCount));
    setCurrentCompleted(clamped);

    // If student just finished all questions, trigger the celebratory completion modal
    if (clamped === activeHw.totalQuestions) {
      setShowCompletionModal(true);
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMarkAllDone = () => {
    handleStepChange(activeHw.totalQuestions);
  };

  const closeCompletionModal = () => {
    Animated.timing(checkScale, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowCompletionModal(false);
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accentPrimary}
          colors={[theme.accentPrimary]}
        />
      }
    >
      {/* 1. Header Greeting & Dynamic Identity */}
      <View style={styles.greetingHeader}>
        <Text style={[styles.timeGreeting, { color: theme.textSecondary }]}>
          Welcome Back
        </Text>
        <Text style={[styles.userName, { color: theme.textPrimary }]}>
          {studentName}
        </Text>
        <Text style={[styles.userBadge, { color: theme.accentPrimary }]}>
          {classGrade} • Academic Dashboard
        </Text>
      </View>

      {/* 2. Top Summary KPI Stats Row */}
      <View style={styles.kpiRow}>
        {/* Pending Homework KPI */}
        <InteractiveCard style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>
            Active Tasks
          </Text>
          <Text style={[styles.kpiValue, { color: theme.accentWarning }]}>
            {pendingHwCount}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Homeworks Pending
          </Text>
        </InteractiveCard>

        {/* Overall Completion KPI */}
        <InteractiveCard style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>
            Overall Progress
          </Text>
          <Text style={[styles.kpiValue, { color: theme.accentSuccess }]}>
            {overallPercentage}%
          </Text>
          <AnimatedProgress percentage={overallPercentage} height={5} style={{ marginTop: 6 }} />
        </InteractiveCard>
      </View>

      {/* 3. Priority Homework Hero Card (Fast < 10-second stepper flow) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Today's Priority Task
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Tap to record questions solved
        </Text>
      </View>

      <InteractiveCard style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <Text style={[styles.subjectTag, { backgroundColor: activeHw.color }]}>
            {activeHw.subject}
          </Text>
          <Text style={[styles.dueTag, { color: theme.accentWarning }]}>
            {activeHw.dueDate}
          </Text>
        </View>

        <Text style={[styles.heroBookName, { color: theme.textPrimary }]}>
          {activeHw.bookName}
        </Text>
        <Text style={[styles.heroExerciseName, { color: theme.accentSecondary }]}>
          {activeHw.chapterName} • {activeHw.exerciseName}
        </Text>

        {/* Animated Progress Bar */}
        <View style={{ marginVertical: 14 }}>
          <View style={styles.progressStatsRow}>
            <Text style={[styles.progressNumberText, { color: theme.textPrimary }]}>
              {currentCompleted} / {activeHw.totalQuestions} Questions
            </Text>
            <Text style={[styles.progressPercentText, { color: theme.accentPrimary }]}>
              {currentPercent}%
            </Text>
          </View>
          <AnimatedProgress percentage={currentPercent} height={10} />
        </View>

        {/* Micro Stepper & Fast Actions */}
        <View style={styles.stepperContainer}>
          <AnimatedButton
            title="-"
            variant="secondary"
            onPress={() => handleStepChange(currentCompleted - 1)}
            style={styles.stepBtn}
          />

          <View style={[styles.stepCountBox, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[styles.stepCountValue, { color: theme.textPrimary }]}>
              {currentCompleted}
            </Text>
            <Text style={[styles.stepCountLabel, { color: theme.textMuted }]}>
              Solved
            </Text>
          </View>

          <AnimatedButton
            title="+"
            variant="secondary"
            onPress={() => handleStepChange(currentCompleted + 1)}
            style={styles.stepBtn}
          />
        </View>

        {/* Quick Completion Button */}
        <View style={{ marginTop: 12 }}>
          <AnimatedButton
            title={
              currentCompleted === activeHw.totalQuestions
                ? "✓ EXERCISE COMPLETED"
                : "MARK ALL COMPLETED"
            }
            variant={currentCompleted === activeHw.totalQuestions ? "success" : "primary"}
            onPress={handleMarkAllDone}
          />
        </View>
      </InteractiveCard>

      {/* 4. Upcoming Assigned Homework List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Other Assigned Homework
        </Text>
      </View>

      {homeworks.slice(1).map((hw) => {
        const percent = Math.round((hw.completedQuestions / hw.totalQuestions) * 100);
        return (
          <InteractiveCard key={hw.id} style={styles.compactHwCard}>
            <View style={styles.compactHwTop}>
              <View>
                <Text style={[styles.compactSubject, { color: hw.color }]}>
                  {hw.subject}
                </Text>
                <Text style={[styles.compactTitle, { color: theme.textPrimary }]}>
                  {hw.exerciseName}
                </Text>
                <Text style={[styles.compactChapter, { color: theme.textMuted }]}>
                  {hw.bookName}
                </Text>
              </View>

              <View style={styles.compactRight}>
                <Text style={[styles.compactScore, { color: theme.textPrimary }]}>
                  {hw.completedQuestions}/{hw.totalQuestions}
                </Text>
                <Text style={[styles.compactPercent, { color: theme.accentPrimary }]}>
                  {percent}%
                </Text>
              </View>
            </View>

            <AnimatedProgress percentage={percent} height={6} style={{ marginTop: 10 }} />
          </InteractiveCard>
        );
      })}

      {/* 5. Minimalist Elegant Celebration Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={closeCompletionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: theme.accentSuccess,
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              <Text style={styles.checkIcon}>✓</Text>
            </Animated.View>

            <Text style={[styles.celebrateTitle, { color: theme.textPrimary }]}>
              Exercise Completed!
            </Text>
            <Text style={[styles.celebrateSub, { color: theme.textSecondary }]}>
              All {activeHw.totalQuestions} questions completed. Your progress is synced with your teacher.
            </Text>

            <AnimatedButton
              title="Continue Learning"
              variant="success"
              onPress={closeCompletionModal}
              style={{ marginTop: 18 }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  greetingHeader: {
    marginBottom: 16,
  },
  timeGreeting: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  userBadge: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: "900",
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  heroCard: {
    padding: 18,
  },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: "uppercase",
  },
  dueTag: {
    fontSize: 11,
    fontWeight: "800",
  },
  heroBookName: {
    fontSize: 16,
    fontWeight: "800",
  },
  heroExerciseName: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  progressStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressNumberText: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: "800",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 6,
  },
  stepBtn: {
    width: 60,
    height: 48,
    borderRadius: 14,
  },
  stepCountBox: {
    minWidth: 90,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  stepCountValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  stepCountLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  compactHwCard: {
    padding: 14,
    marginBottom: 10,
  },
  compactHwTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactSubject: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  compactChapter: {
    fontSize: 10,
    marginTop: 1,
  },
  compactRight: {
    alignItems: "flex-end",
  },
  compactScore: {
    fontSize: 13,
    fontWeight: "800",
  },
  compactPercent: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  checkIcon: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  celebrateTitle: {
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  celebrateSub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
