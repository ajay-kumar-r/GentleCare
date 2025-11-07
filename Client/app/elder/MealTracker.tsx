import { useState } from "react";
import { View, ScrollView, StyleSheet, Modal, TextInput, Animated } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import CustomSnackbar from "../components/CustomSnackbar";
import MealItem from "../components/Elder/MealItem";
import MealSuggestion from "../components/Elder/MealSuggestion";
import { Calendar } from "react-native-calendars";
import BackButton from "../components/BackButton";

const initialMeals = {
  "2025-04-07": [
    { id: 1, name: "Oatmeal with Berries", time: "8:00 AM", calories: 250, protein: 6, carbs: 40, status: "pending" },
    { id: 2, name: "Grilled Chicken Salad", time: "1:00 PM", calories: 350, protein: 30, carbs: 20, status: "pending" },
    { id: 3, name: "Steamed Salmon with Veggies", time: "7:00 PM", calories: 400, protein: 35, carbs: 15, status: "pending" },
  ],
  "2025-04-08": [
    { id: 4, name: "Veggie Stir Fry", time: "8:00 AM", calories: 220, protein: 5, carbs: 40, status: "pending" },
    { id: 5, name: "Chicken Caesar Salad", time: "12:30 PM", calories: 380, protein: 35, carbs: 12, status: "pending" },
  ],
};

const mealSuggestions = [
  { name: "Quinoa & Avocado Salad", calories: 320, protein: 12, carbs: 40 },
  { name: "Greek Yogurt with Nuts", calories: 200, protein: 15, carbs: 25 },
];

export default function MealTracker() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>("2025-04-07");
  const [meals, setMeals] = useState(initialMeals);
  const [modalVisible, setModalVisible] = useState(false);
  const [mealData, setMealData] = useState({ name: "", time: "", calories: "", protein: "", carbs: "" });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [fabBottom, setFabBottom] = useState(new Animated.Value(20));

  const handleMealStatus = (id: number, status: "eaten" | "skipped") => {
    const updatedMeals = { ...meals };
    updatedMeals[selectedDate] = updatedMeals[selectedDate].map((meal) =>
      meal.id === id ? { ...meal, status } : meal
    );
    setMeals(updatedMeals);
    showSnackbar(status === "eaten" ? "Meal marked as eaten" : "Meal skipped");
  };

  const handleAddMeal = () => {
    if (!mealData.name || !mealData.time || !mealData.calories || !mealData.protein || !mealData.carbs) {
      alert("Please fill in all fields.");
      return;
    }

    const newMeal = {
      id: meals[selectedDate]?.length + 1 || 1,
      name: mealData.name,
      time: mealData.time,
      calories: parseInt(mealData.calories),
      protein: parseInt(mealData.protein),
      carbs: parseInt(mealData.carbs),
      status: "pending",
    };

    const updatedMeals = { ...meals };
    if (!updatedMeals[selectedDate]) {
      updatedMeals[selectedDate] = [];
    }
    updatedMeals[selectedDate].push(newMeal);

    setMeals(updatedMeals);
    setModalVisible(false);
    setMealData({ name: "", time: "", calories: "", protein: "", carbs: "" });
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
    Animated.timing(fabBottom, {
      toValue: 70,
      duration: 200,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      setSnackbarVisible(false);
      Animated.timing(fabBottom, {
        toValue: 20,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 2500);
  };

  const mealsForSelectedDate = meals[selectedDate] || [];

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <Text style={[styles.title, { color: colors.primary }]}>Meal Tracker</Text>

        <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: "#007bff" },
        }}
        theme={{
          selectedDayBackgroundColor: "#007bff",
          todayTextColor: "#007bff",
        }}
        style={styles.calendar}
      />

        {mealsForSelectedDate.length === 0 ? (
          <Text style={styles.noMealsText}>No meals for this day.</Text>
        ) : (
          mealsForSelectedDate.map((meal) => (
            <MealItem
              key={meal.id}
              name={meal.name}
              time={meal.time}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              onMarkEaten={() => handleMealStatus(meal.id, "eaten")}
              onSkip={() => handleMealStatus(meal.id, "skipped")}
            />
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>ML-Based Meal Suggestions</Text>
        {mealSuggestions.map((suggestion, index) => (
          <MealSuggestion key={index} name={suggestion.name} calories={suggestion.calories} protein={suggestion.protein} carbs={suggestion.carbs} />
        ))}
      </ScrollView>

      <Button mode="contained" style={styles.addMealButton} onPress={() => setModalVisible(true)}>
        + Add Meal
      </Button>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>Add Custom Meal</Text>
            <TextInput style={styles.input} placeholder="Meal Name" value={mealData.name} onChangeText={(text) => setMealData({ ...mealData, name: text })} />
            <TextInput style={styles.input} placeholder="Time (e.g., 8:00 AM)" value={mealData.time} onChangeText={(text) => setMealData({ ...mealData, time: text })} />
            <TextInput style={styles.input} placeholder="Calories" keyboardType="numeric" value={mealData.calories} onChangeText={(text) => setMealData({ ...mealData, calories: text })} />
            <TextInput style={styles.input} placeholder="Protein (g)" keyboardType="numeric" value={mealData.protein} onChangeText={(text) => setMealData({ ...mealData, protein: text })} />
            <TextInput style={styles.input} placeholder="Carbs (g)" keyboardType="numeric" value={mealData.carbs} onChangeText={(text) => setMealData({ ...mealData, carbs: text })} />

            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.modalButton} onPress={handleAddMeal}>
                Add Meal
              </Button>
              <Button mode="outlined" style={styles.modalButton} onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.fabContainer, { bottom: fabBottom }]}>
        <CustomSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2500}
          style={styles.snackbar}
        >
          {snackbarMsg}
        </CustomSnackbar>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    paddingTop: 10,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  noMealsText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
  },
  addMealButton: {
    position: "absolute",
    bottom: 35,
    right: 20,
    padding: 5,
    borderRadius: 50,
    alignSelf: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
  },
  snackbar: {
    backgroundColor: "#fff",
    marginBottom: 10,
    marginHorizontal: 16,
  },
});
