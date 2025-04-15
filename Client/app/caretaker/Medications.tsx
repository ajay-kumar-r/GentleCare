import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
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

export default function Medications() {
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>("2025-04-07");
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [missedNote, setMissedNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newMissed, setNewMissed] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [undoCallback, setUndoCallback] = useState<() => void>(() => () => {});
  const [fabBottom, setFabBottom] = useState(new Animated.Value(20));

  const [medicationData, setMedicationData] = useState<Record<string, any[]>>({
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
  });

  const showSnackbar = (message: string, undo?: () => void) => {
    setSnackbarMsg(message);
    setUndoCallback(() => undo || (() => {}));
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

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleViewDetails = (medication: any) => {
    setSelectedMedication({ ...medication }); 
    setMissedNote(medication.missedNote || "");
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleUpdateMedication = () => {
    const updatedList = medicationData[selectedDate].map((med) =>
      med.id === selectedMedication.id ? selectedMedication : med
    );
    setMedicationData({ ...medicationData, [selectedDate]: updatedList });
    setModalVisible(false);
  };

  const handleDeleteMedication = () => {
    const updatedList = medicationData[selectedDate].filter(
      (med) => med.id !== selectedMedication.id
    );
    const deletedMed = selectedMedication;

    setMedicationData({ ...medicationData, [selectedDate]: updatedList });
    setModalVisible(false);

    showSnackbar("Medication deleted", () => {
      setMedicationData((prevData) => {
        const prevList = prevData[selectedDate] || [];
        return {
          ...prevData,
          [selectedDate]: [...prevList, deletedMed],
        };
      });
    });
  };

  const medsForSelectedDate = medicationData[selectedDate] || [];

  const handleAddMedication = () => {
    const newMedication = {
      id: Date.now().toString(),
      name: newName,
      dosage: newDosage,
      time: newTime,
      missed: newMissed,
      missedNote: "",
    };

    const updatedMeds = [...(medicationData[selectedDate] || []), newMedication];
    setMedicationData({ ...medicationData, [selectedDate]: updatedMeds });

    setNewName("");
    setNewDosage("");
    setNewTime("");
    setNewMissed(false);
    setAddModalVisible(false);

    showSnackbar("Medication added");
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.header, {color: colors.primary}]}>Medications</Text>

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
              <TextInput
                label="Name"
                value={selectedMedication?.name}
                onChangeText={(text) =>
                  setSelectedMedication((prev: any) => ({ ...prev, name: text }))
                }
                style={styles.input}
                editable={isEditing}
              />
              <TextInput
                label="Dosage"
                value={selectedMedication?.dosage}
                onChangeText={(text) =>
                  setSelectedMedication((prev: any) => ({ ...prev, dosage: text }))
                }
                style={styles.input}
                editable={isEditing}
              />
              <TextInput
                label="Time"
                value={selectedMedication?.time}
                onChangeText={(text) =>
                  setSelectedMedication((prev: any) => ({ ...prev, time: text }))
                }
                style={styles.input}
                editable={isEditing}
              />
              <Button
                mode={selectedMedication?.missed ? "contained" : "outlined"}
                onPress={() =>
                  isEditing &&
                  setSelectedMedication((prev: any) => ({
                    ...prev,
                    missed: !prev.missed,
                  }))
                }
                style={{ marginBottom: 10 }}
              >
                {selectedMedication?.missed ? "Marked as Missed" : "Mark as Missed"}
              </Button>

              {selectedMedication?.missed && (
                <TextInput
                  label="Missed Note"
                  value={selectedMedication?.missedNote}
                  onChangeText={(text) =>
                    setSelectedMedication((prev: any) => ({
                      ...prev,
                      missedNote: text,
                    }))
                  }
                  multiline
                  style={styles.input}
                  editable={isEditing}
                />
              )}

              {!isEditing ? (
                <Button
                  icon="pencil"
                  mode="outlined"
                  onPress={() => setIsEditing(true)}
                  style={{ marginTop: 10 }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  icon="content-save"
                  mode="contained"
                  onPress={handleUpdateMedication}
                  style={{ marginTop: 10 }}
                >
                  Save Changes
                </Button>
              )}

              <Button
                icon="delete"
                mode="text"
                onPress={handleDeleteMedication}
                textColor="red"
                style={{ marginTop: 10 }}
              >
                Delete Medication
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <IconButton icon="close" onPress={() => setAddModalVisible(false)} />
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                label="Medication Name"
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
              />
              <TextInput
                label="Dosage"
                value={newDosage}
                onChangeText={setNewDosage}
                style={styles.input}
              />
              <TextInput
                label="Time (e.g., 10:00 AM)"
                value={newTime}
                onChangeText={setNewTime}
                style={styles.input}
              />
              <Button
                mode={newMissed ? "contained" : "outlined"}
                onPress={() => setNewMissed(!newMissed)}
                style={{ marginBottom: 10 }}
              >
                {newMissed ? "Marked as Missed" : "Mark as Missed"}
              </Button>

              <Button mode="contained" onPress={handleAddMedication}>
                Add Medication
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  input: {
    marginBottom: 10,
    backgroundColor: "#fff",
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
