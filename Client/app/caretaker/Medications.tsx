import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import {
  Text,
  Button,
  FAB,
  TextInput,
  useTheme,
} from "react-native-paper";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import CustomSnackbar from "../components/CustomSnackbar";
import { medicationAPI } from "../../services/api";
// import { socketService } from "../../services/socket"; // TODO: Implement socket service

interface Medication {
  id: number;
  elder_id: number;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  instructions?: string;
  last_taken?: string;
  status: 'pending' | 'taken' | 'skipped';
  elder_name?: string;
  is_active: boolean;
}

export default function CaretakerMedications() {
  const { colors } = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily',
    instructions: '',
  });

  useEffect(() => {
    loadMedications();

    // TODO: Implement real-time updates when socket service is available
    // socketService.on('medication_logged', (data: any) => {
    //   showSnackbar(`✅ ${data.elder_name || 'Elder'} took ${data.medication_name}`);
    //   loadMedications();
    // });

    // return () => {
    //   socketService.off('medication_logged');
    // };
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const response = await medicationAPI.getAll();
      console.log('Medications API response:', response);
      console.log('Medications array:', response.medications);
      console.log('Number of medications:', response.medications?.length || 0);
      setMedications(response.medications || []);
    } catch (error: any) {
      console.error('Error loading medications:', error);
      showSnackbar(error.message || 'Failed to load medications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
  };

  const handleAddMedication = async () => {
    if (!formData.name || !formData.dosage || !formData.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await medicationAPI.add({
        elder_id: 1,
        name: formData.name,
        dosage: formData.dosage,
        time: formData.time,
        frequency: formData.frequency,
        instructions: formData.instructions,
      });

      showSnackbar('✅ Medication added successfully');
      setAddModalVisible(false);
      resetForm();
      loadMedications();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add medication');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      time: '',
      frequency: 'daily',
      instructions: '',
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const handleEditMedication = (med: Medication) => {
    setSelectedMedication(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      frequency: med.frequency,
      instructions: med.instructions || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateMedication = async () => {
    if (!selectedMedication || !formData.name || !formData.dosage || !formData.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await medicationAPI.update(selectedMedication.id, {
        name: formData.name,
        dosage: formData.dosage,
        time: formData.time,
        frequency: formData.frequency,
        instructions: formData.instructions,
      });

      showSnackbar('✅ Medication updated successfully');
      setEditModalVisible(false);
      setSelectedMedication(null);
      resetForm();
      loadMedications();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update medication');
    }
  };

  const handleDeleteMedication = (medId: number, medName: string) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete "${medName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationAPI.delete(medId);
              showSnackbar('✅ Medication deleted successfully');
              loadMedications();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const getStatusDisplay = (med: Medication) => {
    if (med.status === 'skipped') {
      return 'Skipped';
    }
    if (med.last_taken) {
      const takenDate = new Date(med.last_taken);
      const today = new Date();
      const isToday =
        takenDate.getDate() === today.getDate() &&
        takenDate.getMonth() === today.getMonth() &&
        takenDate.getFullYear() === today.getFullYear();

      if (isToday) {
        return `Taken at ${takenDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }
      return `Last: ${takenDate.toLocaleDateString()}`;
    }
    return 'Pending';
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
        {medications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>💊</Text>
            <Text style={styles.noMedsText}>
              No medications added yet
            </Text>
            <Text style={styles.noMedsSubtext}>
              Tap the + button to add a medication for your elder
            </Text>
          </View>
        ) : (
          medications.map((med) => (
            <CustomCard key={med.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.medNameRow}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    med.status === 'taken' ? styles.takenBadge :
                    med.status === 'skipped' ? styles.skippedBadge :
                    styles.pendingBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusDisplay(med)}
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

                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => handleEditMedication(med)}
                    style={styles.editButton}
                    labelStyle={styles.editButtonLabel}
                    icon="pencil"
                  >
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => handleDeleteMedication(med.id, med.name)}
                    style={styles.deleteButton}
                    labelStyle={styles.deleteButtonLabel}
                    icon="delete"
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </CustomCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Medication</Text>

            <ScrollView>
              <TextInput
                label="Medication Name *"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Dosage *"
                value={formData.dosage}
                onChangeText={(text) =>
                  setFormData({ ...formData, dosage: text })
                }
                placeholder="e.g., 10mg"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Time *"
                value={formData.time}
                onChangeText={(text) =>
                  setFormData({ ...formData, time: text })
                }
                placeholder="e.g., 10:00 AM"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Frequency"
                value={formData.frequency}
                onChangeText={(text) =>
                  setFormData({ ...formData, frequency: text })
                }
                placeholder="e.g., daily, twice a day"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Instructions (optional)"
                value={formData.instructions}
                onChangeText={(text) =>
                  setFormData({ ...formData, instructions: text })
                }
                placeholder="e.g., Take with food"
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setAddModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddMedication}
                  style={styles.modalButton}
                >
                  Add Medication
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Medication Modal */}
      <Modal
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Medication</Text>

            <ScrollView>
              <TextInput
                label="Medication Name *"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Dosage *"
                value={formData.dosage}
                onChangeText={(text) =>
                  setFormData({ ...formData, dosage: text })
                }
                placeholder="e.g., 10mg"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Time *"
                value={formData.time}
                onChangeText={(text) =>
                  setFormData({ ...formData, time: text })
                }
                placeholder="e.g., 10:00 AM"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Frequency"
                value={formData.frequency}
                onChangeText={(text) =>
                  setFormData({ ...formData, frequency: text })
                }
                placeholder="e.g., daily, twice a day"
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Instructions (optional)"
                value={formData.instructions}
                onChangeText={(text) =>
                  setFormData({ ...formData, instructions: text })
                }
                placeholder="e.g., Take with food"
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditModalVisible(false);
                    setSelectedMedication(null);
                    resetForm();
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdateMedication}
                  style={styles.modalButton}
                >
                  Update
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
      />

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
    paddingTop: 10,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderColor: '#1976D2',
  },
  editButtonLabel: {
    color: '#1976D2',
  },
  deleteButton: {
    flex: 1,
  },
  deleteButtonLabel: {
    color: '#D32F2F',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  noMedsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1976D2',
  },
  snackbar: {
    backgroundColor: '#323232',
  },
});
