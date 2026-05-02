import React, { useState, useEffect, useCallback } from "react";
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
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { appointmentAPI, socketService } from "../../services/api";

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
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#4CAF50";
      case "cancelled": return "#f44336";
      default: return "#2196F3";
    }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await appointmentAPI.getAll();
      const fetchedAppointments = response.appointments || [];
      setAppointments(fetchedAppointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      showSnackbar("Failed to load appointments");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();

    const refreshFromRealtime = () => {
      fetchAppointments();
    };

    socketService.on('appointment_added', refreshFromRealtime);
    socketService.on('appointment_updated', refreshFromRealtime);
    socketService.on('appointment_deleted', refreshFromRealtime);

    return () => {
      socketService.off('appointment_added');
      socketService.off('appointment_updated');
      socketService.off('appointment_deleted');
    };
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  // Sort appointments by date
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                    <Text style={[styles.appointmentTitle, { color: colors.onSurface || "#1A1D21" }]}>{appointment.title}</Text>
                    {appointment.doctor_name && (
                      <Text style={[styles.doctorName, { color: colors.onSurfaceVariant || "#666" }]}>Dr. {appointment.doctor_name}</Text>
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
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.onSurfaceVariant || "#666" }]}>
                      {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#4CAF50" />
                    <Text style={[styles.detailText, { color: colors.onSurfaceVariant || "#666" }]}>
                      {new Date(appointment.appointment_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {appointment.location && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#FF9800" />
                      <Text style={[styles.detailText, { color: colors.onSurfaceVariant || "#666" }]}>{appointment.location}</Text>
                    </View>
                  )}
                </View>

                {appointment.notes && (
                  <View style={[styles.notesBox, { backgroundColor: colors.surfaceVariant || "#F5F5F5", borderLeftColor: colors.primary }]}>
                    <Text style={[styles.notesLabel, { color: colors.primary }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.onSurfaceVariant || "#333" }]}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
            </CustomCard>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.onSurfaceVariant || "#999"} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant || "#999" }]}>No appointments scheduled</Text>
          </View>
        )}
      </ScrollView>

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
  card: {
    marginBottom: 16,
    elevation: 0,
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
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
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
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
  },
  notesBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
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
    marginTop: 10,
    fontFamily: "Poppins_400Regular",
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
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
