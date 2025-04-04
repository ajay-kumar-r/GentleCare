import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

interface QuickAccessCardProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const QuickAccessCard = ({ title, icon, color, onPress }: QuickAccessCardProps) => {
  return (
    <TouchableOpacity style={[styles.card, { borderColor: color }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={30} color="white" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    color: "#333",
  },
});

export default QuickAccessCard;
