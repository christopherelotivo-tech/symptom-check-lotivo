import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PinService } from '../services/PinService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import PrimaryButton from '../components/ui/PrimaryButton';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'USER' | 'ADMIN') => void;
  onAboutPress: () => void;
}

export default function WelcomeScreen({ onSelectMode, onAboutPress }: WelcomeScreenProps) {
  // Step: 'splash' → 'home'
  const [step, setStep] = useState<'splash' | 'home'>('splash');

  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pin, setPin]                 = useState('');
  const [error, setError]             = useState(false);
  const [expectedPin, setExpectedPin] = useState('1234');
  const [isLoadingPin, setIsLoadingPin] = useState(false);

  // Animations
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const homeOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Logo pop-in
    Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    // After 2s, transition to home step
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(homeOpacity,   { toValue: 1, duration: 600, useNativeDriver: true, delay: 300 }),
      ]).start(() => setStep('home'));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // ── PIN auth logic ────────────────────────────────────────────────────────
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

  // ── PIN Entry Screen ──────────────────────────────────────────────────────
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

  // ── Splash Step ──────────────────────────────────────────────────────────
  if (step === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.brandNavy} />
        <Animated.View style={[styles.splashContent, { opacity: splashOpacity }]}>
          <Animated.Image
            source={require('../../assets/icons/logo.jpg')}
            style={[styles.splashLogo, { transform: [{ scale: logoScale }] }]}
            accessibilityLabel="SymptaCare logo"
          />
          <Text style={styles.splashTitle}>SymptaCare</Text>
          <Text style={styles.splashTagline}>Your personal health guide</Text>
        </Animated.View>
      </View>
    );
  }

  // ── Home Step ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brandNavy} />

      {/* Navy hero */}
      <View style={styles.heroBand}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Animated.View style={[styles.heroContent, { opacity: homeOpacity }]}>
          <Image
            source={require('../../assets/icons/logo.jpg')}
            style={styles.logoImage as any}
            accessibilityLabel="SymptaCare logo"
          />
          <Text style={styles.heroTitle}>SymptaCare</Text>
        </Animated.View>
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { opacity: homeOpacity }]}>
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
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

        <View style={{ flex: 1, minHeight: SPACING.xxxl }} />

        {/* Bottom row: About link | Admin link */}
        <View style={styles.bottomRow}>
          <Pressable onPress={onAboutPress} style={styles.bottomLink}>
            <Feather name="info" size={13} color={COLORS.textMuted} />
            <Text style={styles.bottomLinkText}>  About SymptaCare</Text>
          </Pressable>

          <View style={styles.dotSep} />

          <Pressable onPress={isLoadingPin ? undefined : handleAdminPress} style={styles.bottomLink}>
            {isLoadingPin ? (
              <ActivityIndicator size="small" color={COLORS.brandBlue} />
            ) : (
              <>
                <Feather name="settings" size={13} color={COLORS.textMuted} />
                <Text style={styles.bottomLinkText}>  Clinical Admin</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.footerCopyright}>© 2026 SymptaCare · Group 4</Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Splash ────────────────────────────────────────────────────────────────
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  } as const,
  splashTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  splashTagline: {
    fontSize: TYPOGRAPHY.size.base,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // ── Main Screen ───────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.brandNavy,
  },
  heroBand: {
    backgroundColor: COLORS.brandNavy,
    paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.md,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56,189,248,0.08)',
    top: -60,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(56,189,248,0.06)',
    bottom: -30,
    left: -20,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  } as const,
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
  },
  sheetContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
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

  // ── Bottom Links ──────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    gap: SPACING.md,
  },
  bottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bottomLinkText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dotSep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
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
});
