import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useState } from "react";
import CustomCard from "../CustomCard";

interface MealItemProps {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
}

export default function MealItem({ name, time, calories, protein, carbs }: MealItemProps) {
  const [status, setStatus] = useState<"eaten" | "skipped" | null>(null);

  return (
    <CustomCard style={styles.card}>
      <View>
        <Text style={styles.mealName}>{name}</Text>
        <Text style={styles.mealDetails}>
          Time: {time} | Calories: {calories} kcal | Protein: {protein}g | Carbs: {carbs}g
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={[styles.button, status === "eaten" ? styles.eatenButton : null]}
            onPress={() => setStatus("eaten")}
            disabled={status !== null}
          >
            {status === "eaten" ? "Eaten ✅" : "Eaten"}
          </Button>
          <Button
            mode="outlined"
            style={[styles.button, status === "skipped" ? styles.skippedButton : null]}
            onPress={() => setStatus("skipped")}
            disabled={status !== null}
          >
            {status === "skipped" ? "Skipped ❌" : "Skip"}
          </Button>
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
    elevation: 2,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mealDetails: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    marginHorizontal: 5,
    width: "auto",
    padding: 6,
    borderRadius: 5,
    marginTop: 10,
  },
  eatenButton: {
    backgroundColor: "#4CAF50",
  },
  skippedButton: {
    borderColor: "#D32F2F",
    color: "#D32F2F",
  },
});
