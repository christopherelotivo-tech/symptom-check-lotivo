import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PinService } from '../services/PinService';
import { RuleStorageService } from '../services/RuleStorageService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import PrimaryButton from './ui/PrimaryButton';
import { Pressable } from 'react-native';

interface AdminSettingsProps {
  onImportSuccess?: () => void;
}

type SettingsView = 'MENU' | 'SECURITY' | 'SYNC';

export default function AdminSettings({ onImportSuccess }: AdminSettingsProps) {
  const [activeView, setActiveView] = useState<SettingsView>('MENU');
  
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
      setActiveView('MENU'); // go back after success
    } else {
      Alert.alert('Error', 'Failed to save new PIN.');
    }
  };

  const handleExport = async () => {
    try {
      await RuleStorageService.exportRules();
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export rules to filesystem.');
    }
  };

  const handleImport = async () => {
    try {
      const summary = await RuleStorageService.importRules();
      if (!summary) return; // User cancelled

      let msg = `Successfully imported ${summary.successCount} rules.`;
      if (summary.failedRules.length > 0) {
        msg += `\n\nFailed to import ${summary.failedRules.length} rules due to validation errors.`;
        console.warn('Import failures:', summary.failedRules);
      }

      Alert.alert('Import Complete', msg);
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      Alert.alert('Import Failed', 'Unable to import rules from the selected file.');
    }
  };

  if (activeView === 'MENU') {
    return (
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your system configuration.</Text>

        <Pressable 
          style={({pressed}) => [styles.menuCard, pressed && styles.menuCardPressed]} 
          onPress={() => setActiveView('SECURITY')}
        >
          <View style={styles.menuIconBox}>
            <Feather name="lock" size={28} color={COLORS.brandNavy} />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Security & PIN</Text>
            <Text style={styles.menuDesc}>Change the master PIN required to access the admin portal.</Text>
          </View>
          <Feather name="chevron-right" size={24} color={COLORS.brandNavy} />
        </Pressable>

        <Pressable 
          style={({pressed}) => [styles.menuCard, pressed && styles.menuCardPressed]} 
          onPress={() => setActiveView('SYNC')}
        >
          <View style={styles.menuIconBox}>
            <Feather name="database" size={28} color={COLORS.brandNavy} />
          </View>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Knowledge Base Sync</Text>
            <Text style={styles.menuDesc}>Backup protocols or import new guidelines via secure JSON files.</Text>
          </View>
          <Feather name="chevron-right" size={24} color={COLORS.brandNavy} />
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl}}>
          <Pressable onPress={() => setActiveView('MENU')} style={{flexDirection: 'row', alignItems: 'center'}}>
             <Feather name="arrow-left" size={24} color={COLORS.brandNavy} />
             <Text style={{marginLeft: SPACING.sm, fontSize: 16, fontWeight: '600', color: COLORS.brandNavy}}>Back to Settings</Text>
          </Pressable>
        </View>

        {activeView === 'SECURITY' && (
          <View style={styles.card}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md}}>
              <Feather name="lock" size={24} color={COLORS.brandNavy} style={{marginRight: SPACING.sm}} />
              <Text style={[styles.cardTitle, {marginBottom: 0}]}>Security Settings</Text>
            </View>
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
              iconName="check"
            />
          </View>
        )}

        {activeView === 'SYNC' && (
          <View style={styles.card}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md}}>
              <Feather name="database" size={24} color={COLORS.brandNavy} style={{marginRight: SPACING.sm}} />
              <Text style={[styles.cardTitle, {marginBottom: 0}]}>Knowledge Sync</Text>
            </View>
            <Text style={styles.cardSubtitle}>Backup and restore your health protocols and guidelines.</Text>
            
            <View style={{ marginBottom: SPACING.xl, marginTop: SPACING.md }}>
              <Feather name="download" size={24} color={COLORS.brandNavy} style={{marginBottom: SPACING.sm}} />
              <Text style={[styles.cardTitle, { fontSize: 16 }]}>Export Knowledge Base</Text>
              <Text style={styles.cardSubtitle}>Save all active guidelines to a secure file on your device for backup.</Text>
              <PrimaryButton label="Export to File" onPress={handleExport} />
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.xl }}>
              <Feather name="upload" size={24} color={COLORS.brandNavy} style={{marginBottom: SPACING.sm}} />
              <Text style={[styles.cardTitle, { fontSize: 16 }]}>Import Knowledge Base</Text>
              <Text style={styles.cardSubtitle}>Load new guidelines from a verified JSON file. This will add new rules and update existing ones.</Text>
              <PrimaryButton label="Import from File" onPress={handleImport} />
            </View>
          </View>
        )}
      </ScrollView>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.brandNavy,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  menuCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  menuCardPressed: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(26, 58, 108, 0.1)',
    transform: [{ scale: 0.98 }],
  },
  menuIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  menuTextContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandNavy,
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
