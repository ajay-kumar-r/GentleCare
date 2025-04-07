import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import {
  Card,
  Text,
  Button,
  useTheme,
  IconButton,
  FAB,
  TextInput,
  Snackbar,
} from "react-native-paper";

export default function Appointments() {
  const { colors } = useTheme();

  const [appointments, setAppointments] = useState([
    {
      id: "1",
      doctor: "Dr. Priya Sharma",
      date: "2025-04-10",
      time: "10:30 AM",
      location: "Sunshine Hospital, Room 204",
      purpose: "Routine Checkup",
      notes: "Ensure elder is fasting before blood test.",
    },
    {
      id: "2",
      doctor: "Dr. Rahul Verma",
      date: "2025-04-15",
      time: "02:00 PM",
      location: "Green Health Clinic",
      purpose: "Heart Health Consultation",
      notes: "Bring previous ECG reports.",
    },
  ]);

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctor: "",
    date: "",
    time: "",
    location: "",
    purpose: "",
    notes: "",
  });

  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const [fabPosition, setFabPosition] = useState(new Animated.Value(30));

  useEffect(() => {
    if (snackbarVisible) {
      Animated.timing(fabPosition, {
        toValue: 80, 
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(fabPosition, {
        toValue: 30, 
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [snackbarVisible]);

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEditedNotes(appointment.notes);
    setIsEditingNotes(false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
    setIsEditingNotes(false);
  };

  const handleSaveNotes = () => {
    if (selectedAppointment) {
      const updatedList = appointments.map((a) =>
        a.id === selectedAppointment.id ? { ...a, notes: editedNotes } : a
      );
      setAppointments(updatedList);
      setSelectedAppointment({ ...selectedAppointment, notes: editedNotes });
      setIsEditingNotes(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.primary }]}>Appointments</Text>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
      >
        {appointments.map((item) => (
          <Card key={item.id} style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium">{item.doctor}</Text>
              <Text>Date: {item.date}</Text>
              <Text>Time: {item.time}</Text>
              <Text>Location: {item.location}</Text>
              <Text>Purpose: {item.purpose}</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => handleViewDetails(item)}>
                View Details
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>

      <Animated.View style={[styles.fabContainer, { bottom: fabPosition }]}>
        <FAB
          icon="calendar-plus"
          style={styles.fab}
          onPress={() => setRequestModalVisible(true)}
        />
      </Animated.View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <IconButton icon="close" onPress={closeModal} />
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailLabel}>Doctor:</Text>
              <Text>{selectedAppointment?.doctor}</Text>

              <Text style={styles.detailLabel}>Date:</Text>
              <Text>{selectedAppointment?.date}</Text>

              <Text style={styles.detailLabel}>Time:</Text>
              <Text>{selectedAppointment?.time}</Text>

              <Text style={styles.detailLabel}>Location:</Text>
              <Text>{selectedAppointment?.location}</Text>

              <Text style={styles.detailLabel}>Purpose:</Text>
              <Text>{selectedAppointment?.purpose}</Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.detailLabel}>Notes:</Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => setIsEditingNotes(true)}
                />
              </View>

              {isEditingNotes ? (
                <>
                  <TextInput
                    value={editedNotes}
                    onChangeText={setEditedNotes}
                    multiline
                    style={styles.input}
                  />
                  <Button mode="contained" onPress={handleSaveNotes}>
                    Save Notes
                  </Button>
                </>
              ) : (
                <Text>{selectedAppointment?.notes}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={requestModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Appointment</Text>
              <IconButton
                icon="close"
                onPress={() => setRequestModalVisible(false)}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              {[
                { label: "Doctor's Name", key: "doctor" },
                { label: "Date (YYYY-MM-DD)", key: "date" },
                { label: "Time", key: "time" },
                { label: "Location", key: "location" },
                { label: "Purpose", key: "purpose" },
                { label: "Notes", key: "notes" },
              ].map(({ label, key }) => (
                <TextInput
                  key={key}
                  label={label}
                  value={(newAppointment as any)[key]}
                  onChangeText={(text) =>
                    setNewAppointment((prev) => ({ ...prev, [key]: text }))
                  }
                  multiline={key === "notes"}
                  style={[styles.input, key === "notes" && { minHeight: 60 }]}
                />
              ))}

              <Button
                mode="contained"
                onPress={() => {
                  setAppointments((prev) => [
                    ...prev,
                    { ...newAppointment, id: Date.now().toString() },
                  ]);
                  setSnackbarVisible(true);
                  setRequestModalVisible(false);
                  setNewAppointment({
                    doctor: "",
                    date: "",
                    time: "",
                    location: "",
                    purpose: "",
                    notes: "",
                  });
                }}
                style={{ marginTop: 20 }}
              >
                Submit
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        style={{ backgroundColor: "#4CAF50" }}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Appointment requested successfully!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    paddingTop: 40,
    paddingBottom: 0, 
  },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 20,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  card: {
    marginBottom: 16,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
  },
  fab: {
    backgroundColor: "#007bff",
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
    gap: 8,
  },
  detailLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontStyle: "italic",
    fontWeight: "900",
    marginTop: 10,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "white",
  },
});
