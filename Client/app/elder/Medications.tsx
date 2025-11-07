import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Text,
  Button,
  useTheme,
} from "react-native-paper";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import CustomSnackbar from "../components/CustomSnackbar";
import { medicationAPI } from "../../services/api";

export default function Medications() {
  const { colors } = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load medications from backend
  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const response = await medicationAPI.getAll();
      setMedications(response.medications || []);
    } catch (error: any) {
      console.error('Error loading medications:', error);
      showSnackbar(error.message || 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleMarkAsTaken = async (medId: number) => {
    try {
      await medicationAPI.logTaken(medId, 'taken');
      // Update local state
      setMedications(medications.map((med: any) =>
        med.id === medId ? { ...med, last_taken: new Date().toISOString() } : med
      ));
      showSnackbar("✅ Medication logged - Caretaker notified!");
    } catch (error: any) {
      console.error('Error logging medication:', error);
      showSnackbar(error.message || 'Failed to log medication');
    }
  };

  const handleMarkAsSkipped = async (medId: number) => {
    try {
      await medicationAPI.logTaken(medId, 'skipped');
      setMedications(medications.map((med: any) =>
        med.id === medId ? { ...med, status: "skipped" } : med
      ));
      showSnackbar("Medication marked as skipped");
    } catch (error: any) {
      console.error('Error skipping medication:', error);
      showSnackbar(error.message || 'Failed to skip medication');
    }
  };

  // Filter medications for today
  const medsForSelectedDate = medications.filter((med: any) => {
    // Show all active medications
    return med.is_active;
  });

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.header}>💊 Medications</Text>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {medsForSelectedDate.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>💊</Text>
            <Text style={styles.noMedsText}>No medications assigned yet.</Text>
            <Text style={styles.noMedsSubtext}>Your caretaker will add medications for you.</Text>
          </View>
        ) : (
          medsForSelectedDate.map((med: any) => {
            const wasTakenToday = med.status === 'taken' && med.last_taken && 
              new Date(med.last_taken).toDateString() === new Date().toDateString();
            const wasSkippedToday = med.status === 'skipped';
            const isDoneToday = wasTakenToday || wasSkippedToday;
            
            return (
              <CustomCard key={med.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={styles.medNameRow}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>{med.dosage}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      wasTakenToday ? styles.takenBadge :
                      wasSkippedToday ? styles.skippedBadge :
                      styles.pendingBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {wasTakenToday ? `✓ ${new Date(med.last_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                         wasSkippedToday ? 'Skipped' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.medInfo}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>⏰</Text>
                      <Text style={styles.infoText}>{med.time}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>🔄</Text>
                      <Text style={styles.infoText}>{med.frequency}</Text>
                    </View>
                  </View>

                  {med.instructions && (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsLabel}>📝 Instructions:</Text>
                      <Text style={styles.instructionsText}>{med.instructions}</Text>
                    </View>
                  )}

                  {!isDoneToday && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="contained"
                        onPress={() => handleMarkAsTaken(med.id)}
                        style={styles.takenButton}
                        labelStyle={styles.takenButtonLabel}
                        icon="check"
                      >
                        Mark Taken
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleMarkAsSkipped(med.id)}
                        style={styles.skipButton}
                        labelStyle={styles.skipButtonLabel}
                        icon="skip-next"
                      >
                        Skip
                      </Button>
                    </View>
                  )}
                </View>
              </CustomCard>
            );
          })
        )}
      </ScrollView>

      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 60, // Increased to avoid notch
    backgroundColor: "#F5F5F5" 
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 80,
    marginBottom: 16,
  },
  noMedsText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    color: "#333",
  },
  noMedsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medNameRow: {
    flex: 1,
    marginRight: 12,
  },
  medName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  medInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  instructionsBox: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  takenBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  skippedBadge: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  pendingBadge: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  takenButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  takenButtonLabel: {
    color: '#FFF',
  },
  skipButton: {
    flex: 1,
    borderColor: '#FF9800',
  },
  skipButtonLabel: {
    color: '#FF9800',
  },
  snackbar: {
    backgroundColor: "#323232",
  },
});
