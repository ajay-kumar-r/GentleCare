import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme } from "react-native-paper";
import HealthCard from "../components/Elder/HealthCard";
import HealthChart from "../components/Elder/HealthChart";
import BackButton from "../components/BackButton";
import CustomSnackbar from "../components/CustomSnackbar";
import { healthAPI, socketService } from "../../services/api";

interface HealthRecord {
  id: number;
  type: string;
  value: string;
  unit: string;
  recorded_at: string;
}

export default function HealthTracking() {
  const { colors } = useTheme();
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const fetchHealthRecords = useCallback(async () => {
    try {
      const response = await healthAPI.getRecords({ days: 7 });
      const fetchedRecords = response.records || [];
      setHealthRecords(fetchedRecords);
    } catch (error: any) {
      console.error("Error fetching health records:", error);
      setHealthRecords([]);
      showSnackbar(error.message || "Failed to load health records");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthRecords();

    const refreshFromRealtime = () => {
      fetchHealthRecords();
    };

    socketService.on('health_record_added', refreshFromRealtime);
    socketService.on('health_record_deleted', refreshFromRealtime);

    return () => {
      socketService.off('health_record_added');
      socketService.off('health_record_deleted');
    };
  }, [fetchHealthRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHealthRecords();
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  // Calculate latest values for each type
  const getLatestValue = (type: string) => {
    const records = healthRecords.filter(r => r.type.toLowerCase() === type.toLowerCase());
    return records.length > 0 ? records[0].value : "N/A";
  };

  // Get chart data for a specific type
  const getChartData = (type: string) => {
    const records = healthRecords
      .filter(r => r.type.toLowerCase() === type.toLowerCase())
      .slice(0, 7)
      .reverse();
    
    return {
      labels: records.map((_, i) => `Day ${i + 1}`),
      data: records.map(r => parseFloat(r.value) || 0),
    };
  };

  const heartRateData = getChartData("heart_rate");
  const glucoseData = getChartData("glucose");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton />
        <Text style={[styles.title, { color: colors.primary }]}>Health Tracking</Text>

        {healthRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No health records yet</Text>
            <Text style={styles.emptyBody}>
              New vitals from your caretaker will appear here in real time.
            </Text>
          </View>
        ) : (
          <>
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
              value={getLatestValue("glucose")} 
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
          </>
        )}

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

      {/* Elder cannot add records - only caretaker can add records */}
      
      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
      >
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginVertical: 10,
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
});
