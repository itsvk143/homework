// mobile/src/components/LiveNotificationBadge.tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Animated } from "react-native";
import { usePerformance } from "../context/PerformanceContext";

interface Props {
  count: number;
}

export const LiveNotificationBadge: React.FC<Props> = ({ count }) => {
  const { isContinuousAnimationEnabled } = usePerformance();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count <= 0 || !isContinuousAnimationEnabled) {
      scale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [count, isContinuousAnimationEnabled]);

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
      <Text style={styles.text}>{count > 99 ? "99+" : count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});
