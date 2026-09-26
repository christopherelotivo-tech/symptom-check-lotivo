import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);
import { PinService } from '../services/PinService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import PrimaryButton from '../components/ui/PrimaryButton';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'USER' | 'ADMIN') => void;
  onAboutPress: () => void;
  onShowHistory?: () => void;
}

export default function WelcomeScreen({ onSelectMode, onAboutPress, onShowHistory }: WelcomeScreenProps) {
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pin, setPin]                 = useState('');
  const [error, setError]             = useState(false);
  const [expectedPin, setExpectedPin] = useState('1234');
  const [isLoadingPin, setIsLoadingPin] = useState(false);

  // Animations
  const bgSpinValue = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoTranslateY = useRef(new Animated.Value(150)).current;
  
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;

  // Button entrance and pulse
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // New features
  const orbsOpacity = useRef(new Animated.Value(0)).current;
  const mintBgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(bgSpinValue, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // 1. Splash Entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1.4, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(taglineY, { toValue: 0, duration: 600, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ]).start();

    // 2. Seamless transition to home content
    let pulseTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      Animated.parallel([
        // Logo moves to final position & scale
        Animated.timing(logoScale, { toValue: 1, duration: 1200, easing: Easing.bezier(0.25, 1, 0.5, 1), useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: 0, duration: 1200, easing: Easing.bezier(0.25, 1, 0.5, 1), useNativeDriver: true }),
        
        // Content fades in and slides up
        Animated.timing(contentOpacity, { toValue: 1, duration: 1000, delay: 500, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 1000, delay: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        
        // Button fades in after content
        Animated.timing(buttonOpacity, { toValue: 1, duration: 1000, delay: 800, useNativeDriver: true }),
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 1000, delay: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        
        // Orbs fade in alongside button
        Animated.timing(orbsOpacity, { toValue: 1, duration: 1500, delay: 700, useNativeDriver: true }),
        
        // Background transitions to mint green over 5 seconds
        Animated.timing(mintBgOpacity, { toValue: 1, duration: 5000, delay: 300, useNativeDriver: true }),
      ]).start(() => {
        pulseTimer = setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(buttonScale, { toValue: 1.03, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(buttonScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
          ).start();
        }, 300);
      });
    }, 2600);

    return () => {
      clearTimeout(timer);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, []);

  const spin = bgSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Galaxy Orbs
  const orb1X = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 100, 0] });
  const orb1Y = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -120, 0] });
  const orb1S = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] });

  const orb2X = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -150, 0] });
  const orb2Y = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 80, 0] });
  const orb2S = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] });

  const orb3X = bgSpinValue.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 60, -60, 0] });
  const orb3Y = bgSpinValue.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 150, 50, 0] });
  const orb3S = bgSpinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.2, 0.8, 1.2] });

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
      <LinearGradient colors={['#F0F7FF', '#E8FAEF']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
      </LinearGradient>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#10B981', '#064E3B']} start={{x: 0, y: 0}} end={{x: 0, y: 1}} style={{ flex: 1 }}>
      
      {/* Galaxy Orbs (Fades in with Content) */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: orbsOpacity }}>
        <Animated.View style={{ position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#3B82F6', opacity: 0.15, top: '10%', alignSelf: 'center', transform: [{ translateX: orb1X }, { translateY: orb1Y }, { scale: orb1S }] }} />
        <Animated.View style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#0EA5E9', opacity: 0.2, top: '40%', right: '-20%', transform: [{ translateX: orb2X }, { translateY: orb2Y }, { scale: orb2S }] }} />
        <Animated.View style={{ position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#8B5CF6', opacity: 0.12, bottom: '-10%', left: '-30%', transform: [{ translateX: orb3X }, { translateY: orb3Y }, { scale: orb3S }] }} />
      </Animated.View>
      
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: SPACING.xl, paddingBottom: SPACING.xxl }}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content Wrapper (Centers everything vertically) */}
          <View style={{ flex: 1, justifyContent: 'space-between', width: '100%', paddingVertical: SPACING.lg }}>
            
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* Logo Block (Animates up and shrinks) */}
              <Animated.View style={{ alignItems: 'center', width: '100%', marginBottom: SPACING.lg, transform: [{ translateY: logoTranslateY }, { scale: logoScale }] }}>
                <BlurView intensity={20} tint="light" style={{ padding: 6, borderRadius: 38, marginBottom: SPACING.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <Image 
                    source={require('../../assets/icons/logo.jpg')}
                    style={{ width: 100, height: 100, borderRadius: 32 }}
                    accessibilityLabel="SymptaCare logo"
                  />
                </BlurView>
                <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
                  SymptaCare
                </Text>
                
                {/* Tagline that shrinks with the logo */}
                <Animated.Text style={{ fontSize: 13.5, fontWeight: '600', paddingHorizontal: 20, textAlign: 'center', color: '#D1FAE5', marginTop: 4, opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
                  Smart Health Assessment, Anytime, Anywhere.
                </Animated.Text>
              </Animated.View>

              {/* Content Block (Fades in and slides up) */}
              <Animated.View style={{ width: '100%', opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], paddingHorizontal: SPACING.sm }}>
                
                <MaskedView
                  maskElement={
                    <Text style={{ fontSize: 36, fontWeight: '900', letterSpacing: -1, textAlign: 'center' }}>
                      Let's evaluate how you are feeling today.
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#A7F3D0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ marginBottom: SPACING.sm }}
                  >
                    <Text style={{ fontSize: 36, fontWeight: '900', letterSpacing: -1, textAlign: 'center', opacity: 0 }}>
                      Let's evaluate how you are feeling today.
                    </Text>
                  </LinearGradient>
                </MaskedView>

                <Text style={{ fontSize: 16, color: '#A7F3D0', fontWeight: '500', lineHeight: 24, marginBottom: SPACING.xl, textAlign: 'center', paddingHorizontal: SPACING.md }}>
                  100% private and offline. We'll analyze your symptoms and guide you safely to the right care.
                </Text>

                {/* Pulsing Button Block */}
                <Animated.View style={{ width: '100%', opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }, { scale: buttonScale }] }}>
                  <PrimaryButton
                    label="Start symptom assessment"
                    onPress={() => onSelectMode('USER')}
                    style={{ width: '100%', marginBottom: SPACING.md }}
                    buttonStyle={{ backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOpacity: 0.15, minHeight: 56 }}
                    textStyle={{ color: '#064E3B', fontWeight: '900', fontSize: 16 }}
                  />
                  
                  {onShowHistory && (
                    <Pressable
                      onPress={onShowHistory}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        borderRadius: RADIUS.lg,
                        paddingVertical: 14,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        width: '100%'
                      }}
                    >
                      <Feather name="clock" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>My History</Text>
                    </Pressable>
                  )}
                </Animated.View>
              </Animated.View>
            </View>

            {/* Bottom Area: Disclaimer & Links (Also fades in with content) */}
            <Animated.View style={{ alignItems: 'center', marginTop: SPACING.xl, opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg }}>
                <Feather name="info" size={14} color="#6EE7B7" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={{ fontSize: 13, color: '#A7F3D0', textAlign: 'center', flexShrink: 1, lineHeight: 18, opacity: 0.8 }}>
                  This app is not a replacement for professional medical advice. Please seek a healthcare provider for diagnosis.
                </Text>
              </View>

            {/* Bottom row: About link | Admin link */}
            <View style={[styles.bottomRow, { marginTop: 0 }]}>
              <Pressable onPress={onAboutPress} style={styles.bottomLink}>
                <Feather name="info" size={13} color="#6EE7B7" />
                <Text style={styles.bottomLinkText}>  About</Text>
              </Pressable>

              <View style={styles.dotSep} />

              <Pressable onPress={isLoadingPin ? undefined : handleAdminPress} style={styles.bottomLink}>
                {isLoadingPin ? (
                  <ActivityIndicator size="small" color={COLORS.brandBlue} />
                ) : (
                  <>
                    <Feather name="settings" size={13} color={COLORS.textMuted} />
                    <Text style={styles.bottomLinkText}>  Admin</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Splash ────────────────────────────────────────────────────────────────
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    borderRadius: 32,
    marginBottom: SPACING.lg,
  } as const,
  splashTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.brandNavy,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  splashTagline: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandBlue,
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
