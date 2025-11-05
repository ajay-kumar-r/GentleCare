import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";

interface CustomSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  style?: any;
  action?: {
    label: string;
    onPress: () => void;
  };
  children: React.ReactNode;
}

export default function CustomSnackbar({
  visible,
  onDismiss,
  duration = 3000,
  style,
  action,
  children,
}: CustomSnackbarProps) {
  const { colors } = useTheme();
  const translateY = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.inverseSurface || "#323232",
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.inverseOnSurface || "#fff" }]}>
        {children}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 4,
    margin: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    marginLeft: 16,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
