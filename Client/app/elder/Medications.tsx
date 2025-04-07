import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  TextInput,
  FAB,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { Calendar } from "react-native-calendars";

const initialMedications = {
  "2025-04-07": [
    { id: 1, name: "Paracetamol", dosage: "500mg", time: "8:00 AM", status: null },
    { id: 2, name: "Metformin", dosage: "850mg", time: "12:00 PM", status: null },
    { id: 3, name: "Atorvastatin", dosage: "10mg", time: "9:00 PM", status: null },
  ],
  "2025-04-08": [
    { id: 4, name: "Aspirin", dosage: "75mg", time: "8:00 AM", status: null },
    { id: 5, name: "Ibuprofen", dosage: "200mg", time: "12:00 PM", status: null },
  ],
};

export default function Medications() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>("2025-04-07");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [undoCallback, setUndoCallback] = useState<() => void>(() => () => {});
  const [fabBottom, setFabBottom] = useState(new Animated.Value(20));
  const [medications, setMedications] = useState(initialMedications);

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleMarkAsTaken = (medId: number) => {
    const updatedMeds = { ...medications };
    updatedMeds[selectedDate] = updatedMeds[selectedDate].map((med) =>
      med.id === medId ? { ...med, status: "taken" } : med
    );
    setMedications(updatedMeds);
    showSnackbar("Medication marked as taken");
  };

  const handleMarkAsSkipped = (medId: number) => {
    const updatedMeds = { ...medications };
    updatedMeds[selectedDate] = updatedMeds[selectedDate].map((med) =>
      med.id === medId ? { ...med, status: "skipped" } : med
    );
    setMedications(updatedMeds);
    showSnackbar("Medication marked as skipped");
  };

  const medsForSelectedDate = medications[selectedDate] || [];

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

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.primary }]}>Medications</Text>

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {medsForSelectedDate.length === 0 ? (
          <Text style={styles.noMedsText}>No medications for this day.</Text>
        ) : (
          medsForSelectedDate.map((med) => (
            <Card key={med.id} style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium">{med.name}</Text>
                <Text>Dosage: {med.dosage}</Text>
                <Text>Time: {med.time}</Text>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={[styles.button, med.status === "taken" ? styles.takenButton : null]}
                    onPress={() => handleMarkAsTaken(med.id)}
                    disabled={med.status !== null}
                  >
                    {med.status === "taken" ? "Taken ✅" : "Taken"}
                  </Button>
                  <Button
                    mode="outlined"
                    style={[styles.button, med.status === "skipped" ? styles.skippedButton : null]}
                    onPress={() => handleMarkAsSkipped(med.id)}
                    disabled={med.status !== null}
                  >
                    {med.status === "skipped" ? "Skipped ❌" : "Skip"}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Animated.View style={[styles.fabContainer, { bottom: fabBottom }]}>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
        />
      </Animated.View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={styles.snackbar}
        action={{
          label: "Undo",
          onPress: undoCallback,
        }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, backgroundColor: "#f9f9f9" },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  calendar: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  noMedsText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
  },
  card: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    marginHorizontal: 5,
    borderRadius: 5,
    width: "auto",
    marginTop: 10,
    padding: 6,
  },
  takenButton: {
    backgroundColor: "#4CAF50",
  },
  skippedButton: {
    borderColor: "#D32F2F",
    color: "#D32F2F",
  },
  fabContainer: {
    position: "absolute",
    right: 20,
  },
  fab: {
    backgroundColor: "#007bff",
  },
  snackbar: {
    backgroundColor: "#fff",
    marginBottom: 10,
    marginHorizontal: 16,
  },
});
