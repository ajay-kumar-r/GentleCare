import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme } from "react-native-paper";
import HealthCard from "../components/Elder/HealthCard";
import HealthChart from "../components/Elder/HealthChart";
import BackButton from "../components/BackButton";
import CustomSnackbar from "../components/CustomSnackbar";
import { healthAPI } from "../../services/api";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    fetchHealthRecords();
  }, []);

    const fetchHealthRecords = async () => {
    try {
      const response = await healthAPI.getRecords({ days: 7 });
      const fetchedRecords = response.records || [];
      
      // Generate comprehensive sample data for the last 7 days
      const sampleData: HealthRecord[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Heart Rate data
        sampleData.push({
          id: -(i * 4 + 1),
          type: "heart_rate",
          value: (70 + Math.floor(Math.random() * 10)).toString(),
          unit: "bpm",
          recorded_at: date.toISOString(),
        });
        
        // Blood Pressure data
        sampleData.push({
          id: -(i * 4 + 2),
          type: "blood_pressure",
          value: `${115 + Math.floor(Math.random() * 10)}/${70 + Math.floor(Math.random() * 10)}`,
          unit: "mmHg",
          recorded_at: date.toISOString(),
        });
        
        // Glucose data
        sampleData.push({
          id: -(i * 4 + 3),
          type: "glucose",
          value: (90 + Math.floor(Math.random() * 15)).toString(),
          unit: "mg/dL",
          recorded_at: date.toISOString(),
        });
        
        // Oxygen Saturation data
        sampleData.push({
          id: -(i * 4 + 4),
          type: "oxygen_saturation",
          value: (96 + Math.floor(Math.random() * 3)).toString(),
          unit: "%",
          recorded_at: date.toISOString(),
        });
      }
      
      // Merge fetched records with sample data, prioritizing fetched records
      const allRecords = [...fetchedRecords, ...sampleData];
      setHealthRecords(allRecords);
      
      if (fetchedRecords.length === 0) {
        showSnackbar("Showing sample data - Records will sync from caretaker");
      }
    } catch (error: any) {
      console.error("Error fetching health records:", error);
      // Fallback to sample data on error (just generate a simple set)
      const simpleSample: HealthRecord[] = [
        { id: -1, type: "heart_rate", value: "72", unit: "bpm", recorded_at: new Date().toISOString() },
        { id: -2, type: "blood_pressure", value: "120/80", unit: "mmHg", recorded_at: new Date().toISOString() },
        { id: -3, type: "glucose", value: "95", unit: "mg/dL", recorded_at: new Date().toISOString() },
        { id: -4, type: "oxygen_saturation", value: "98", unit: "%", recorded_at: new Date().toISOString() },
      ];
      setHealthRecords(simpleSample);
      showSnackbar("Showing sample data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
});
