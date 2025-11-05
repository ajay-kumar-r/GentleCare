import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  useTheme,
  FAB,
} from "react-native-paper";
import CustomSnackbar from "../components/CustomSnackbar";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";

export default function Prescriptions() {
  const { colors } = useTheme();

  const [prescriptions, setPrescriptions] = useState<any[]>([
    {
      id: "1",
      date: "2025-04-10",
      doctor: "Dr. Aarti Mehta",
      reason: "Diabetes Management",
      medicines: ["Metformin - 500mg - 2/day", "Glibenclamide - 5mg - 1/day"],
      image: null,
    },
    {
      id: "2",
      date: "2025-04-05",
      doctor: "Dr. Rajeev Menon",
      reason: "Blood Pressure Checkup",
      medicines: ["Amlodipine - 5mg - 1/day"],
      image: null,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    doctor: "",
    date: "",
    reason: "",
    medicines: "",
    image: null as string | null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split("T")[0];
      setNewPrescription((prev) => ({ ...prev, date: isoDate }));
    }
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets.length > 0) {
      setNewPrescription((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSubmit = () => {
    const formatted = {
      ...newPrescription,
      medicines: newPrescription.medicines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    if (editingId) {
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...formatted } : p))
      );
    } else {
      setPrescriptions((prev) => [
        ...prev,
        { ...formatted, id: Date.now().toString() },
      ]);
    }

    setNewPrescription({
      doctor: "",
      date: "",
      reason: "",
      medicines: "",
      image: null,
    });
    setEditingId(null);
    setSnackbarVisible(true);
    setModalVisible(false);
  };

  const handleEdit = (prescription: any) => {
    setEditingId(prescription.id);
    setNewPrescription({
      doctor: prescription.doctor,
      date: prescription.date,
      reason: prescription.reason,
      medicines: prescription.medicines.join("\n"),
      image: prescription.image,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure you want to delete this prescription?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setPrescriptions((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const groupedByDate = prescriptions.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <Text style={[styles.header, { color: colors.primary }]}>Prescriptions</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedByDate)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map((date) => (
            <View key={date}>
              <Text style={[styles.dateLabel, { color: colors.primary }]}>
                {new Date(date).toDateString()}
              </Text>
              {groupedByDate[date].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onLongPress={() => handleDelete(item.id)}
                  delayLongPress={400}
                >
                  <CustomCard style={styles.card}>
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text variant="titleMedium" style={{ flex: 1 }}>
                          {item.doctor}
                        </Text>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => handleEdit(item)}
                        />
                      </View>
                      <Text>Reason: {item.reason}</Text>
                      <Text>Medicines:</Text>
                      {item.medicines.map((med: string, index: number) => (
                        <Text key={index}>• {med}</Text>
                      ))}
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.image} />
                      )}
                    </View>
                  </CustomCard>
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </ScrollView>

      <FAB icon="plus" style={[styles.fab, {backgroundColor: colors.primary}]} onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Prescription" : "Add Prescription"}
              </Text>
              <IconButton icon="close" onPress={() => {
                setModalVisible(false);
                setEditingId(null);
                setNewPrescription({
                  doctor: "",
                  date: "",
                  reason: "",
                  medicines: "",
                  image: null,
                });
              }} />
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                label="Doctor"
                value={newPrescription.doctor}
                onChangeText={(text) => setNewPrescription((prev) => ({ ...prev, doctor: text }))}
                style={styles.input}
              />
              <TextInput
                label="Visit Reason"
                value={newPrescription.reason}
                onChangeText={(text) => setNewPrescription((prev) => ({ ...prev, reason: text }))}
                style={styles.input}
              />

              <TextInput
                label="Medicines (one per line)"
                value={newPrescription.medicines}
                onChangeText={(text) => setNewPrescription((prev) => ({ ...prev, medicines: text }))}
                style={[styles.input, { minHeight: 80 }]}
                multiline
              />

              <TextInput
                label="Date"
                value={newPrescription.date}
                editable={false}
                style={styles.input}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
              />
              {showDatePicker && (
                <DateTimePicker
                  mode="date"
                  value={newPrescription.date ? new Date(newPrescription.date) : new Date()}
                  onChange={handleDateChange}
                  display={Platform.OS === "ios" ? "inline" : "default"}
                />
              )}

              <Button
                icon="image"
                mode="outlined"
                onPress={handleImagePick}
                style={{ marginTop: 10 }}
              >
                Upload Image
              </Button>

              {newPrescription.image && (
                <Image source={{ uri: newPrescription.image }} style={styles.preview} />
              )}

              <Button mode="contained" onPress={handleSubmit} style={{ marginTop: 20 }}>
                Submit
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: "#4CAF50" }}
      >
        Prescription {editingId ? "updated" : "added"} successfully!
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: "#f9f9f9"
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  card: {
    marginBottom: 15,
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    marginTop: 20,
  },
  input: {
    marginBottom: 10,
  },
  preview: {
    width: "100%",
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    resizeMode: "contain",
  },
});
