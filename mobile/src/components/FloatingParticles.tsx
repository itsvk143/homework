// mobile/src/components/FloatingParticles.tsx
import React, { useEffect, useRef, useMemo } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { usePerformance } from "../context/PerformanceContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SingleParticleConfig {
  id: number;
  startX: number;
  startY: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

const SingleParticle: React.FC<{
  config: SingleParticleConfig;
  color: string;
  isAnimated: boolean;
}> = React.memo(({ config, color, isAnimated }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimated) {
      animValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: config.duration,
          delay: config.delay,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: config.duration,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isAnimated, config]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, config.driftY],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, config.driftX],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [config.baseOpacity * 0.4, config.baseOpacity, config.baseOpacity * 0.2],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.startX,
          top: config.startY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: color,
          opacity: isAnimated ? opacity : config.baseOpacity * 0.4,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
});

export const FloatingParticles: React.FC = () => {
  const { particleCount, isContinuousAnimationEnabled } = usePerformance();
  const { theme } = useTheme();

  // Generate particle configurations once
  const particles = useMemo(() => {
    const list: SingleParticleConfig[] = [];
    for (let i = 0; i < particleCount; i++) {
      const size = 2.5 + (i % 4) * 1.5;
      list.push({
        id: i,
        startX: (i * 37 + 19) % (SCREEN_WIDTH - 20),
        startY: (i * 73 + 47) % (SCREEN_HEIGHT - 60),
        size,
        baseOpacity: 0.15 + (i % 3) * 0.12,
        duration: 8000 + (i % 5) * 2200,
        delay: (i % 7) * 400,
        driftX: ((i % 2 === 0 ? 1 : -1) * (18 + (i % 3) * 10)),
        driftY: -(30 + (i % 4) * 15),
      });
    }
    return list;
  }, [particleCount]);

  if (particleCount === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p) => (
        <SingleParticle
          key={p.id}
          config={p}
          color={theme.particleColor}
          isAnimated={isContinuousAnimationEnabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
  },
});
