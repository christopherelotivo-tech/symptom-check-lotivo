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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PinService } from '../services/PinService';
import PrivacyBadge from '../components/ui/PrivacyBadge';
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {!showPinAuth ? (
        <View style={styles.inner}>

          {/* ── Logo & Branding ── */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/icons/logo.jpg')}
              style={styles.logoImage}
              accessibilityLabel="ArayKo! logo"
            />
            <Text style={styles.heroTitle}>ArayKo!</Text>
          </View>

          {/* ── Hero Text ── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroHeading}>I can help you learn more about your health.</Text>
            <Text style={styles.heroSubtext}>
              Tell us what you're experiencing and we'll help you understand what to do next.
            </Text>
          </View>

          {/* ── Primary CTA ── */}
          <PrimaryButton
            label="Start Symptom Assessment"
            onPress={() => onSelectMode('USER')}
            iconName="activity"
            style={{ width: '100%', maxWidth: 340 }}
          />

          {/* ── Privacy Badge ── */}
          <View style={styles.privacyRow}>
            <PrivacyBadge />
          </View>

          {/* ── Admin Entry (secondary, non-competing) ── */}
          <View style={styles.adminSection}>
            <Text style={styles.adminLabel}>PIN-protected administrative interface</Text>
            <Pressable
              style={(state: any) => [
                styles.adminLink,
                state.pressed && styles.adminLinkPressed,
              ]}
              onPress={isLoadingPin ? undefined : handleAdminPress}
              accessibilityRole="button"
              accessibilityLabel="Clinical Admin"
            >
              {isLoadingPin ? (
                <ActivityIndicator size="small" color={COLORS.brandBlue} />
              ) : (
                <Text style={styles.adminLinkText}>Clinical Admin  →</Text>
              )}
            </Pressable>
          </View>

        </View>
      ) : (

        /* ── PIN Entry (functionally unchanged) ── */
        <View style={styles.inner}>
          <View style={styles.pinContainer}>
            <Feather name="shield" size={32} color={COLORS.brandBlue} style={{ marginBottom: SPACING.base }} />
            <Text style={styles.pinTitle}>Administrative Access</Text>
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

            {error && <Text style={styles.errorText}>Incorrect PIN. Please try again.</Text>}

            <Pressable
              style={styles.cancelButton}
              onPress={() => { setShowPinAuth(false); setPin(''); setError(false); }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Footer ── */}
      <Text style={styles.footerCopyright}>© 2026 Group 4</Text>

    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // ── Logo ─────────────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.size.hero,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -1,
  },

  // ── Hero Text ─────────────────────────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },
  heroHeading: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  heroSubtext: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Primary CTA ───────────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandGreen,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xxl,
    width: '100%',
    maxWidth: 340,
    minHeight: 56,
    ...SHADOW.md,
  },
  primaryBtnPressed: {
    backgroundColor: COLORS.brandGreenDark,
    transform: [{ scale: 0.97 }],
  },
  btnIcon: {
    marginRight: SPACING.sm,
  },
  primaryBtnText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textOnGreen,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },

  // ── Privacy Badge ─────────────────────────────────────────────────────────
  privacyRow: {
    marginTop: SPACING.base,
    marginBottom: SPACING.xxl,
  },

  // ── Admin Entry ───────────────────────────────────────────────────────────
  adminSection: {
    alignItems: 'center',
  },
  adminLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  adminLink: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
  },
  adminLinkPressed: {
    backgroundColor: COLORS.bgOverlay,
  },
  adminLinkText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.brandBlue,
  },

  pinContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  pinTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
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
    fontWeight: TYPOGRAPHY.weight.bold,
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    color: COLORS.textPrimary,
  },
  pinInputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginTop: SPACING.md,
    textAlign: 'center',
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
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerCopyright: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingBottom: SPACING.base,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
});
