import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";

const initialMedications = [
  { id: 1, name: "Paracetamol", dosage: "500mg", time: "8:00 AM", status: null },
  { id: 2, name: "Metformin", dosage: "850mg", time: "12:00 PM", status: null },
  { id: 3, name: "Atorvastatin", dosage: "10mg", time: "9:00 PM", status: null },
];

export default function MedicationReminders() {
  const { colors } = useTheme();
  const [medications, setMedications] = useState(initialMedications);

  const updateStatus = (id: number, status: "taken" | "skipped") => {
    setMedications((prevMeds) =>
      prevMeds.map((med) =>
        med.id === id ? { ...med, status } : med
      )
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.flexContainer}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.primary }]}>Medication Reminders</Text>

        {medications.map((med) => (
          <Card key={med.id} style={styles.card}>
            <Card.Content>
              <Text style={styles.medicineName}>{med.name}</Text>
              <Text style={styles.medicineDetails}>{med.dosage} | {med.time}</Text>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={[
                    styles.button,
                    med.status === "taken" ? styles.takenButton : null,
                  ]}
                  onPress={() => updateStatus(med.id, "taken")}
                  disabled={med.status !== null}
                >
                  {med.status === "taken" ? "Taken ✅" : "Taken"}
                </Button>
                <Button
                  mode="outlined"
                  style={[
                    styles.button,
                    med.status === "skipped" ? styles.skippedButton : null,
                  ]}
                  onPress={() => updateStatus(med.id, "skipped")}
                  disabled={med.status !== null}
                >
                  {med.status === "skipped" ? "Skipped ❌" : "Skip"}
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  medicineDetails: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  takenButton: {
    backgroundColor: "#4CAF50", 
  },
  skippedButton: {
    borderColor: "#D32F2F", 
    color: "#D32F2F", 
  },
});
