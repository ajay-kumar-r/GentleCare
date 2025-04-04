import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface NotificationItemProps {
  text: string;
}

const NotificationItem = ({ text }: NotificationItemProps) => {
  return (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
});

export default NotificationItem;
