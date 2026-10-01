// mobile/src/components/FloatingSymbols.tsx
import React, { useEffect, useRef, useMemo } from "react";
import { StyleSheet, View, Text, Animated, Dimensions } from "react-native";
import { usePerformance } from "../context/PerformanceContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SYMBOLS = ["∑", "π", "H₂O", "⚛", "DNA", "E = mc²", "∫", "NEET", "JEE", "λ", "Δt"];

interface SymbolConfig {
  id: number;
  symbol: string;
  x: number;
  y: number;
  fontSize: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

const SingleSymbol: React.FC<{
  config: SymbolConfig;
  textColor: string;
  isAnimated: boolean;
}> = React.memo(({ config, textColor, isAnimated }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimated) {
      anim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          delay: config.delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: config.duration,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isAnimated, config]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, config.driftY],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, config.driftX],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", config.id % 2 === 0 ? "10deg" : "-10deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.symbolContainer,
        {
          left: config.x,
          top: config.y,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    >
      <Text
        style={[
          styles.symbolText,
          {
            fontSize: config.fontSize,
            color: textColor,
          },
        ]}
      >
        {config.symbol}
      </Text>
    </Animated.View>
  );
});

export const FloatingSymbols: React.FC = () => {
  const { isContinuousAnimationEnabled, performanceMode, reduceMotion } = usePerformance();
  const { theme } = useTheme();

  const count = performanceMode === "BATTERY_SAVER" || reduceMotion ? 0 : performanceMode === "HIGH" ? 9 : 6;

  const symbolList = useMemo(() => {
    const list: SymbolConfig[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        symbol: SYMBOLS[i % SYMBOLS.length],
        x: (i * 59 + 25) % (SCREEN_WIDTH - 80),
        y: 60 + (i * 97) % (SCREEN_HEIGHT - 220),
        fontSize: 13 + (i % 3) * 3,
        driftX: ((i % 2 === 0 ? 1 : -1) * (14 + (i % 3) * 6)),
        driftY: -(18 + (i % 3) * 8),
        duration: 11000 + (i % 4) * 2000,
        delay: (i % 5) * 500,
      });
    }
    return list;
  }, [count]);

  if (count === 0) return null;

  const symbolColor =
    theme.mode === "DARK" ? "rgba(165, 180, 252, 0.11)" : "rgba(99, 102, 241, 0.12)";

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {symbolList.map((item) => (
        <SingleSymbol
          key={item.id}
          config={item}
          textColor={symbolColor}
          isAnimated={isContinuousAnimationEnabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  symbolContainer: {
    position: "absolute",
    opacity: 0.9,
  },
  symbolText: {
    fontWeight: "800",
    letterSpacing: 1,
    includeFontPadding: false,
  },
});
