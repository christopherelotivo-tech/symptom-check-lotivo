import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { PinService } from '../services/PinService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import PrimaryButton from './ui/PrimaryButton';

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
            accessibilityLabel="Current PIN"
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
            accessibilityLabel="New PIN"
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
            accessibilityLabel="Confirm New PIN"
          />
        </View>

        <PrimaryButton
          label="Change PIN"
          onPress={handleChangePin}
          iconName="lock"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginBottom: SPACING.xxl,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandNavy,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight.semibold,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: COLORS.brandGreen,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOW.md,
  },
  buttonPressed: {
    backgroundColor: COLORS.brandGreenDark,
  },
  buttonText: {
    color: COLORS.textOnGreen,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    letterSpacing: 0.5,
  },
});
