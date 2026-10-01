// mobile/src/components/AnimatedProgress.tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePerformance } from "../context/PerformanceContext";

interface Props {
  percentage: number; // 0 to 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedProgress: React.FC<Props> = ({
  percentage,
  height = 8,
  color,
  backgroundColor,
  style,
}) => {
  const { theme } = useTheme();
  const { reduceMotion } = usePerformance();
  const clamped = Math.max(0, Math.min(100, percentage));

  // Animates from previous percentage to new percentage
  const animWidth = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduceMotion) {
      animWidth.setValue(clamped);
      return;
    }

    Animated.spring(animWidth, {
      toValue: clamped,
      friction: 8,
      tension: 40,
      useNativeDriver: false, // width interpolation
    }).start();
  }, [clamped, reduceMotion]);

  const widthInterpolation = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const barColor =
    color ||
    (clamped >= 100
      ? theme.accentSuccess
      : clamped > 50
      ? theme.accentPrimary
      : theme.accentWarning);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: backgroundColor || theme.surfaceSubtle,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            height,
            borderRadius: height / 2,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
