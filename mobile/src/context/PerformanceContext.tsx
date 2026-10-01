// mobile/src/context/PerformanceContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState, AppStateStatus, AccessibilityInfo } from "react-native";
import { PerformanceMode } from "../types";

interface PerformanceContextType {
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => void;
  isAppActive: boolean;
  reduceMotion: boolean;
  particleCount: number;
  isParallaxEnabled: boolean;
  isContinuousAnimationEnabled: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  performanceMode: "NORMAL",
  setPerformanceMode: () => {},
  isAppActive: true,
  reduceMotion: false,
  particleCount: 20,
  isParallaxEnabled: true,
  isContinuousAnimationEnabled: true,
});

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("NORMAL");
  const [isAppActive, setIsAppActive] = useState<boolean>(AppState.currentState === "active");
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  // 1. AppState listener: Pause all background animations when app is backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // 2. Accessibility reduced motion detection
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      sub?.remove?.();
    };
  }, []);

  // Compute active animation parameters based on performance mode & system states
  const isBatterySaver = performanceMode === "BATTERY_SAVER" || reduceMotion;

  const particleCount = !isAppActive || isBatterySaver
    ? 0
    : performanceMode === "HIGH"
    ? 30
    : 18;

  const isParallaxEnabled = isAppActive && !isBatterySaver;
  const isContinuousAnimationEnabled = isAppActive && !reduceMotion && performanceMode !== "BATTERY_SAVER";

  return (
    <PerformanceContext.Provider
      value={{
        performanceMode,
        setPerformanceMode,
        isAppActive,
        reduceMotion,
        particleCount,
        isParallaxEnabled,
        isContinuousAnimationEnabled,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => useContext(PerformanceContext);
