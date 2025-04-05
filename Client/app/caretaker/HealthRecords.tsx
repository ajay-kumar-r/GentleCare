import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Text, useTheme, Card, FAB, Button, Snackbar } from "react-native-paper";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = (screenWidth - 60) / 2;

export default function HealthRecords() {
  const { colors } = useTheme();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [deletedRecord, setDeletedRecord] = useState<any>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [records, setRecords] = useState<{
    [date: string]: {
      id: string;
      title: string;
      image: any;
      uri?: string;
    }[];
  }>({
    "March 25, 2025": [
      { id: "1", title: "Blood Test", image: require("../../assets/images/report.png") },
      { id: "2", title: "Liver Function", image: require("../../assets/images/report.png") },
    ],
    "April 05, 2025": [
      { id: "3", title: "ECG", image: require("../../assets/images/report.png") },
      { id: "4", title: "Heart Health", image: require("../../assets/images/report.png") },
    ],
    "April 10, 2025": [
      { id: "5", title: "X-Ray", image: require("../../assets/images/report.png") },
      { id: "6", title: "Bone Health", image: require("../../assets/images/report.png") },
      { id: "7", title: "MRI Scan", image: require("../../assets/images/report.png") },
    ],
  });

  const handleAddRecord = async () => {
    try {
      const pickedDoc = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!pickedDoc.canceled && pickedDoc.assets.length > 0) {
        setPdfFile(pickedDoc.assets[0]);
      }
    } catch (err) {
      console.log("Error picking document:", err);
    }
  };

  const handleDateConfirm = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const saveRecord = () => {
    if (!pdfFile) return;

    const dateKey = selectedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const newReport = {
      id: Math.random().toString(),
      title: pdfFile.name || "New Report",
      image: require("../../assets/images/report.png"),
      uri: pdfFile.uri,
    };

    setRecords((prev) => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey] ? [...updated[dateKey], newReport] : [newReport];
      return updated;
    });

    setModalVisible(false);
    setPdfFile(null);
    setSelectedDate(new Date());
  };

  const handleLongPress = (date: string, reportId: string) => {
    Alert.alert("Delete Report", "Are you sure you want to delete this report?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const reportToDelete = records[date].find((r) => r.id === reportId);
          setRecords((prev) => {
            const updated = { ...prev };
            updated[date] = updated[date].filter((r) => r.id !== reportId);
            if (updated[date].length === 0) delete updated[date];
            return updated;
          });
          setDeletedRecord({ date, report: reportToDelete });
          setSnackbarVisible(true);
        },
      },
    ]);
  };

  const undoDelete = () => {
    if (!deletedRecord) return;
    const { date, report } = deletedRecord;
    setRecords((prev) => {
      const updated = { ...prev };
      updated[date] = updated[date] ? [...updated[date], report] : [report];
      return updated;
    });
    setDeletedRecord(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <Text style={[styles.header, { color: colors.primary }]}>Health Records</Text>

        {Object.keys(records).map((date) => (
          <View key={date} style={styles.section}>
            <Text style={styles.dateLabel}>{date}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.cardRow}
            >
              {records[date].map((report) => (
                <TouchableWithoutFeedback
                  key={report.id}
                  onPress={() => {
                    if (report.uri) {
                      router.push({
                        pathname: "/caretaker/PDFViewer",
                        params: { uri: report.uri, title: report.title },
                      });
                    } else {
                      alert("No PDF available for this record.");
                    }
                  }}
                  onLongPress={() => handleLongPress(date, report.id)}
                >
                  <Card style={[styles.card, { backgroundColor: "white" }]}>
                    <Image source={report.image} style={styles.image} />
                    <Card.Content>
                      <Text style={styles.title}>{report.title}</Text>
                    </Card.Content>
                  </Card>
                </TouchableWithoutFeedback>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Health Report</Text>
            <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={{ marginBottom: 10 }}>
              Select Date
            </Button>
            <Text style={{ textAlign: "center" }}>Selected Date: {selectedDate.toDateString()}</Text>
            <Button mode="contained" onPress={handleAddRecord} style={{ marginTop: 20 }}>
              Upload PDF
            </Button>
            <Button mode="contained" onPress={saveRecord} disabled={!pdfFile} style={{ marginTop: 10 }}>
              Save
            </Button>
            <Button onPress={() => { setModalVisible(false); setPdfFile(null); }} style={{ marginTop: 10 }}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateConfirm}
        />
      )}

      <FAB
        icon="plus"
        style={[
          styles.fab,
          snackbarVisible && { bottom: 90 },
        ]}
        onPress={() => setModalVisible(true)}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        action={{
          label: "Undo",
          onPress: undoDelete,
        }}
        style={{ marginBottom: 30, elevation: 6, backgroundColor: "white" }}
      >
        File deleted
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
  },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginVertical: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    paddingLeft: 15,
  },
  dateLabel: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 10,
  },
  cardRow: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    marginRight: 15,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    marginTop: 5,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#007bff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginBottom: 15,
    textAlign: "center",
  },
});
