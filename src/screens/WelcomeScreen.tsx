import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PinService } from '../services/PinService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import PrimaryButton from '../components/ui/PrimaryButton';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'USER' | 'ADMIN') => void;
}

export default function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  const [showPinAuth, setShowPinAuth]     = useState(false);
  const [pin, setPin]                     = useState('');
  const [error, setError]                 = useState(false);
  const [expectedPin, setExpectedPin]     = useState('1234');
  const [isLoadingPin, setIsLoadingPin]   = useState(false);

  // ── PIN auth logic (unchanged) ────────────────────────────────────────────
  const handleAdminPress = async () => {
    setIsLoadingPin(true);
    const savedPin = await PinService.getPin();
    setExpectedPin(savedPin);
    setIsLoadingPin(false);
    setShowPinAuth(true);
  };

  const handlePinChange = (text: string) => {
    setPin(text);
    setError(false);
    if (text.length === 4) {
      if (text === expectedPin) {
        onSelectMode('ADMIN');
      } else {
        setError(true);
        setPin('');
      }
    }
  };

  // ── PIN Entry Screen ───────────────────────────────────────────────────────
  if (showPinAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgPrimary} />
        <View style={styles.pinOuter}>
          <View style={styles.pinCard}>
            <View style={styles.pinIconWrap}>
              <Feather name="shield" size={28} color={COLORS.brandNavy} />
            </View>
            <Text style={styles.pinTitle}>Clinical Admin</Text>
            <Text style={styles.pinSubtitle}>Enter your 4-digit PIN to continue</Text>

            <TextInput
              style={[styles.pinInput, error && styles.pinInputError]}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              accessibilityLabel="Enter PIN"
            />

            {error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>  Incorrect PIN. Please try again.</Text>
              </View>
            )}

            <Pressable
              style={styles.cancelButton}
              onPress={() => { setShowPinAuth(false); setPin(''); setError(false); }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Welcome Screen ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brandNavy} />

      {/* ── TOP HERO BAND (Navy) ── */}
      <View style={styles.heroBand}>
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.heroContent}>
          <Image
            source={require('../../assets/icons/logo.jpg')}
            style={styles.logoImage}
            accessibilityLabel="ArayKo! logo"
          />
          <Text style={styles.heroTitle}>ArayKo!</Text>
          <Text style={styles.heroTagline}>Your personal health guide</Text>
        </View>
      </View>

      {/* ── BOTTOM CONTENT SHEET ── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Feature cards */}
        <View style={styles.featureRow}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="shield" size={20} color={COLORS.brandNavy} />
            </View>
            <Text style={styles.featureLabel}>100% Private</Text>
            <Text style={styles.featureDesc}>All data stays on your device</Text>
          </View>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
              <Feather name="wifi-off" size={20} color={COLORS.brandGreen} />
            </View>
            <Text style={styles.featureLabel}>Works Offline</Text>
            <Text style={styles.featureDesc}>No internet required</Text>
          </View>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FFFBEB' }]}>
              <Feather name="clock" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.featureLabel}>Instant Results</Text>
            <Text style={styles.featureDesc}>Under 30 seconds</Text>
          </View>
        </View>

        <Text style={styles.sheetHeading}>How are you feeling today?</Text>
        <Text style={styles.sheetSubtext}>
          Tell us your symptoms and we'll help you understand what to do next.
        </Text>

        <PrimaryButton
          label="Start Symptom Assessment"
          onPress={() => onSelectMode('USER')}
          iconName="activity"
          style={{ width: '100%', marginTop: SPACING.xl }}
        />

        <View style={styles.disclaimerRow}>
          <Feather name="info" size={12} color={COLORS.textMuted} />
          <Text style={styles.disclaimerText}>
            {' '}Not a replacement for professional medical advice.
          </Text>
        </View>

        <View style={styles.adminRow}>
          <View style={styles.dividerLine} />
          <Pressable
            onPress={isLoadingPin ? undefined : handleAdminPress}
            style={styles.adminLink}
          >
            {isLoadingPin ? (
              <ActivityIndicator size="small" color={COLORS.brandBlue} />
            ) : (
              <>
                <Feather name="settings" size={13} color={COLORS.textMuted} />
                <Text style={styles.adminLinkText}>  Clinical Admin</Text>
              </>
            )}
          </Pressable>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.footerCopyright}>© 2026 ArayKo! · Group 4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brandNavy,
  },

  // ── Hero Band ──────────────────────────────────────────────────────────────
  heroBand: {
    backgroundColor: COLORS.brandNavy,
    paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    bottom: -40,
    left: -30,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  } as const,
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  heroTagline: {
    fontSize: TYPOGRAPHY.size.base,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },

  // ── Bottom Sheet ───────────────────────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  sheetContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },

  // ── Feature Cards ─────────────────────────────────────────────────────────
  featureRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
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

  // ── Sheet Text ─────────────────────────────────────────────────────────────
  sheetHeading: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.brandNavy,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sheetSubtext: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xxxl,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSurface,
  },
  adminLinkText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footerCopyright: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },

  // ── PIN Screen ─────────────────────────────────────────────────────────────
  pinOuter: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  pinCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.md,
  },
  pinIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  pinTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.brandNavy,
    marginBottom: SPACING.xs,
  },
  pinSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  pinInput: {
    width: 200,
    height: 64,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.pill,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: COLORS.borderBrand,
    color: COLORS.brandNavy,
  },
  pinInputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '500',
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
});
