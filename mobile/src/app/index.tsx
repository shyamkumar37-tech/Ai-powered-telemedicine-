import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';

export default function AppDashboard() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [syncedDevices, setSyncedDevices] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TeleCare+ Mobile</Text>
        <Text style={styles.headerSubtitle}>Welcome back, Patient</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Appointments</Text>
          <Text style={styles.cardValue}>1 Scheduled</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medication Adherence</Text>
          <Text style={styles.cardValue}>85%</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Voice Scribe</Text>
        <TouchableOpacity 
          style={[styles.button, isTranscribing && styles.buttonActive]}
          onPress={() => setIsTranscribing(!isTranscribing)}
        >
          <Text style={styles.buttonText}>
            {isTranscribing ? "Transcribing... (Tap to stop)" : "Start Voice Consultation"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bluetooth Vitals Sync</Text>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setSyncedDevices(true)}
        >
          <Text style={styles.buttonText}>
            {syncedDevices ? "Devices Synced (BP Monitor, SpO2)" : "Sync Nearby Wearables"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4FB3A0',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#ef4444',
  },
  buttonSecondary: {
    backgroundColor: '#4FB3A0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
