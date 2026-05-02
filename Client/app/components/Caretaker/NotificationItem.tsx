import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

interface NotificationItemProps {
  text: string;
  type?: string;
  time?: string;
}

const NotificationItem = ({ text, type, time }: NotificationItemProps) => {
  const { colors } = useTheme();
  
  const getIcon = () => {
    switch (type) {
      case 'medication': return 'medical';
      case 'meal': return 'restaurant';
      case 'appointment': return 'calendar';
      case 'health': return 'heart';
      default: return 'notifications';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'medication': return '#2196F3';
      case 'meal': return '#FF9800';
      case 'appointment': return '#4CAF50';
      case 'health': return '#E57373';
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.notificationItem, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: getColor() + '15' }]}>
        <Ionicons name={getIcon() as any} size={18} color={getColor()} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.notificationText, { color: colors.onSurface }]}>{text}</Text>
        {time && <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>{time}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  notificationText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    lineHeight: 18,
  },
  timeText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
});

export default NotificationItem;
