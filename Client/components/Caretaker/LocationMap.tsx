import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

type Location = {
  latitude: number;
  longitude: number;
};

type Props = {
  location: Location;
};

export default function LocationMap({ location }: Props) {
  return (
    <View style={[styles.map, styles.webMapFallback]}>
      <MaterialIcons name="location-on" size={40} color="#007AFF" />
      <Text style={styles.webMapText}>Map preview is available on iOS/Android.</Text>
      <Text style={styles.webMapCoords}>
        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    gap: 8,
  },
  webMapText: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
  },
  webMapCoords: {
    color: "#444",
    fontSize: 12,
  },
});
