import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, Animated, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export default function PrimaryButton({ label, onPress, iconName, disabled = false, style, textStyle }: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <View style={styles.leftContent}>
          {iconName && (
            <Feather name={iconName} size={18} color={COLORS.textOnGreen} style={styles.icon} />
          )}
          <Text style={[styles.label, disabled && styles.labelDisabled, textStyle]}>{label}</Text>
        </View>
        
        <View style={styles.arrowBox}>
          <Feather name="chevron-right" size={16} color={COLORS.brandGreen} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#78d596', // Slightly softer green matching inspo
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingLeft: SPACING.xl,
    paddingRight: 8,
    minHeight: 60,
    ...SHADOW.md,
    shadowColor: COLORS.brandGreen,
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderLight,
    shadowOpacity: 0,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textOnGreen,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
  arrowBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
});
