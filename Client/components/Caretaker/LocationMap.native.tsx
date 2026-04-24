import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Location = {
  latitude: number;
  longitude: number;
};

type Props = {
  location: Location;
};

export default function LocationMap({ location }: Props) {
  return (
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
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
