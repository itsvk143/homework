// mobile/src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePerformance } from "../context/PerformanceContext";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<Props> = ({
  width = "100%",
  height = 20,
  borderRadius = 10,
  style,
}) => {
  const { theme } = useTheme();
  const { reduceMotion, isContinuousAnimationEnabled } = usePerformance();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (reduceMotion || !isContinuousAnimationEnabled) {
      opacity.setValue(0.3);
      return;
    }

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => {
      shimmer.stop();
    };
  }, [reduceMotion, isContinuousAnimationEnabled]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor:
            theme.mode === "DARK" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          opacity,
        },
        style,
      ]}
    />
  );
};
