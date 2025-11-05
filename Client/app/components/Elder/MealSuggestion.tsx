import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import CustomCard from "../CustomCard";

interface MealSuggestionProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
}

export default function MealSuggestion({ name, calories, protein, carbs }: MealSuggestionProps) {
  return (
    <CustomCard style={styles.card}>
      <View>
        <Text style={styles.suggestionTitle}>Suggested Meal</Text>
        <Text style={styles.mealName}>{name}</Text>
        <Text style={styles.mealDetails}>
          Calories: {calories} kcal | Protein: {protein}g | Carbs: {carbs}g
        </Text>
      </View>
    </CustomCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mealDetails: {
    fontSize: 16,
    color: "#666",
  },
});
