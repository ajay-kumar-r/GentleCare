import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomCard from "../CustomCard";

interface HealthCardProps {
  title: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}

export default function HealthCard({ title, value, unit, icon, color }: HealthCardProps) {
  return (
    <CustomCard style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name={icon as any} size={40} color={color} />
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value} {unit}</Text>
        </View>
      </View>
    </CustomCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
});
