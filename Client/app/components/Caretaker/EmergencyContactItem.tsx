import React from "react";
import { View, StyleSheet, Linking, Alert } from "react-native";
import { Text, IconButton, Avatar } from "react-native-paper";
import CustomCard from "../CustomCard";

export default function EmergencyContactItem({
  contact,
  onEdit,
  onDelete,
}: {
  contact: { id: string; name: string; phone: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const handleCall = () => {
    if (!contact?.phone) {
      Alert.alert("Error", "No phone number available to call.");
      return;
    }
    Linking.openURL(`tel:${contact.phone}`);
  };

  const getInitial = (name: string | undefined) => {
    if (!name || name.length === 0) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <CustomCard style={styles.card}>
      <View>
        <View style={styles.row}>
          <Avatar.Text
            label={getInitial(contact?.name)}
            size={40}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>
              {contact?.name || "Unnamed Contact"}
            </Text>
            <Text style={styles.phone}>
              {contact?.phone || "No Number Provided"}
            </Text>
          </View>
          <View style={styles.actions}>
            <IconButton icon="phone" onPress={handleCall} />
            <IconButton icon="pencil" onPress={onEdit} />
            <IconButton icon="delete" onPress={onDelete} />
          </View>
        </View>
      </View>
    </CustomCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  phone: {
    fontSize: 14,
    color: "#555",
  },
  actions: {
    flexDirection: "row",
  },
});
