import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Text } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import AudioRecorderPlayer from "react-native-audio-recorder-player";

export default function ChatbotVoice() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [showStopButton, setShowStopButton] = useState(false);
  const [waveformWidth] = useState(new Animated.Value(0));
  const [waveforms, setWaveforms] = useState(
    Array(5).fill(new Animated.Value(1))
  );
  const [chatbotResponse, setChatbotResponse] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const audioRecorderPlayer = new AudioRecorderPlayer();

  const handleMicPress = async () => {
    setIsListening(true);
    setShowStopButton(true);
    setChatbotResponse(""); 

    try {
      await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        const volumeLevel = e.currentPosition / 1000; 
        updateWaveforms(volumeLevel); 
      });
    } catch (error) {
      console.error("Error starting the microphone recording", error);
    }
  };

  const handleStopPress = async () => {
    setIsListening(false);
    setShowStopButton(false);

    audioRecorderPlayer.stopRecorder();

    Animated.timing(waveformWidth, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      setIsResponding(true);
      setChatbotResponse("This is the chatbot's response based on your voice input.");
    }, 2000);
  };

  const updateWaveforms = (volumeLevel: number) => {
    setWaveforms((prevWaveforms) =>
      prevWaveforms.map((waveform, index) => {
        const scale = Math.min(1 + volumeLevel * (index + 1), 2);  level
        return Animated.timing(waveform, {
          toValue: scale,
          duration: 100,
          useNativeDriver: false,
        });
      })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {!isListening ? (
          <TouchableOpacity
            style={styles.micContainer}
            onPress={handleMicPress}
          >
            <IconButton
              icon="microphone"
              size={80}
              color={colors.primary}
              style={styles.micIcon}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.waveformContainer}>
            {waveforms.map((waveform, index) => (
              <Animated.View
                key={index}
                style={[styles.waveform, { transform: [{ scaleY: waveform }] }]}
              />
            ))}
          </View>
        )}
      </View>

      {showStopButton && (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopPress}
        >
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      )}

      {isResponding && (
        <View style={styles.responseContainer}>
          <Text style={styles.chatbotResponseText}>{chatbotResponse}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  micContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#007AFF",
    elevation: 5,
  },
  micIcon: {
    backgroundColor: "transparent",
  },
  waveformContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    width: "80%",
  },
  waveform: {
    height: 5,
    backgroundColor: "#007AFF",
    borderRadius: 2,
    width: 30,
    marginHorizontal: 3,
  },
  stopButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  stopButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  responseContainer: {
    position: "absolute",
    bottom: 150,
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  chatbotResponseText: {
    fontSize: 16,
    color: "#333",
  },
});
