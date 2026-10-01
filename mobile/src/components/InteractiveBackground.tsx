// mobile/src/components/InteractiveBackground.tsx
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePerformance } from "../context/PerformanceContext";
import { FloatingParticles } from "./FloatingParticles";
import { FloatingSymbols } from "./FloatingSymbols";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Props {
  children: React.ReactNode;
}

export const InteractiveBackground: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();
  const { isContinuousAnimationEnabled, isParallaxEnabled } = usePerformance();

  // 1. Continuous slow orbital breathing animation
  const orbPulse = useRef(new Animated.Value(0)).current;

  // 2. Touch Parallax spring values
  const touchParallaxX = useRef(new Animated.Value(0)).current;
  const touchParallaxY = useRef(new Animated.Value(0)).current;

  // Touch tracking with PanResponder that passes through gestures to scroll views
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only track subtle micro-movement without stealing scroll control
        return Math.abs(gestureState.dx) > 12 || Math.abs(gestureState.dy) > 12;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isParallaxEnabled) return;
        // Dampen finger movement to create gentle, smooth parallax
        const dampedX = Math.max(-28, Math.min(28, gestureState.dx * 0.12));
        const dampedY = Math.max(-28, Math.min(28, gestureState.dy * 0.12));

        Animated.spring(touchParallaxX, {
          toValue: dampedX,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();

        Animated.spring(touchParallaxY, {
          toValue: dampedY,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderRelease: () => {
        // Return gently to center
        Animated.spring(touchParallaxX, {
          toValue: 0,
          friction: 9,
          tension: 30,
          useNativeDriver: true,
        }).start();
        Animated.spring(touchParallaxY, {
          toValue: 0,
          friction: 9,
          tension: 30,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Orb continuous floating loop
  useEffect(() => {
    if (!isContinuousAnimationEnabled) {
      orbPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 9000,
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 0,
          duration: 9000,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isContinuousAnimationEnabled]);

  // Orb 1 transforms (top-right glowing sphere)
  const orb1TranslateX = Animated.add(
    touchParallaxX.interpolate({
      inputRange: [-30, 30],
      outputRange: [-18, 18],
    }),
    orbPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 24],
    })
  );

  const orb1TranslateY = Animated.add(
    touchParallaxY.interpolate({
      inputRange: [-30, 30],
      outputRange: [-18, 18],
    }),
    orbPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    })
  );

  const orb1Scale = orbPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  // Orb 2 transforms (bottom-left glowing sphere)
  const orb2TranslateX = Animated.add(
    touchParallaxX.interpolate({
      inputRange: [-30, 30],
      outputRange: [14, -14],
    }),
    orbPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -22],
    })
  );

  const orb2TranslateY = Animated.add(
    touchParallaxY.interpolate({
      inputRange: [-30, 30],
      outputRange: [14, -14],
    }),
    orbPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 26],
    })
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      {...panResponder.panHandlers}
    >
      {/* 1. Subtle Radial / Glowing Gradient Orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Top-Right Ambient Light Orb */}
        <Animated.View
          style={[
            styles.orb,
            {
              width: SCREEN_WIDTH * 0.9,
              height: SCREEN_WIDTH * 0.9,
              borderRadius: (SCREEN_WIDTH * 0.9) / 2,
              top: -SCREEN_WIDTH * 0.25,
              right: -SCREEN_WIDTH * 0.2,
              backgroundColor: theme.orbColor1,
              transform: [
                { translateX: orb1TranslateX },
                { translateY: orb1TranslateY },
                { scale: orb1Scale },
              ],
            },
          ]}
        />

        {/* Bottom-Left Ambient Light Orb */}
        <Animated.View
          style={[
            styles.orb,
            {
              width: SCREEN_WIDTH * 0.85,
              height: SCREEN_WIDTH * 0.85,
              borderRadius: (SCREEN_WIDTH * 0.85) / 2,
              bottom: SCREEN_HEIGHT * 0.08,
              left: -SCREEN_WIDTH * 0.25,
              backgroundColor: theme.orbColor2,
              transform: [
                { translateX: orb2TranslateX },
                { translateY: orb2TranslateY },
              ],
            },
          ]}
        />

        {/* Center Accent Light Core */}
        <View
          style={[
            styles.orb,
            {
              width: SCREEN_WIDTH * 0.6,
              height: SCREEN_WIDTH * 0.6,
              borderRadius: (SCREEN_WIDTH * 0.6) / 2,
              top: SCREEN_HEIGHT * 0.38,
              alignSelf: "center",
              backgroundColor: theme.orbColor3,
              opacity: 0.6,
            },
          ]}
        />
      </View>

      {/* 2. Fine Geometric Academic Mesh / Grid Lines */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View
          style={[
            styles.gridHorizontalLine,
            { top: SCREEN_HEIGHT * 0.22, borderColor: theme.gridLineColor },
          ]}
        />
        <View
          style={[
            styles.gridHorizontalLine,
            { top: SCREEN_HEIGHT * 0.52, borderColor: theme.gridLineColor },
          ]}
        />
        <View
          style={[
            styles.gridHorizontalLine,
            { top: SCREEN_HEIGHT * 0.78, borderColor: theme.gridLineColor },
          ]}
        />
        <View
          style={[
            styles.gridVerticalLine,
            { left: SCREEN_WIDTH * 0.25, borderColor: theme.gridLineColor },
          ]}
        />
        <View
          style={[
            styles.gridVerticalLine,
            { right: SCREEN_WIDTH * 0.25, borderColor: theme.gridLineColor },
          ]}
        />
      </View>

      {/* 3. Floating Educational STEM Symbols */}
      <FloatingSymbols />

      {/* 4. Soft Floating Particle Dust */}
      <FloatingParticles />

      {/* 5. Main Content Layer (Always foreground & interactive) */}
      <View style={styles.contentLayer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    filter: "blur(40px)" as any, // Supported on Web / modern engines, gracefully falls back
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridHorizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  gridVerticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderStyle: "dashed",
  },
  contentLayer: {
    flex: 1,
  },
});
