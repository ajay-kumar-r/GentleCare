import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function QuickAccessCard({ title, icon, color, onPress }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={{
        backgroundColor: color,
        borderRadius: 10,
        padding: 20,
        width: "48%",
        height: 140,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3, 
      }}
    >
      <MaterialCommunityIcons name={icon} size={40} color="white" />
      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontFamily: "Poppins_600SemiBold",
          textAlign: "center",
          textShadowColor: "rgba(0, 0, 0, 0.5)", 
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
