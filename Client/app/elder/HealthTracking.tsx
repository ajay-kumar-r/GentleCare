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
import { healthAPI, socketService } from "../../services/api";

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

export default function HealthTracking() {
  const { colors } = useTheme();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchRecords = useCallback(async () => {
    try {
      const response = await healthAPI.getRecords({ days: 7 });
      const fetchedRecords = response.records || [];
      setRecords(fetchedRecords);
    } catch (error: any) {
      console.error("Error fetching health records:", error);
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    fetchRecords();

    const refreshFromRealtime = () => {
      fetchRecords();
    };

    socketService.on('health_record_added', refreshFromRealtime);
    socketService.on('health_record_deleted', refreshFromRealtime);

    return () => {
      socketService.off('health_record_added');
      socketService.off('health_record_deleted');
    };
  }, [fetchRecords]);
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
      data: filtered.map(r => {
        if (r.value.includes('/')) {
          return parseFloat(r.value.split('/')[0]) || 0;
        }
        return parseFloat(r.value) || 0;
      }),
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const heartRateData = getChartData("heart_rate");
  const glucoseData = getChartData("blood_glucose");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton />
        <Text style={[styles.title, { color: colors.primary }]}>Health Tracking</Text>

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

        {healthCategories.map(cat => {
          const data = getChartData(cat.id);
          if (data.data.length > 0) {
            const color = cat.id === 'heart_rate' ? '#E57373' : 
                          cat.id === 'blood_glucose' ? '#81C784' : 
                          cat.id === 'blood_pressure' ? '#64B5F6' : 
                          cat.id === 'oxygen_saturation' ? '#FFD54F' : 
                          cat.id === 'temperature' ? '#FF8A65' : '#BA68C8';
            return (
              <HealthChart
                key={`chart_${cat.id}`}
                title={`${cat.label} Trends`}
                labels={data.labels}
                data={data.data}
                color={color}
              />
            );
          }
          return null;
        })}
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
