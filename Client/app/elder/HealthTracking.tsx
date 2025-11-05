import { View, ScrollView, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import HealthCard from "../components/Elder/HealthCard";
import HealthChart from "../components/Elder/HealthChart";
import BackButton from "../components/BackButton";

export default function HealthTracking() {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <BackButton />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.primary }]}>Health Tracking</Text>

        <HealthCard title="Heart Rate" value="72" unit="bpm" icon="heart-pulse" color="#E57373" />
        <HealthCard title="Blood Pressure" value="120/80" unit="mmHg" icon="heart" color="#64B5F6" />
        <HealthCard title="Glucose Level" value="95" unit="mg/dL" icon="test-tube" color="#81C784" />
        <HealthCard title="Oxygen Saturation" value="98" unit="%" icon="weather-windy" color="#FFD54F" />

        <HealthChart
          title="Heart Rate Trends"
          labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          data={[72, 74, 70, 75, 71, 73, 72]}
          color="#E57373"
        />
        <HealthChart
          title="Glucose Levels (Past Week)"
          labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          data={[95, 97, 92, 96, 94, 93, 95]}
          color="#81C784"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginVertical: 10,
    marginTop: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
