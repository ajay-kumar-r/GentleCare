import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface QuickAccessCardProps {
  title: string;
  icon: any; // Allow MaterialCommunityIcons names
  color: string;
  onPress: () => void;
}

const QuickAccessCard = ({ title, icon, color, onPress }: QuickAccessCardProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border || '#E2E8F0', borderWidth: 1 }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.onSurface || "#1A1D21" }]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    elevation: 0,
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 22,
  },
});

export default QuickAccessCard;
