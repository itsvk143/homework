// mobile/src/components/InteractiveCard.tsx
import React, { useRef } from "react";
import {
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

export const InteractiveCard: React.FC<Props> = ({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleTo,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.cardBorder,
            shadowColor: theme.mode === "DARK" ? "#000000" : "#4F46E5",
            transform: [{ scale }],
            opacity,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 14,
  },
});
