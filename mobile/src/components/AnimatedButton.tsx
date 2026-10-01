// mobile/src/components/AnimatedButton.tsx
import React, { useRef } from "react";
import {
  StyleSheet,
  Pressable,
  Animated,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "success" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AnimatedButton: React.FC<Props> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  // Determine button styling based on variant
  let bgColor = theme.accentPrimary;
  let textColor = "#FFFFFF";
  let borderWidth = 0;
  let borderColor = "transparent";

  if (variant === "success") {
    bgColor = theme.accentSuccess;
  } else if (variant === "secondary") {
    bgColor = theme.surfaceSubtle;
    textColor = theme.textPrimary;
    borderWidth = 1;
    borderColor = theme.cardBorder;
  } else if (variant === "danger") {
    bgColor = theme.accentDanger;
  } else if (variant === "ghost") {
    bgColor = "transparent";
    textColor = theme.textPrimary;
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderWidth,
            borderColor,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Animated.View style={styles.row}>
            {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
            <Text style={[styles.text, { color: textColor }, textStyle]}>
              {title}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  button: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
