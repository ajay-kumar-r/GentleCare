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
  useTheme,
  FAB,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HealthCard from "../components/Elder/HealthCard";
import HealthChart from "../components/Elder/HealthChart";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { healthAPI } from "../../services/api";

interface HealthRecord {
  id: number;
  type: string;
  value: string;
  unit: string;
  notes?: string;
  recorded_at: string;
}

interface Elder {
  id: number;
  user_id: number;
  full_name: string;
}

export default function HealthRecords() {
  const { colors } = useTheme();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  
  // Elder selection
  const [elders, setElders] = useState<Elder[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null);
  
  // Form fields
  const [selectedCategory, setSelectedCategory] = useState("");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState(""); // For systolic/diastolic BP
  const [notes, setNotes] = useState("");

  // Health record categories with auto-assigned units
  const healthCategories = [
    { id: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: "heart", type: "dual", placeholder1: "Systolic", placeholder2: "Diastolic" },
    { id: "heart_rate", label: "Heart Rate", unit: "bpm", icon: "heart-pulse", type: "single", placeholder: "72" },
    { id: "blood_glucose", label: "Blood Glucose", unit: "mg/dL", icon: "water", type: "single", placeholder: "95" },
    { id: "temperature", label: "Temperature", unit: "°F", icon: "thermometer", type: "single", placeholder: "98.6" },
    { id: "oxygen_saturation", label: "Oxygen Level", unit: "%", icon: "pulse", type: "single", placeholder: "98" },
    { id: "weight", label: "Weight", unit: "lbs", icon: "scale", type: "single", placeholder: "150" },
    { id: "respiratory_rate", label: "Respiratory Rate", unit: "breaths/min", icon: "pulse", type: "single", placeholder: "16" },
  ];

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    loadUserData();
    fetchRecords();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.user_type === 'caretaker' && user.profile?.elders) {
          setElders(user.profile.elders);
          // Auto-select first elder if only one
          if (user.profile.elders.length === 1) {
            setSelectedElderId(user.profile.elders[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await healthAPI.getRecords({ days: 7 });
      const fetchedRecords = response.records || [];
      
      // Always use fetched records
      setRecords(fetchedRecords);
    } catch (error: any) {
      console.error("Error fetching health records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate latest values for each type
  const getLatestValue = (type: string) => {
    const filtered = records.filter(r => r.type.toLowerCase() === type.toLowerCase());
    return filtered.length > 0 ? filtered[0].value : "N/A";
  };

  // Get chart data for a specific type
  const getChartData = (type: string) => {
    const filtered = records
      .filter(r => r.type.toLowerCase() === type.toLowerCase())
      .slice(0, 7)
      .reverse();
    
    return {
      labels: filtered.map((_, i) => `Day ${i + 1}`),
      data: filtered.map(r => parseFloat(r.value) || 0),
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const resetForm = () => {
    setSelectedCategory("");
    setValue("");
    setValue2("");
    setNotes("");
  };

  const getSelectedCategory = () => {
    return healthCategories.find(cat => cat.id === selectedCategory);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleAdd = async () => {
    const category = getSelectedCategory();
    
    if (!selectedElderId) {
      Alert.alert("Select Elder", "Please select an elder to add this record for");
      return;
    }
    
    if (!selectedCategory || !category) {
      Alert.alert("Missing Category", "Please select a health category");
      return;
    }

    if (!value.trim()) {
      Alert.alert("Missing Value", "Please enter a value");
      return;
    }

    // For blood pressure, need both values
    if (category.type === "dual" && !value2.trim()) {
      Alert.alert("Missing Value", "Please enter both systolic and diastolic values");
      return;
    }

    try {
      const finalValue = category.type === "dual" ? `${value}/${value2}` : value;
      
      await healthAPI.addRecord({
        type: category.id,
        value: finalValue,
        unit: category.unit,
        notes: notes || undefined,
        elder_id: selectedElderId,
      });
      
      // Close modal and reset form first
      setModalVisible(false);
      resetForm();
      
      // Show success message
      showSnackbar("Health record added successfully");
      
      // Refresh the records list
      await fetchRecords();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add health record");
    }
  };

  const handleDelete = (record: HealthRecord) => {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to delete this ${record.type} record?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await healthAPI.delete(record.id);
              showSnackbar("Record deleted successfully");
              fetchRecords();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete record");
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

  const heartRateData = getChartData("heart_rate");
  const glucoseData = getChartData("blood_glucose");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton />
        <Text style={[styles.title, { color: colors.primary }]}>Health Records</Text>

        <HealthCard 
          title="Heart Rate" 
          value={getLatestValue("heart_rate")} 
          unit="bpm" 
          icon="heart-pulse" 
          color="#E57373" 
        />
        <HealthCard 
          title="Blood Pressure" 
          value={getLatestValue("blood_pressure")} 
          unit="mmHg" 
          icon="heart" 
          color="#64B5F6" 
        />
        <HealthCard 
          title="Glucose Level" 
          value={getLatestValue("blood_glucose")} 
          unit="mg/dL" 
          icon="test-tube" 
          color="#81C784" 
        />
        <HealthCard 
          title="Oxygen Saturation" 
          value={getLatestValue("oxygen_saturation")} 
          unit="%" 
          icon="weather-windy" 
          color="#FFD54F" 
        />

        {heartRateData.data.length > 0 && (
          <HealthChart
            title="Heart Rate Trends"
            labels={heartRateData.labels}
            data={heartRateData.data}
            color="#E57373"
          />
        )}
        
        {glucoseData.data.length > 0 && (
          <HealthChart
            title="Glucose Levels (Past Week)"
            labels={glucoseData.labels}
            data={glucoseData.data}
            color="#81C784"
          />
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label="Add Record"
      />

      {/* Add Record Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Health Record</Text>

              {/* Elder Selection */}
              {elders.length > 1 && (
                <>
                  <Text style={styles.sectionLabel}>Select Elder *</Text>
                  <View style={styles.elderSelection}>
                    {elders.map((elder) => (
                      <Button
                        key={elder.id}
                        mode={selectedElderId === elder.id ? "contained" : "outlined"}
                        onPress={() => setSelectedElderId(elder.id)}
                        style={styles.elderButton}
                      >
                        {elder.full_name}
                      </Button>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.sectionLabel}>Select Category *</Text>
              <View style={styles.categoryGrid}>
                {healthCategories.map((category) => (
                  <Button
                    key={category.id}
                    mode={selectedCategory === category.id ? "contained" : "outlined"}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setValue("");
                      setValue2("");
                    }}
                    style={styles.categoryButton}
                    icon={category.icon}
                    contentStyle={styles.categoryButtonContent}
                  >
                    {category.label}
                  </Button>
                ))}
              </View>

              {selectedCategory && (() => {
                const category = getSelectedCategory();
                return category ? (
                  <View style={styles.valueSection}>
                    <Text style={styles.sectionLabel}>
                      Enter Value ({category.unit}) *
                    </Text>
                    
                    {category.type === "dual" ? (
                      <View style={styles.dualValueRow}>
                        <TextInput
                          label={category.placeholder1}
                          value={value}
                          onChangeText={setValue}
                          style={[styles.input, styles.halfInput]}
                          mode="outlined"
                          keyboardType="numeric"
                          placeholder="120"
                        />
                        <Text style={styles.slashText}>/</Text>
                        <TextInput
                          label={category.placeholder2}
                          value={value2}
                          onChangeText={setValue2}
                          style={[styles.input, styles.halfInput]}
                          mode="outlined"
                          keyboardType="numeric"
                          placeholder="80"
                        />
                      </View>
                    ) : (
                      <TextInput
                        label={`${category.label} Value`}
                        value={value}
                        onChangeText={setValue}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        placeholder={category.placeholder}
                      />
                    )}

                    <TextInput
                      label="Notes (optional)"
                      value={notes}
                      onChangeText={setNotes}
                      style={styles.input}
                      mode="outlined"
                      multiline
                      numberOfLines={2}
                      placeholder="Add any additional notes..."
                    />
                  </View>
                ) : null;
              })()}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleAdd}
                  style={{ flex: 1, marginLeft: 8 }}
                  disabled={!selectedCategory || !value}
                >
                  Add Record
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
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 20,
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
  sectionLabel: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginTop: 12,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    minWidth: "48%",
    marginBottom: 8,
  },
  categoryButtonContent: {
    paddingVertical: 8,
  },
  valueSection: {
    marginTop: 8,
  },
  dualValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  slashText: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#666",
    marginBottom: 12,
  },
  elderSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  elderButton: {
    flex: 1,
    minWidth: "45%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});
