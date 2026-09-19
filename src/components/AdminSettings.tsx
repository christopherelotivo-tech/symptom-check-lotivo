import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { PinService } from '../services/PinService';

export default function AdminSettings() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [actualPin, setActualPin] = useState('');

  useEffect(() => {
    PinService.getPin().then(setActualPin);
  }, []);

  const handleChangePin = async () => {
    if (currentPin !== actualPin) {
      Alert.alert('Error', 'Current PIN is incorrect.');
      return;
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      Alert.alert('Error', 'New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match.');
      return;
    }

    const success = await PinService.setPin(newPin);
    if (success) {
      Alert.alert('Success', 'PIN updated successfully.');
      setActualPin(newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      Alert.alert('Error', 'Failed to save new PIN.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security Settings</Text>
        <Text style={styles.cardSubtitle}>Change the master PIN required to access the clinical logic.</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Current PIN</Text>
          <TextInput
            style={styles.input}
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New PIN (4 digits)</Text>
          <TextInput
            style={styles.input}
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm New PIN</Text>
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>

        <Pressable style={styles.button} onPress={handleChangePin}>
          <Text style={styles.buttonText}>Change PIN</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '600',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

