import { View, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Text } from "react-native-paper";

interface HealthChartProps {
  title: string;
  labels: string[];
  data: number[];
  color: string;
}

export default function HealthChart({ title, labels, data, color }: HealthChartProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={{
          labels: labels,
          datasets: [{ data: data }],
        }}
        width={Dimensions.get("window").width - 40}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#FFF",
          backgroundGradientTo: "#FFF",
          color: () => color,
          labelColor: () => "#000",
          strokeWidth: 2,
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
    width: "auto",
    marginRight: 20,
  },
});
