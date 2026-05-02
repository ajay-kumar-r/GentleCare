import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  FAB,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { mealAPI, socketService, authAPI } from "../../services/api";

interface Meal {
  id: number;
  meal_type: string;
  meal_name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  scheduled_time?: string;
  consumed_at?: string;
  notes?: string;
}

export default function MealTracker() {
  const { colors } = useTheme();
  
  const [meals, setMeals] = useState<Meal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Elder selection
  const [elders, setElders] = useState<any[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null);
  
  // Form fields
  const [mealType, setMealType] = useState("breakfast");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const fetchMeals = useCallback(async () => {
    try {
      if (!selectedElderId) return;
      const response = await mealAPI.getMeals(selectedDate, selectedElderId);
      const fetchedMeals = response.meals || [];
      setMeals(fetchedMeals);
    } catch (error: any) {
      console.error("Error fetching meals:", error);
      setMeals([]);
      showSnackbar(error.message || "Failed to load meals");
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate, selectedElderId]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authAPI.getProfile();
        if (profile.elders && profile.elders.length > 0) {
          setElders(profile.elders);
          setSelectedElderId(profile.elders[0].id);
        }
      } catch (e) {
        // Handle error
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (selectedElderId) {
      fetchMeals();
    }

    const refreshFromRealtime = () => {
      fetchMeals();
    };

    socketService.on('meal_added', refreshFromRealtime);
    socketService.on('meal_consumed', refreshFromRealtime);

    return () => {
      socketService.off('meal_added');
      socketService.off('meal_consumed');
    };
  }, [fetchMeals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeals();
  };

  const resetForm = () => {
    setMealType("breakfast");
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setScheduledTime("");
    setNotes("");
  };

  const handleAdd = async () => {
    if (!mealName.trim()) {
      Alert.alert("Missing Field", "Please enter meal name");
      return;
    }

    if (!selectedElderId) {
      Alert.alert("Missing Elder", "Please select an elder");
      return;
    }

    try {
      await mealAPI.addMeal({
        meal_type: mealType,
        meal_name: mealName,
        calories: calories ? parseInt(calories) : undefined,
        protein: protein ? parseInt(protein) : undefined,
        carbs: carbs ? parseInt(carbs) : undefined,
        fats: fats ? parseInt(fats) : undefined,
        scheduled_time: scheduledTime || undefined,
        notes: notes || undefined,
        elder_id: selectedElderId,
      });
      showSnackbar("Meal added successfully");
      setModalVisible(false);
      resetForm();
      fetchMeals();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add meal");
    }
  };

  const handleConsume = async (meal: Meal) => {
    if (meal.consumed_at) {
      showSnackbar("Meal already consumed");
      return;
    }

    try {
      await mealAPI.consumeMeal(meal.id);
      showSnackbar("Meal marked as consumed");
      fetchMeals();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update meal");
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const getMealTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "breakfast": return "#FF9800";
      case "lunch": return "#4CAF50";
      case "dinner": return "#2196F3";
      case "snack": return "#9C27B0";
      default: return "#757575";
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "breakfast": return "sunny";
      case "lunch": return "restaurant";
      case "dinner": return "moon";
      case "snack": return "fast-food";
      default: return "nutrition";
    }
  };

  // Calculate daily totals
  const dailyTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <Text style={[styles.title, { color: colors.primary }]}>Meal Tracker</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {elders.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            {elders.map(elder => (
              <Button
                key={elder.id}
                mode={selectedElderId === elder.id ? "contained" : "outlined"}
                onPress={() => setSelectedElderId(elder.id)}
                style={{ marginRight: 8 }}
              >
                {elder.name}
              </Button>
            ))}
          </ScrollView>
        )}

        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: colors.primary },
          }}
          theme={{
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
          }}
          style={styles.calendar}
        />

        {/* Daily Summary */}
        {meals.length > 0 && (
          <CustomCard style={styles.summaryCard}>
            <View>
              <Text style={[styles.summaryTitle, { color: colors.onSurface || "#1A1D21" }]}>Daily Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.error || "#f44336" }]}>{dailyTotals.calories}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant || "#666" }]}>Calories</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
                    {dailyTotals.protein}g
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant || "#666" }]}>Protein</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: "#2196F3" }]}>
                    {dailyTotals.carbs}g
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant || "#666" }]}>Carbs</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: "#FF9800" }]}>
                    {dailyTotals.fats}g
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant || "#666" }]}>Fats</Text>
                </View>
              </View>
            </View>
          </CustomCard>
        )}

        {/* Meals List */}
        {meals.length > 0 ? (
          meals.map((meal) => (
          <CustomCard key={meal.id} style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: getMealTypeColor(meal.meal_type) + "20" },
                      ]}
                    >
                      <Ionicons
                        name={getMealTypeIcon(meal.meal_type) as any}
                        size={24}
                        color={getMealTypeColor(meal.meal_type)}
                      />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealName, { color: colors.onSurface || "#1A1D21" }]}>{meal.meal_name}</Text>
                      <View
                        style={[
                          styles.mealTypeChip,
                          { borderColor: getMealTypeColor(meal.meal_type) },
                        ]}
                      >
                        <Text
                          style={{
                            color: getMealTypeColor(meal.meal_type),
                            fontSize: 11,
                          }}
                        >
                          {meal.meal_type}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {meal.consumed_at && (
                    <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                  )}
                </View>

                {/* Nutritional Info */}
                {(meal.calories || meal.protein || meal.carbs || meal.fats) && (
                  <View style={styles.nutritionRow}>
                    {meal.calories && (
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: colors.onSurface || "#1A1D21" }]}>{meal.calories}</Text>
                        <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant || "#666" }]}>cal</Text>
                      </View>
                    )}
                    {meal.protein && (
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: "#4CAF50" }]}>
                          {meal.protein}g
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant || "#666" }]}>protein</Text>
                      </View>
                    )}
                    {meal.carbs && (
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: "#2196F3" }]}>
                          {meal.carbs}g
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant || "#666" }]}>carbs</Text>
                      </View>
                    )}
                    {meal.fats && (
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: "#FF9800" }]}>
                          {meal.fats}g
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant || "#666" }]}>fats</Text>
                      </View>
                    )}
                  </View>
                )}

                {meal.scheduled_time && (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant || "#666"} />
                    <Text style={[styles.timeText, { color: colors.onSurfaceVariant || "#666" }]}>
                      {new Date(meal.scheduled_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                )}

                {meal.notes && (
                  <View style={[styles.notesBox, { backgroundColor: colors.surfaceVariant || "#FFF9C4" }]}>
                    <Text style={[styles.notesText, { color: colors.onSurfaceVariant || "#333" }]}>{meal.notes}</Text>
                  </View>
                )}

                {!meal.consumed_at && (
                  <Button
                    mode="contained"
                    onPress={() => handleConsume(meal)}
                    style={styles.consumeButton}
                    icon="check"
                  >
                    Mark as Consumed
                  </Button>
                )}
              </View>
            </CustomCard>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant || "#999" }]}>No meals for this day</Text>
            <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant || "#666" }]}>Your caretaker can add meals and this screen updates automatically.</Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        label="Add Meal"
      />

      {/* Add Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Meal</Text>

              <Text style={styles.inputLabel}>Meal Type</Text>
              <View style={styles.chipRow}>
                {["breakfast", "lunch", "dinner", "snack"].map((type) => (
                  <Button
                    key={type}
                    mode={mealType === type ? "contained" : "outlined"}
                    onPress={() => setMealType(type)}
                    style={styles.typeChip}
                    buttonColor={mealType === type ? getMealTypeColor(type) : "transparent"}
                    textColor={mealType === type ? "#FFF" : getMealTypeColor(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </View>

              <TextInput
                label="Meal Name *"
                value={mealName}
                onChangeText={setMealName}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Calories"
                  value={calories}
                  onChangeText={setCalories}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Protein (g)"
                  value={protein}
                  onChangeText={setProtein}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Carbs (g)"
                  value={carbs}
                  onChangeText={setCarbs}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Fats (g)"
                  value={fats}
                  onChangeText={setFats}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                label="Scheduled Time (e.g., 8:00 AM)"
                value={scheduledTime}
                onChangeText={setScheduledTime}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleAdd}>
                  Add
                </Button>
              </View>
            </ScrollView>
          </CustomCard>
        </View>
      </Modal>

      <CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  summaryCard: {
    marginBottom: 20,
    elevation: 0,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#f44336",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
    elevation: 0,
  },
  cardContent: {
    padding: 16,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  mealTypeChip: {
    height: 24,
    alignSelf: "flex-start",
  },
  nutritionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  nutritionLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginLeft: 6,
  },
  notesBox: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  consumeButton: {
    backgroundColor: "#4CAF50",
    marginTop: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  emptyState: {
    marginTop: 50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptySubtext: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
    fontFamily: "Poppins_400Regular",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    height: 32,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
});
