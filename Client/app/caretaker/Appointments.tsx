import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  FAB,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { appointmentAPI } from "../../services/api";

interface Appointment {
  id: number;
  elder_id: number;
  elder_name: string;
  title: string;
  doctor_name?: string;
  location?: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
}

export default function Appointments() {
  const { colors } = useTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [location, setLocation] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      const fetchedAppointments = response.appointments || [];
      
      // If no appointments, show sample data
      if (fetchedAppointments.length === 0) {
        setAppointments([
          {
            id: -1,
            elder_id: 1,
            elder_name: "John Elder",
            title: "Cardiology Checkup",
            doctor_name: "Dr. Emily Thompson",
            location: "City Medical Center, Room 304",
            appointment_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: "scheduled",
            notes: "Bring previous ECG reports and current medication list.",
          },
          {
            id: -2,
            elder_id: 1,
            elder_name: "John Elder",
            title: "Diabetes Follow-up",
            doctor_name: "Dr. Michael Chen",
            location: "Downtown Clinic",
            appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 45,
            status: "scheduled",
            notes: "Fasting blood sugar test required before appointment.",
          },
        ]);
      } else {
        setAppointments(fetchedAppointments);
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      // Show sample data on error
      setAppointments([
        {
          id: -1,
          elder_id: 1,
          elder_name: "John Elder",
          title: "General Checkup",
          doctor_name: "Dr. Sarah Wilson",
          location: "Community Health Center",
          appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 30,
          status: "scheduled",
        },
      ]);
      showSnackbar("Showing sample data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const resetForm = () => {
    setTitle("");
    setDoctorName("");
    setLocation("");
    setAppointmentDate(new Date());
    setDuration("30");
    setNotes("");
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setTitle(appointment.title);
    setDoctorName(appointment.doctor_name || "");
    setLocation(appointment.location || "");
    setAppointmentDate(new Date(appointment.appointment_date));
    setDuration(appointment.duration_minutes.toString());
    setNotes(appointment.notes || "");
    setEditModalVisible(true);
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Field", "Please enter appointment title");
      return;
    }

    try {
      await appointmentAPI.add({
        title,
        doctor_name: doctorName || undefined,
        location: location || undefined,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: parseInt(duration) || 30,
        notes: notes || undefined,
      });
      showSnackbar("Appointment added successfully");
      setModalVisible(false);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add appointment");
    }
  };

  const handleUpdate = async () => {
    if (!selectedAppointment) return;
    if (!title.trim()) {
      Alert.alert("Missing Field", "Please enter appointment title");
      return;
    }

    try {
      await appointmentAPI.update(selectedAppointment.id, {
        title,
        doctor_name: doctorName || undefined,
        location: location || undefined,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: parseInt(duration) || 30,
        notes: notes || undefined,
      });
      showSnackbar("Appointment updated successfully");
      setEditModalVisible(false);
      resetForm();
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update appointment");
    }
  };

  const handleDelete = (appointment: Appointment) => {
    Alert.alert(
      "Delete Appointment",
      `Are you sure you want to delete "${appointment.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await appointmentAPI.delete(appointment.id);
              showSnackbar("Appointment deleted successfully");
              fetchAppointments();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete appointment");
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      await appointmentAPI.updateStatus(appointment.id, newStatus as any);
      showSnackbar(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(appointmentDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(newDate);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#4CAF50";
      case "cancelled": return "#f44336";
      default: return "#2196F3";
    }
  };

  // Sort appointments by date
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={[styles.title, { color: colors.primary }]}>Appointments</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((appointment) => (
            <CustomCard key={appointment.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                    {appointment.doctor_name && (
                      <Text style={styles.doctorName}>Dr. {appointment.doctor_name}</Text>
                    )}
                  </View>
                  <View
                    style={[styles.statusChip, { borderColor: getStatusColor(appointment.status) }]}
                  >
                    <Text style={{ color: getStatusColor(appointment.status), fontSize: 12 }}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#2196F3" />
                    <Text style={styles.detailText}>
                      {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#4CAF50" />
                    <Text style={styles.detailText}>
                      {new Date(appointment.appointment_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {appointment.location && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#FF9800" />
                      <Text style={styles.detailText}>{appointment.location}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color="#9C27B0" />
                    <Text style={styles.detailText}>{appointment.elder_name}</Text>
                  </View>
                </View>

                {appointment.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{appointment.notes}</Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  {appointment.status === "scheduled" && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => handleStatusChange(appointment, "completed")}
                        style={styles.completeButton}
                        labelStyle={styles.completeButtonLabel}
                        icon="check"
                      >
                        Complete
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleStatusChange(appointment, "cancelled")}
                        style={styles.cancelButton}
                        labelStyle={styles.cancelButtonLabel}
                        icon="close"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button
                    mode="outlined"
                    icon="pencil"
                    onPress={() => openEditModal(appointment)}
                    style={styles.editButton}
                    labelStyle={styles.editButtonLabel}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    icon="delete"
                    onPress={() => handleDelete(appointment)}
                    textColor="#f44336"
                    labelStyle={styles.deleteButtonLabel}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </CustomCard>
          ))
        ) : (
          <Text style={styles.emptyText}>No appointments scheduled</Text>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label="Add Appointment"
      />

      {/* Add Appointment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Appointment</Text>

              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Doctor Name"
                value={doctorName}
                onChangeText={setDoctorName}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                mode="outlined"
              />

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {appointmentDate.toLocaleDateString()}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.dateButton}
                icon="clock"
              >
                {appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}

              <TextInput
                label="Duration (minutes)"
                value={duration}
                onChangeText={setDuration}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
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

      {/* Edit Appointment Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Appointment</Text>

              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Doctor Name"
                value={doctorName}
                onChangeText={setDoctorName}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                mode="outlined"
              />

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {appointmentDate.toLocaleDateString()}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.dateButton}
                icon="clock"
              >
                {appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}

              <TextInput
                label="Duration (minutes)"
                value={duration}
                onChangeText={setDuration}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
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
                    setEditModalVisible(false);
                    resetForm();
                    setSelectedAppointment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleUpdate}>
                  Update
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
    backgroundColor: "#F5F5F5",
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
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: "#FFF",
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
  },
  notesBox: {
    backgroundColor: "#FFF9C4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FBC02D",
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  completeButton: {
    backgroundColor: "#4CAF50",
  },
  completeButtonLabel: {
    color: "#FFF",
    fontSize: 12,
  },
  cancelButton: {
    borderColor: "#f44336",
  },
  cancelButtonLabel: {
    color: "#f44336",
    fontSize: 12,
  },
  editButton: {
    borderColor: "#2196F3",
  },
  editButtonLabel: {
    color: "#2196F3",
    fontSize: 12,
  },
  deleteButtonLabel: {
    color: "#f44336",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 50,
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
  input: {
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
});
