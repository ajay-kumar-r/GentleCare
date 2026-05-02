import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import {
  Text,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { prescriptionAPI, socketService } from "../../services/api";

interface Prescription {
  id: number;
  elder_id: number;
  doctor_name?: string;
  date: string;
  diagnosis?: string;
  medicines: string;  // JSON string
  notes?: string;
  image_path?: string;
}

export default function Prescriptions() {
  const { colors } = useTheme();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const fetchPrescriptions = useCallback(async () => {
    try {
      const response = await prescriptionAPI.getAll();
      const fetchedPrescriptions = response.prescriptions || [];
      setPrescriptions(fetchedPrescriptions);
    } catch (error: any) {
      console.error("Error fetching prescriptions:", error);
      showSnackbar("Failed to load prescriptions");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();

    const refreshFromRealtime = () => {
      fetchPrescriptions();
    };

    socketService.on('prescription_added', refreshFromRealtime);
    socketService.on('prescription_updated', refreshFromRealtime);
    socketService.on('prescription_deleted', refreshFromRealtime);

    return () => {
      socketService.off('prescription_added');
      socketService.off('prescription_updated');
      socketService.off('prescription_deleted');
    };
  }, [fetchPrescriptions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const parseMedicines = (medicinesStr: string): string[] => {
    try {
      if (!medicinesStr) return [];
      const parsed = JSON.parse(medicinesStr);
      return Array.isArray(parsed) ? parsed : [medicinesStr];
    } catch {
      return medicinesStr ? medicinesStr.split(',').map(m => m.trim()) : [];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <Text style={[styles.title, { color: colors.primary }]}>Prescriptions</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => {
            const medicinesList = parseMedicines(prescription.medicines);
            return (
              <CustomCard key={prescription.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.prescriptionHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                      <Ionicons name="document-text" size={28} color={colors.primary} />
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={[styles.dateText, { color: colors.onSurface || "#1A1D21" }]}>
                        {new Date(prescription.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      {prescription.doctor_name && (
                        <Text style={[styles.doctorText, { color: colors.onSurfaceVariant || "#666" }]}>Dr. {prescription.doctor_name}</Text>
                      )}
                    </View>
                  </View>

                  {prescription.diagnosis && (
                    <View style={[styles.diagnosisBox, { backgroundColor: colors.surfaceVariant || "#F5F5F5", borderLeftColor: "#f44336" }]}>
                      <Text style={[styles.diagnosisLabel, { color: colors.onSurfaceVariant || "#666" }]}>Diagnosis:</Text>
                      <Text style={[styles.diagnosisText, { color: colors.onSurface || "#333" }]}>{prescription.diagnosis}</Text>
                    </View>
                  )}

                  <View style={styles.medicinesContainer}>
                    <Text style={[styles.medicinesLabel, { color: colors.onSurface || "#333" }]}>Medicines:</Text>
                    {medicinesList.map((medicine, index) => (
                      <View key={index} style={styles.medicineRow}>
                        <Ionicons name="medical" size={16} color="#4CAF50" />
                        <Text style={[styles.medicineText, { color: colors.onSurfaceVariant || "#333" }]}>{medicine}</Text>
                      </View>
                    ))}
                  </View>

                  {prescription.notes && (
                    <View style={[styles.notesBox, { backgroundColor: colors.surfaceVariant || "#F5F5F5", borderLeftColor: colors.primary }]}>
                      <Text style={[styles.notesLabel, { color: colors.primary }]}>Notes:</Text>
                      <Text style={[styles.notesText, { color: colors.onSurfaceVariant || "#333" }]}>{prescription.notes}</Text>
                    </View>
                  )}

                  {prescription.image_path && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: prescription.image_path }}
                        style={styles.prescriptionImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>
              </CustomCard>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.onSurfaceVariant || "#999"} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant || "#999" }]}>No prescriptions available</Text>
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
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  diagnosisBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  diagnosisLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  medicinesContainer: {
    marginBottom: 12,
  },
  medicinesLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
  },
  medicineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingLeft: 8,
  },
  medicineText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginLeft: 8,
    flex: 1,
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
  imageContainer: {
    marginBottom: 12,
  },
  prescriptionImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    borderColor: "#2196F3",
    flex: 1,
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
  imageButton: {
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
});
