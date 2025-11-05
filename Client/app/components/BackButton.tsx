import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "react-native-paper";

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

export default function BackButton({ onPress, color, size = 28 }: BackButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="arrow-back" 
        size={size} 
        color={color || colors.primary} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 45,
    left: 15,
    zIndex: 10,
    padding: 5,
  },
});
