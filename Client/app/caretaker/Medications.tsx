import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Calendar } from "react-native-calendars";

export default function Medications() {
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>("2025-04-07");
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [missedNote, setMissedNote] = useState("");

  const medicationData: Record<string, any[]> = {
    "2025-04-07": [
      {
        id: "1",
        name: "Aspirin",
        dosage: "75mg",
        time: "08:00 AM",
        missed: false,
        missedNote: "",
      },
      {
        id: "2",
        name: "Metformin",
        dosage: "500mg",
        time: "12:00 PM",
        missed: true,
        missedNote: "Patient was asleep.",
      },
    ],
    "2025-04-08": [
      {
        id: "3",
        name: "Vitamin D",
        dosage: "1000 IU",
        time: "09:00 AM",
        missed: false,
        missedNote: "",
      },
    ],
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleViewDetails = (medication: any) => {
    setSelectedMedication(medication);
    setMissedNote(medication.missedNote || "");
    setModalVisible(true);
  };

  const handleUpdateMissedNote = () => {
    if (selectedMedication) {
      selectedMedication.missedNote = missedNote;
      setModalVisible(false);
    }
  };

  const medsForSelectedDate = medicationData[selectedDate] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Medications</Text>

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
                <Text>Missed: {med.missed ? "Yes" : "No"}</Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={() => handleViewDetails(med)}>
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medication Details</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text>{selectedMedication?.name}</Text>

              <Text style={styles.detailLabel}>Dosage:</Text>
              <Text>{selectedMedication?.dosage}</Text>

              <Text style={styles.detailLabel}>Time:</Text>
              <Text>{selectedMedication?.time}</Text>

              <Text style={styles.detailLabel}>Was it missed?</Text>
              <Text>{selectedMedication?.missed ? "Yes" : "No"}</Text>

              {selectedMedication?.missed && (
                <>
                  <Text style={styles.detailLabel}>Missed Note:</Text>
                  <TextInput
                    value={missedNote}
                    onChangeText={setMissedNote}
                    multiline
                    style={styles.input}
                  />
                  <Button mode="contained" onPress={handleUpdateMissedNote}>
                    Save Note
                  </Button>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: "#f9f9f9",
  },
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
    paddingBottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  modalBody: {
    gap: 10,
  },
  detailLabel: {
    marginTop: 10,
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
  input: {
    marginVertical: 10,
    backgroundColor: "#fff",
  },
});
