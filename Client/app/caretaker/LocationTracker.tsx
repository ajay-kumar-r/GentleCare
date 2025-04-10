import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text as RNText, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Card, Text, useTheme, Avatar, Divider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function LocationTracker() {
  const { colors } = useTheme();

  const [location, setLocation] = useState({
    latitude: 13.01268,
    longitude: 80.236362,
  });

  const [lastLocation, setLastLocation] = useState(location);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [movementStatus, setMovementStatus] = useState("Stationary");
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLatOffset = (Math.random() - 0.5) * 0.001;
      const randomLngOffset = (Math.random() - 0.5) * 0.001;

      const newLocation = {
        latitude: location.latitude + randomLatOffset,
        longitude: location.longitude + randomLngOffset,
      };

      const distance = Math.sqrt(
        Math.pow(newLocation.latitude - location.latitude, 2) +
        Math.pow(newLocation.longitude - location.longitude, 2)
      );

      setLastLocation(location);
      setLocation(newLocation);
      setLastUpdated(new Date());

      if (distance > 0.0002) {
        setMovementStatus("Moving");
      } else {
        setMovementStatus("Stationary");
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [location]);

  const formatTime = (date: Date) => {
    return `${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.primary }]}>
        Elder Location Tracker
      </Text>

      <Card style={styles.card} mode="outlined">
        <Card.Title
          title="Ravi Sharma"
          subtitle={`Movement: ${movementStatus}`}
          left={(props) => <Avatar.Icon {...props} icon="account" />}
        />
        <Divider />
        <Card.Content>
          <Text>Last Updated: {formatTime(lastUpdated)}</Text>
        </Card.Content>
      </Card>

      <View style={[styles.mapContainer, mapExpanded && styles.mapContainerExpanded]}>
        <MapView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={location}
            title="Ravi Sharma"
            description="Elder's current location"
          />
        </MapView>
        <TouchableOpacity
          style={styles.expandIcon}
          onPress={() => setMapExpanded(!mapExpanded)}
        >
          <MaterialIcons
            name={mapExpanded ? "fullscreen-exit" : "fullscreen"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapContainerExpanded: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  expandIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    elevation: 5,
  },
});
