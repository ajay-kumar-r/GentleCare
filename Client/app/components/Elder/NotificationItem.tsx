import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

interface NotificationItemProps {
  text: string;
}

export default function NotificationItem({ text }: NotificationItemProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="notifications" size={20} color="#007AFF" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginLeft: 10,
    flex: 1,
  },
});
