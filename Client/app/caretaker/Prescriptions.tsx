import React, { useState, useEffect } from "react";
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
  TextInput,
  Button,
  useTheme,
  FAB,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { prescriptionAPI } from "../../services/api";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Form fields
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState("");  // Newline-separated list
  const [notes, setNotes] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionAPI.getAll();
      const fetchedPrescriptions = response.prescriptions || [];
      
      // If no prescriptions, show sample data
      if (fetchedPrescriptions.length === 0) {
        setPrescriptions([
          {
            id: -1,
            elder_id: 1,
            doctor_name: "Dr. Sarah Johnson",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            diagnosis: "Hypertension Management",
            medicines: JSON.stringify([
              "Amlodipine 5mg - Once daily",
              "Lisinopril 10mg - Once daily in the morning"
            ]),
            notes: "Monitor blood pressure daily. Follow up in 2 weeks.",
          },
          {
            id: -2,
            elder_id: 1,
            doctor_name: "Dr. Michael Chen",
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            diagnosis: "Type 2 Diabetes",
            medicines: JSON.stringify([
              "Metformin 500mg - Twice daily with meals",
              "Glimepiride 2mg - Once daily before breakfast"
            ]),
            notes: "Check blood glucose levels before meals. Maintain healthy diet.",
          },
        ]);
      } else {
        setPrescriptions(fetchedPrescriptions);
      }
    } catch (error: any) {
      console.error("Error fetching prescriptions:", error);
      // Show sample data on error
      setPrescriptions([
        {
          id: -1,
          elder_id: 1,
          doctor_name: "Dr. Sarah Johnson",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          diagnosis: "Hypertension Management",
          medicines: JSON.stringify([
            "Amlodipine 5mg - Once daily",
            "Lisinopril 10mg - Once daily in the morning"
          ]),
          notes: "Monitor blood pressure daily. Follow up in 2 weeks.",
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
    fetchPrescriptions();
  };

  const resetForm = () => {
    setDoctorName("");
    setDate(new Date());
    setDiagnosis("");
    setMedicines("");
    setNotes("");
    setImagePath(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (prescription: Prescription) => {
    if (prescription.id < 0) {
      Alert.alert("Cannot Edit", "Sample data cannot be edited. Add real prescriptions to manage them.");
      return;
    }
    
    setSelectedPrescription(prescription);
    setDoctorName(prescription.doctor_name || "");
    setDate(new Date(prescription.date));
    setDiagnosis(prescription.diagnosis || "");
    // Parse JSON medicines to newline-separated string
    try {
      const medList = JSON.parse(prescription.medicines);
      setMedicines(Array.isArray(medList) ? medList.join("\n") : "");
    } catch {
      setMedicines(prescription.medicines || "");
    }
    setNotes(prescription.notes || "");
    setImagePath(prescription.image_path || null);
    setEditModalVisible(true);
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImagePath(result.assets[0].uri);
    }
  };

  const handleAdd = async () => {
    if (!medicines.trim()) {
      Alert.alert("Missing Field", "Please enter at least one medicine");
      return;
    }

    try {
      // Convert newline-separated medicines to JSON array
      const medicinesList = medicines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      await prescriptionAPI.add({
        doctor_name: doctorName || undefined,
        date: date.toISOString().split("T")[0],
        diagnosis: diagnosis || undefined,
        medicines: JSON.stringify(medicinesList),
        notes: notes || undefined,
        image_path: imagePath || undefined,
      });
      showSnackbar("Prescription added successfully");
      setModalVisible(false);
      resetForm();
      fetchPrescriptions();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add prescription");
    }
  };

  const handleUpdate = async () => {
    if (!selectedPrescription) return;
    if (!medicines.trim()) {
      Alert.alert("Missing Field", "Please enter at least one medicine");
      return;
    }

    try {
      const medicinesList = medicines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      await prescriptionAPI.update(selectedPrescription.id, {
        doctor_name: doctorName || undefined,
        date: date.toISOString().split("T")[0],
        diagnosis: diagnosis || undefined,
        medicines: JSON.stringify(medicinesList),
        notes: notes || undefined,
        image_path: imagePath || undefined,
      });
      showSnackbar("Prescription updated successfully");
      setEditModalVisible(false);
      resetForm();
      setSelectedPrescription(null);
      fetchPrescriptions();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update prescription");
    }
  };

  const handleDelete = (prescription: Prescription) => {
    if (prescription.id < 0) {
      Alert.alert("Cannot Delete", "Sample data cannot be deleted. Add real prescriptions to manage them.");
      return;
    }
    
    Alert.alert(
      "Delete Prescription",
      `Are you sure you want to delete this prescription from ${new Date(
        prescription.date
      ).toLocaleDateString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await prescriptionAPI.delete(prescription.id);
              showSnackbar("Prescription deleted successfully");
              fetchPrescriptions();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete prescription");
            }
          },
        },
      ]
    );
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Parse medicines from JSON string
  const parseMedicines = (medicinesStr: string): string[] => {
    try {
      const parsed = JSON.parse(medicinesStr);
      return Array.isArray(parsed) ? parsed : [medicinesStr];
    } catch {
      return [medicinesStr];
    }
  };

  return (
    <View style={styles.container}>
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
                    <View style={styles.iconCircle}>
                      <Ionicons name="document-text" size={28} color="#2196F3" />
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.dateText}>
                        {new Date(prescription.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      {prescription.doctor_name && (
                        <Text style={styles.doctorText}>Dr. {prescription.doctor_name}</Text>
                      )}
                    </View>
                  </View>

                  {prescription.diagnosis && (
                    <View style={styles.diagnosisBox}>
                      <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                      <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
                    </View>
                  )}

                  <View style={styles.medicinesContainer}>
                    <Text style={styles.medicinesLabel}>Medicines:</Text>
                    {medicinesList.map((medicine, index) => (
                      <View key={index} style={styles.medicineRow}>
                        <Ionicons name="medical" size={16} color="#4CAF50" />
                        <Text style={styles.medicineText}>{medicine}</Text>
                      </View>
                    ))}
                  </View>

                  {prescription.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{prescription.notes}</Text>
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

                  <View style={styles.actionButtons}>
                    <Button
                      mode="outlined"
                      icon="pencil"
                      onPress={() => openEditModal(prescription)}
                      style={styles.editButton}
                      labelStyle={styles.editButtonLabel}
                    >
                      Edit
                    </Button>
                    <Button
                      mode="text"
                      icon="delete"
                      onPress={() => handleDelete(prescription)}
                      textColor="#f44336"
                      labelStyle={styles.deleteButtonLabel}
                    >
                      Delete
                    </Button>
                  </View>
                </View>
              </CustomCard>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No prescriptions available</Text>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label="Add Prescription"
      />

      {/* Add Prescription Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Prescription</Text>

              <TextInput
                label="Doctor Name"
                value={doctorName}
                onChangeText={setDoctorName}
                style={styles.input}
                mode="outlined"
              />

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {date.toLocaleDateString()}
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              <TextInput
                label="Diagnosis"
                value={diagnosis}
                onChangeText={setDiagnosis}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Medicines (one per line) *"
                value={medicines}
                onChangeText={setMedicines}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="e.g., Metformin - 500mg - 2/day"
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

              <Button
                mode="outlined"
                icon="image"
                onPress={handleImagePick}
                style={styles.imageButton}
              >
                {imagePath ? "Change Image" : "Add Prescription Image"}
              </Button>

              {imagePath && (
                <Image source={{ uri: imagePath }} style={styles.previewImage} />
              )}

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

      {/* Edit Prescription Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Prescription</Text>

              <TextInput
                label="Doctor Name"
                value={doctorName}
                onChangeText={setDoctorName}
                style={styles.input}
                mode="outlined"
              />

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {date.toLocaleDateString()}
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              <TextInput
                label="Diagnosis"
                value={diagnosis}
                onChangeText={setDiagnosis}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Medicines (one per line) *"
                value={medicines}
                onChangeText={setMedicines}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
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

              <Button
                mode="outlined"
                icon="image"
                onPress={handleImagePick}
                style={styles.imageButton}
              >
                {imagePath ? "Change Image" : "Add Prescription Image"}
              </Button>

              {imagePath && (
                <Image source={{ uri: imagePath }} style={styles.previewImage} />
              )}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditModalVisible(false);
                    resetForm();
                    setSelectedPrescription(null);
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
    color: "#333",
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  diagnosisBox: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  diagnosisLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  medicinesContainer: {
    marginBottom: 12,
  },
  medicinesLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
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
    color: "#333",
    marginLeft: 8,
    flex: 1,
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
