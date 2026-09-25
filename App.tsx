import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  SafeAreaView,
  FlatList,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import UserAssessmentScreen from './src/screens/UserAssessmentScreen';
import AdminScreen from './src/screens/AdminScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from './src/theme/tokens';
import { getAssessmentHistory, PatientAssessmentRecord } from './src/services/HistoryService';
import { Feather } from '@expo/vector-icons';
import { initDatabase } from './src/database/DatabaseService';

type AppZone = 'PATIENT' | 'ADMIN';

// ---------------------------------------------------------------------------
// About Modal — shown when user taps "About SymptaCare"
// ---------------------------------------------------------------------------
function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>About SymptaCare</Text>
        <Text style={modalStyles.sub}>
          SymptaCare is an offline clinical symptom triage tool. It does not replace professional medical advice.
        </Text>

        <View style={modalStyles.featureRow}>
          {[
            { icon: 'shield', bg: '#EFF6FF', color: COLORS.brandNavy, label: '100% Private', desc: 'All data stays on your device' },
            { icon: 'wifi-off', bg: '#F0FDF4', color: COLORS.brandGreen, label: 'Works Offline', desc: 'No internet required' },
            { icon: 'clock', bg: '#FFFBEB', color: COLORS.warning, label: 'Instant Results', desc: 'Under 30 seconds' },
          ].map(f => (
            <View key={f.label} style={modalStyles.featureCard}>
              <View style={[modalStyles.featureIcon, { backgroundColor: f.bg }]}>
                <Feather name={f.icon as any} size={18} color={f.color} />
              </View>
              <Text style={modalStyles.featureLabel}>{f.label}</Text>
              <Text style={modalStyles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={modalStyles.version}>SymptaCare v1.0.0 · © 2026 Group 4</Text>
        <Pressable style={modalStyles.closeBtn} onPress={onClose}>
          <Text style={modalStyles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// History Sheet — shown when user taps "View History" in results
// ---------------------------------------------------------------------------
export function HistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [history, setHistory] = useState<PatientAssessmentRecord[]>([]);

  useEffect(() => {
    if (visible) {
      getAssessmentHistory().then(setHistory).catch(console.error);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={[modalStyles.sheet, { maxHeight: '85%' }]}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>Assessment History</Text>
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          style={{ marginTop: SPACING.md }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: SPACING.xxl }}>
              <Feather name="clock" size={40} color={COLORS.borderLight} />
              <Text style={{ color: COLORS.textMuted, marginTop: SPACING.md }}>No past assessments yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const riskColor = item.triage === 'Red' ? COLORS.triageRedIcon
              : item.triage === 'Amber' ? COLORS.triageAmberIcon
              : COLORS.triageGreenIcon;
            return (
              <View style={historyStyles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                  <Text style={{ fontWeight: '700', color: COLORS.brandNavy }}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontWeight: '700', color: riskColor }}>{item.triage} Risk</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, lineHeight: 20 }} numberOfLines={2}>{item.advice}</Text>
              </View>
            );
          }}
        />
        <Pressable style={modalStyles.closeBtn} onPress={onClose}>
          <Text style={modalStyles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Patient Zone — no tabs, just welcome → assessment
// ---------------------------------------------------------------------------
function PatientZone({ onSwitchToAdmin }: { onSwitchToAdmin: () => void }) {
  const [isAssessing, setIsAssessing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <View style={styles.zoneContainer}>
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

      {isAssessing ? (
        <UserAssessmentScreen onSwitchToWelcome={() => setIsAssessing(false)} />
      ) : (
        <WelcomeScreen
          onSelectMode={(mode) => {
            if (mode === 'USER') setIsAssessing(true);
            if (mode === 'ADMIN') onSwitchToAdmin();
          }}
          onAboutPress={() => setShowAbout(true)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function App() {
  const [zone, setZone] = useState<AppZone>('PATIENT');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setIsReady(true));
  }, []);

  if (!isReady) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brandNavy} />
      {zone === 'PATIENT' ? (
        <PatientZone onSwitchToAdmin={() => setZone('ADMIN')} />
      ) : (
        <AdminScreen onSwitchToWelcome={() => setZone('PATIENT')} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.brandNavy },
  zoneContainer: { flex: 1 },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.brandNavy,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  version: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  closeBtn: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  closeBtnText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  warning: {
    color: COLORS.warning,
  },
});

const historyStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgPrimary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
