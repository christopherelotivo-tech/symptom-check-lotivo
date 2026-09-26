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
      setActiveView('MENU');
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
      if (!summary) return;

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

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (activeView === 'MENU') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your system configuration.</Text>

        <Pressable
          style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
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
          style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
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

  // ── SECURITY or SYNC sub-views ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Back Button ── */}
        <Pressable
          onPress={() => setActiveView('MENU')}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <Feather name="arrow-left" size={20} color={COLORS.brandNavy} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </Pressable>

        {/* ── SECURITY ── */}
        {activeView === 'SECURITY' && (
          <View>
            {/* Header */}
            <View style={styles.subHeader}>
              <View style={styles.subIconBox}>
                <Feather name="lock" size={26} color={COLORS.brandNavy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subTitle}>Security Settings</Text>
                <Text style={styles.subDesc}>Change the master PIN required to access the clinical logic.</Text>
              </View>
            </View>

            {/* Fields — no wrapping card */}
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

            <PrimaryButton label="Change PIN" onPress={handleChangePin} iconName="check" />
          </View>
        )}

        {/* ── SYNC ── */}
        {activeView === 'SYNC' && (
          <View>
            {/* Header */}
            <View style={styles.subHeader}>
              <View style={styles.subIconBox}>
                <Feather name="database" size={26} color={COLORS.brandNavy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subTitle}>Knowledge Sync</Text>
                <Text style={styles.subDesc}>Backup and restore your health protocols and guidelines.</Text>
              </View>
            </View>

            {/* Export — no wrapping card */}
            <View style={styles.syncSection}>
              <View style={styles.syncSectionHeader}>
                <Feather name="download" size={22} color={COLORS.brandNavy} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.syncSectionTitle}>Export Knowledge Base</Text>
              </View>
              <Text style={styles.syncSectionDesc}>Save all active guidelines to a secure file on your device for backup.</Text>
              <PrimaryButton label="Export to File" onPress={handleExport} />
            </View>

            <View style={styles.divider} />

            {/* Import — no wrapping card */}
            <View style={styles.syncSection}>
              <View style={styles.syncSectionHeader}>
                <Feather name="upload" size={22} color={COLORS.brandNavy} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.syncSectionTitle}>Import Knowledge Base</Text>
              </View>
              <Text style={styles.syncSectionDesc}>Load new guidelines from a verified JSON file. This will add new rules and update existing ones.</Text>
              <PrimaryButton label="Import from File" onPress={handleImport} />
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  // ── Back Button ────────────────────────────────────────────────────────────
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  backBtnPressed: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.brandGreen,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brandNavy,
  },
  // ── Menu ──────────────────────────────────────────────────────────────────
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
  // ── Sub-view header ────────────────────────────────────────────────────────
  subHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  subIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.brandNavy,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // ── Form fields ────────────────────────────────────────────────────────────
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight.semibold,
    letterSpacing: 4,
  },
  // ── Sync sections ──────────────────────────────────────────────────────────
  syncSection: {
    marginBottom: SPACING.lg,
  },
  syncSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  syncSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandNavy,
  },
  syncSectionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xl,
  },
});
