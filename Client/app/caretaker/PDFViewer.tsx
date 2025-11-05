import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import BackButton from "../components/BackButton";

export default function PDFViewer() {
  const { colors } = useTheme();
  const { title, uri } = useLocalSearchParams();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <Text style={[styles.header, { color: colors.primary }]}>
        {title || "Document"}
      </Text>

      {uri ? (
        <WebView
          source={{ uri: uri as string }}
          style={styles.webview}
          startInLoadingState
        />
      ) : (
        <Text style={styles.errorText}>No PDF URL provided.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  webview: {
    flex: 1,
    width: Dimensions.get("window").width,
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
});
